# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page Russian-language web app for customs declarants ("Заполнитель" helper, Альта-Софт), with two tabs (`tabs.js` switches between them, storing the active tab in `sessionStorage`):

1. **Таблица товаров** (`app.js` + `ai-recognize.js`) — the user uploads commercial documents (invoice, packing list, specification) and the app merges them into one 26-column item table ready to import into the "Заполнитель" program.
2. **Проверка ограничений 311·312·313** (`checker.js`) — cross-checks ТН ВЭД codes against the item lists of Russian government resolutions 311/312/313, which the user supplies as consolidated RTF files (from a legal-reference system export); parsed lists are cached in `localStorage` so they survive a reload. Entirely independent of tab 1's code — it only reuses the SheetJS (`XLSX`) global directly to read the item table (XLSX/XLS/CSV, must have a ТН ВЭД column) and produces its own XLSX export via ExcelJS. Ported from the sibling repo `zapolnitel-app`; see that repo's README for the full spec of the matching logic (prefix match on digits-only codes, exclusions, "проверить" cases, etc.) if extending this block.

All document parsing happens client-side in the browser — files are never uploaded anywhere except when the optional AI-recognition feature (tab 1 only) sends document content to Claude via the app's own proxy server.

There is no build step, no bundler, no test suite, and no linter — this is plain HTML/CSS/JS loading libraries from CDN.

`app.js.bak` in the repo root is a stale snapshot, not loaded by `index.html` — ignore it and don't confuse it with `app.js` when searching/grepping.

## Commands

- Run the app with the AI-recognition proxy: `npm start` (runs `node server.js`, serves static files + `/api/anthropic` on `PORT`, default 3000). Requires `ANTHROPIC_API_KEY` in the environment; optional `ANTHROPIC_MODEL` (default `claude-sonnet-4-5`) and `PROXY_SECRET`.
- Run the app without AI (pure local heuristics, no server needed): open `index.html` directly in a browser. Internet access is still needed to load the CDN libraries.
- No test/lint/build commands exist. To verify a change, load the app (via `npm start` or `index.html`) and upload `examples/invoice_primer.xlsx` + `examples/packing_list_primer.xlsx` — see "Проверка работы" in README.md for the expected merged result (duplicate "Фильтр масляный" rows merged, place №1 gross weight split proportionally by net weight, "Прокладка резиновая" flagged yellow for a qty mismatch between the two files).

## Architecture

**`index.html`** — static shell. Loads CDN libs in order (SheetJS/`xlsx`, ExcelJS, pdf.js, mammoth.js), then `app.js`, then `ai-recognize.js`. The `<thead>` column list and the `graph-strip` in the header are the canonical 26-column schema — keep them in sync with `renderResult()`/export logic in `app.js` if columns change.

**`server.js`** — thin Express app: serves the static files and exposes one endpoint, `POST /api/anthropic`, which injects `ANTHROPIC_API_KEY` server-side and forwards to `https://api.anthropic.com/v1/messages`. This is the only piece of backend in the project; it exists solely so the Anthropic API key never reaches the browser. Deployed on Railway per README.md; GitHub Pages deployment (see README) serves the static files only, so AI recognition is unavailable there (local heuristic parsing still works).

**`app.js`** (~2300 lines) — the whole client-side pipeline, in order:
1. Static classifiers/heuristics: `OKEI` (unit-of-measure regex table → ОКЕИ numeric/letter codes), `COUNTRIES` (ISO 3166-1), `KNOWN_BRANDS`, `parseNameParts` (splits a product name into brand/model/clean name), `FIELD_PATTERNS`/`detectField` (header-text → field-name matching).
2. File readers, dispatched by extension from `readFileItems`: `readSpreadsheet` (xlsx/xls/csv via SheetJS), `readPdf` (pdf.js; if a PDF has no text layer it's treated as a scan and throws a `SCAN:`-prefixed error that the UI renders as a special OCR instructions panel), `readDocx` (mammoth.js), `readTxt`.
3. Extraction over raw rows/text: `extractFromGrid`, `extractFromPdfPages`, `extractFromText` — locate the header row, map columns to fields, filter out totals/junk rows (`isTotalsRow`, `isJunkRow`, `isDocTrailerStart`).
4. Cross-file assembly (triggered from the `build-btn` click handler): `mergeItems` groups items primarily by normalized article number (falling back to name) across all uploaded files and sums qty/total/weights for duplicates; `distributeGross` splits a packing place's gross weight across its items proportional to net weight (remainder assigned to the last item, 3-decimal rounding) — this is the core business rule described in README.md. `buildRowByRow` is the alternate "one row per packing-list line" mode, pulling price by article from invoice files.
5. `applyMathErrors` cross-checks computed totals against footer/document totals and flags mismatches; `renderResult` builds the on-screen table (with note/highlight styling) and the XLSX export path uses ExcelJS to reproduce fills and cell comments for the same mismatches.

**AI recognition has two independent, overlapping layers — know both when debugging "AI didn't recognize this file":**
- `ai-recognize.js` loads after `app.js` and **monkey-patches `window.readFileItems`**: for each file it sends the whole document (text, or rendered page images for scanned PDFs) to Claude through the `/api/anthropic` proxy with a strict JSON-array schema prompt, and only falls back to the original `app.js` local-heuristic `readFileItems` on any failure (network error, bad JSON, proxy down). This is the AI path that actually works end-to-end. The schema (`SCHEMA_INSTRUCTION`) asks Claude to also extract `brand`/`model`/`maker` — from a dedicated document column if present, otherwise inferred from the item name/description — and `toItem()`/`fillBrandModelFallback()` map them onto the item; if Claude leaves brand/model blank, `fillBrandModelFallback` falls back to `app.js`'s `parseNameParts` heuristic on the name (relies on `parseNameParts` being a real global, since neither script uses an IIFE).
- `app.js` itself also contains AI helpers (`_callClaude`, `aiDetectFields`, `aiParseNames`, used inside `readSpreadsheet`/`readPdf`/`extractFromText`) that call `https://api.anthropic.com/v1/messages` **directly from the browser with no API key**. These always fail and are always caught, silently falling back to the local heuristic parsers (`parseNameParts`, `detectField`) — treat them as effectively dead/vestigial rather than a working AI path. `askClaude` (bottom of `app.js`) goes through the proxy correctly but is not called from anywhere.

## Data model

Parsed items carry: `source` (originating file name), `name`, `article`, `unitRaw`/derived ОКЕИ `num`/`let` codes, `qty`, `price`, `total`, `netUnit`, `netTotal`, `gross`, `place`, plus `brand`/`model`/`country`/`maker`/`tnved` where detected, and `mathErrors[]`. Rows in the final table also carry `grossParts`/`netParts` (per-place breakdown, consumed by `distributeGross`) before being flattened for rendering/export.
