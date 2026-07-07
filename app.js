/* =========================================================================
   Таблица товаров для «Заполнителя» (Альта-Софт)
   Вся обработка выполняется в браузере. Файлы никуда не отправляются.
   ========================================================================= */
"use strict";

/* ---------- Классификатор единиц измерения (ОКЕИ, основные позиции) ---- */
const OKEI = [
  { re: /^(шт|шту?к[аи]?|штук|pcs?|pc|pce|piece?s?|ea|each|единиц[аы]?)\.?$/i, num: "796", let: "шт"    },
  { re: /^(кг|килограмм(ов|а)?|kgs?|kilogram?s?)\.?$/i,                        num: "166", let: "кг"    },
  { re: /^(г|гр|грамм(ов|а)?|g|gr|grams?)\.?$/i,                               num: "163", let: "г"     },
  { re: /^(т|тонн[аы]?|t|ton(ne)?s?|mt)\.?$/i,                                 num: "168", let: "т"     },
  { re: /^(м|метр(ов|а)?|m|meters?|metres?)\.?$/i,                             num: "006", let: "м"     },
  { re: /^(см|сантиметр(ов|а)?|cm)\.?$/i,                                      num: "004", let: "см"    },
  { re: /^(мм|миллиметр(ов|а)?|mm)\.?$/i,                                      num: "003", let: "мм"    },
  { re: /^(пог\.?\s?м|п\.?м|погонн\w*\s*метр\w*)\.?$/i,                        num: "018", let: "пог. м"},
  { re: /^(м2|м²|кв\.?\s?м|sq\.?\s?m|sqm|m2)\.?$/i,                            num: "055", let: "м2"    },
  { re: /^(м3|м³|куб\.?\s?м|cbm|m3)\.?$/i,                                     num: "113", let: "м3"    },
  { re: /^(л|литр(ов|а)?|l|ltr|liters?|litres?)\.?$/i,                         num: "112", let: "л"     },
  { re: /^(мл|миллилитр(ов|а)?|ml)\.?$/i,                                      num: "111", let: "см3"   },
  { re: /^(пар[аы]?|pairs?|pr)\.?$/i,                                          num: "715", let: "пар"   },
  { re: /^(компл(ект(ов|а)?)?|sets?|kit)\.?$/i,                                num: "839", let: "компл" },
  { re: /^(набор(ов|а)?)\.?$/i,                                                num: "704", let: "набор" },
  { re: /^(упак(овок|овка|овки)?|уп|packs?|packages?|pkg)\.?$/i,               num: "778", let: "упак"  },
  { re: /^(рул(он(ов|а)?)?|rolls?)\.?$/i,                                      num: "736", let: "рул"   },
  { re: /^(лист(ов|а)?|sheets?)\.?$/i,                                         num: "625", let: "л."    },
  { re: /^(бухт[аы]?|coils?)\.?$/i,                                            num: "868", let: "бухта" },
  { re: /^(флак(он(ов|а)?)?|bottles?|btl)\.?$/i,                               num: "872", let: "флак"  },
];

function unitCodes(raw) {
  if (!raw) return { num: "", let: "" };
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, " ");
  /* Если в колонке единицы измерения стоит цифровой код ОКЕИ — распознаём его. */
  if (/^\d{3}$/.test(s)) {
    const byNum = OKEI.find((u) => u.num === s);
    if (byNum) return { num: byNum.num, let: byNum.let };
  }
  for (const u of OKEI) if (u.re.test(s)) return { num: u.num, let: u.let };
  return { num: "", let: "" };
}

/* ---------- Ключевые слова для поиска колонок --------------------------- */
/* Порядок важен: более специфичные поля проверяются раньше. */
const FIELD_PATTERNS = [
  ["netUnit",  /нетто[^а-я]*(ед|за\s*ед|единиц)|вес\s*ед[^а-я]*нетто|net\s*weight\s*(per\s*)?(unit|pc)|unit\s*net/i],
  ["netTotal", /нетто|net\s*w(eigh)?t|n\.?\s?w\.?(?![a-z])/i],
  ["gross",    /брутто|gross\s*w(eigh)?t|g\.?\s?w\.?(?![a-z])/i],
  ["price",    /цена|price|стоимость\s*(за\s*)?ед|rate(?!d)/i],
  ["total",    /стоимост|сумма|amount|total\s*(price|value|cost)|итого\s*стоим|value/i],
  ["qty",      /кол-?\s?во|количеств|qty|quantity|кол\.(?!\s*ед)/i],
  ["unit",     /ед\.?\s?изм|единиц[аы]\s*измерени|^unit s?$|^ед\.?$|measure/i],
  ["article",  /артикул|код\s*(изделия|товара)|модель|изделие|model|article|part\s*(no|№|number)|item\s*(no|№|code)|sku|art\.?(?![a-z])|ref\.?\s*(no|№)?/i],
  ["place",    /груз\w*\s*мест|мест[оа]\s*№?|№\s*мест|place|package\s*(no|№|number)?|box\s*(no|№|number)?|carton|кор(об|обк)\w*|паллет|pallet|case\s*(no|№)/i],
  ["name",     /наименован|назван|описан|товар|description|goods|name|item(?!\s*(no|№|code))|product|commodity/i],
];

function detectField(headerText) {
  const h = String(headerText || "").trim();
  if (!h) return null;
  for (const [field, re] of FIELD_PATTERNS) if (re.test(h)) return field;
  return null;
}

/* ---------- Утилиты ------------------------------------------------------ */
function parseNum(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  let s = String(v).replace(/[\s\u00A0\u202F]/g, "").replace(/[₽$€¥£]|usd|eur|rub|cny|руб\.?/gi, "");
  if (!s) return null;
  if (s.includes(".") && s.includes(",")) {
    // европейский формат 1.234,56
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else s = s.replace(",", ".");
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

const round3 = (n) => Math.round(n * 1000) / 1000;
const round2 = (n) => Math.round(n * 100) / 100;
const normKey = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const isTotalsRow = (s) => /^\s*(итого|всего|итог|grand\s*total|total|sum)([\s:.,]|$)/i.test(String(s || ""));
/* Заглушки вида «--», «—», «n/a» считаем пустым значением. */
const cleanVal = (v) => {
  const s = String(v ?? "").trim();
  return /^[-–—_.\s]*$|^(n\/?a|нет|б\/н)$/i.test(s) ? "" : s;
};
const hasLetters = (s) => /[A-Za-zА-Яа-яЁё]{3,}/.test(String(s || ""));
const hasCyrillic = (s) => /[А-Яа-яЁё]/.test(String(s || ""));

/* ---------- Состояние ---------------------------------------------------- */
const state = { files: [], rows: [], notes: [] };

const $ = (id) => document.getElementById(id);
const dropZone  = $("drop-zone");
const fileInput = $("file-input");
const fileList  = $("file-list");
const buildBtn  = $("build-btn");
const clearBtn  = $("clear-btn");
const exportBtn = $("export-btn");
const statusEl  = $("status");

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

/* ---------- Загрузка файлов ---------------------------------------------- */
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
});
["dragenter", "dragover"].forEach((ev) =>
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.add("is-over"); }));
["dragleave", "drop"].forEach((ev) =>
  dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.remove("is-over"); }));
dropZone.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });

function addFiles(list) {
  for (const f of list) {
    if (!/\.(xlsx|xls|csv|pdf|docx|txt)$/i.test(f.name)) {
      setStatus(`Файл «${f.name}» пропущен — формат не поддерживается.`, true);
      continue;
    }
    if (!state.files.some((x) => x.name === f.name && x.size === f.size)) state.files.push(f);
  }
  renderFileList();
}

function renderFileList() {
  fileList.innerHTML = "";
  state.files.forEach((f, i) => {
    const li = document.createElement("li");
    const kind = f.name.split(".").pop().toUpperCase();
    li.innerHTML =
      `<span class="f-kind">${kind}</span>` +
      `<span class="f-name" title="${f.name}">${f.name}</span>` +
      `<span class="f-info">${(f.size / 1024).toFixed(0)} КБ</span>`;
    const del = document.createElement("button");
    del.type = "button"; del.textContent = "✕"; del.setAttribute("aria-label", `Удалить ${f.name}`);
    del.addEventListener("click", () => { state.files.splice(i, 1); renderFileList(); });
    li.appendChild(del);
    fileList.appendChild(li);
  });
  buildBtn.disabled = clearBtn.disabled = state.files.length === 0;
}

clearBtn.addEventListener("click", () => {
  state.files = []; state.rows = []; state.notes = [];
  renderFileList(); $("result-panel").hidden = true; setStatus("");
});

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle("is-error", isError);
}

/* ---------- Чтение файлов ------------------------------------------------ */
async function readFileItems(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return readSpreadsheet(file);
  if (ext === "pdf")  return readPdf(file);
  if (ext === "docx") return readDocx(file);
  if (ext === "txt")  return readTxt(file);
  return [];
}

async function readSpreadsheet(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const items = [];
  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: "", raw: true });
    items.push(...extractFromGrid(rows, file.name));
  }
  return items;
}

/* Поиск строки заголовка и извлечение данных из двумерного массива. */
function extractFromGrid(rows, fileName) {
  let headerIdx = -1, colMap = null, bestScore = 0;
  /* Шапка документа (реквизиты, адреса) может занимать десятки строк —
     ищем строку заголовка таблицы по всему листу. */
  for (let r = 0; r < rows.length; r++) {
    const map = {};
    let score = 0;
    rows[r].forEach((cell, c) => {
      const f = detectField(cell);
      if (f && !(f in map)) { map[f] = c; score++; }
    });
    if (score >= 2 && score > bestScore) { bestScore = score; headerIdx = r; colMap = map; }
  }
  if (headerIdx < 0) return [];

  const items = [];
  let lastPlace = ""; // № места часто указан только на первой строке места — наследуем вниз
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (f) => (f in colMap ? row[colMap[f]] : "");
    const name = cleanVal(get("name"));
    const article = cleanVal(get("article"));
    if (!name && !article) continue;
    if (isTotalsRow(name) || isTotalsRow(row[0]) || isTotalsRow(get("article"))) continue;
    /* Отсеиваем строки нумерации граф («1», «1а», «2а»…) и прочий мусор:
       в наименовании должно быть хотя бы 3 буквы подряд, либо внятный артикул. */
    if (!hasLetters(name) && !(article.length >= 4)) continue;
    /* Двухстрочные заголовки (EN + RU): если ячейки строки сами похожи
       на названия колонок — это продолжение шапки, а не товар. */
    let headerish = 0;
    for (const c of Object.values(colMap)) {
      const v = String(row[c] ?? "").trim();
      if (v && detectField(v)) headerish++;
    }
    if (headerish >= 2) continue;

    let place = cleanVal(get("place"));
    if ("place" in colMap) {
      if (place) lastPlace = place;
      else place = lastPlace;
    }

    const unitRaw = cleanVal(get("unit"));
    const item = {
      source: fileName,
      name, article,
      unitRaw,
      qty:      parseNum(cleanVal(get("qty"))),
      price:    parseNum(cleanVal(get("price"))),
      total:    parseNum(cleanVal(get("total"))),
      netUnit:  parseNum(cleanVal(get("netUnit"))),
      netTotal: parseNum(cleanVal(get("netTotal"))),
      gross:    parseNum(cleanVal(get("gross"))),
      place,
    };
    if (item.qty === null && item.total === null && item.netTotal === null && !item.article) continue;
    items.push(item);
  }
  return mergeTranslations(items);
}

/* Двуязычные документы: один и тот же товар идёт двумя строками — русской
   и английской (перевод), с одинаковыми количеством, ценой и стоимостью.
   Латинскую строку-перевод склеиваем с русской, не суммируя. */
function mergeTranslations(items) {
  const eq = (a, b) => (a === null && b === null) || (a !== null && b !== null && Math.abs(a - b) < 0.01);
  const cyr = items.filter((it) => hasCyrillic(it.name));
  if (!cyr.length) return items;
  const used = new Set();
  const absorbed = new Set();
  for (const it of items) {
    if (hasCyrillic(it.name)) continue;
    const twin = cyr.find((c) =>
      !used.has(c) &&
      eq(c.qty, it.qty) && eq(c.total, it.total) && eq(c.price, it.price) &&
      (!it.article || !c.article || normKey(it.article) === normKey(c.article)) &&
      (!it.place || !c.place || c.place === it.place)
    );
    if (twin) {
      used.add(twin);
      absorbed.add(it);
      if (!twin.article && it.article) twin.article = it.article;
      if (!twin.unitRaw && it.unitRaw) twin.unitRaw = it.unitRaw;
      if (twin.netTotal === null) twin.netTotal = it.netTotal;
      if (twin.netUnit === null)  twin.netUnit  = it.netUnit;
      if (twin.gross === null)    twin.gross    = it.gross;
      if (!twin.place && it.place) twin.place   = it.place;
    }
  }
  return items.filter((it) => !absorbed.has(it));
}

/* PDF: извлекаем текст постранично, собираем строки по вертикальной позиции. */
async function readPdf(file) {
  if (!window.pdfjsLib) throw new Error("Библиотека pdf.js не загрузилась. Проверьте доступ в интернет.");
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const lines = new Map(); // y → items[]
    for (const it of content.items) {
      const y = Math.round(it.transform[5]);
      let key = null;
      for (const k of lines.keys()) if (Math.abs(k - y) <= 2) { key = k; break; }
      if (key === null) { key = y; lines.set(key, []); }
      lines.get(key).push({ x: it.transform[4], str: it.str });
    }
    const sorted = [...lines.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, parts] of sorted) {
      parts.sort((a, b) => a.x - b.x);
      let line = "", prevEnd = null;
      for (const part of parts) {
        if (prevEnd !== null && part.x - prevEnd > 8) line += "\t";
        line += part.str;
        prevEnd = part.x + part.str.length * 4;
      }
      text += line + "\n";
    }
    text += "\n";
  }
  return extractFromText(text, file.name);
}

async function readDocx(file) {
  if (!window.mammoth) throw new Error("Библиотека mammoth не загрузилась. Проверьте доступ в интернет.");
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return extractFromText(res.value, file.name);
}

async function readTxt(file) {
  return extractFromText(await file.text(), file.name);
}

/* Текстовые документы: строим «сетку» из строк, разделённых табами / 2+ пробелами / «;»,
   затем применяем ту же логику поиска заголовков, что и для таблиц. */
function extractFromText(text, fileName) {
  const rawLines = text.split(/\r?\n/).map((l) => l.replace(/\u00A0/g, " ")).filter((l) => l.trim());
  const grid = rawLines.map((l) => l.split(/\t|;| {2,}/).map((c) => c.trim()).filter((c, i, a) => !(c === "" && i === a.length - 1)));
  const items = extractFromGrid(grid, fileName);
  if (items.length) return items;

  /* Резервный разбор: строки вида «Наименование, арт. XXX, 10 шт, 25,00».
     Берём только строки с явно обозначенным артикулом, чтобы не создавать шум. */
  const fallback = [];
  for (const line of rawLines) {
    if (isTotalsRow(line)) continue;
    const artMatch = line.match(/(?:арт(?:икул)?\.?|art\.?(?!icle)|модель|model|sku|код\s*изделия)[:\s№]*([A-Za-z0-9\-\/\.]{2,})/i);
    if (!artMatch || !/[A-Za-zА-Яа-я]{3,}/.test(line)) continue;
    const unitM = line.match(/(\d[\d\s\u00A0]*(?:[.,]\d+)?)\s*(шт|кг|компл\w*|пар[аы]?|упак\w*|набор\w*|рул\w*|м2|м3|pcs?|kg|sets?|pairs?)\.?(?=[\s.,;)]|$)/i);
    fallback.push({
      source: fileName,
      name: line.replace(/\t/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 200),
      article: artMatch[1],
      unitRaw: unitM ? unitM[2] : "",
      qty: unitM ? parseNum(unitM[1]) : null,
      price: null, total: null,
      netUnit: null, netTotal: null, gross: null, place: "",
    });
  }
  return fallback;
}

/* ---------- Объединение и сверка ----------------------------------------- */
function mergeItems(allItems) {
  /* 1. Внутри файла: объединяем дубликаты по (наименование+артикул+место). */
  const perFile = new Map(); // file → Map(key → item)
  for (const it of allItems) {
    const fkey = it.source;
    if (!perFile.has(fkey)) perFile.set(fkey, new Map());
    const m = perFile.get(fkey);
    const key = normKey(it.name) + "|" + normKey(it.article) + "|" + normKey(it.place);
    if (!m.has(key)) m.set(key, { ...it });
    else {
      const ex = m.get(key);
      ["qty", "total", "netTotal", "gross"].forEach((f) => {
        if (it[f] !== null) ex[f] = (ex[f] ?? 0) + it[f];
      });
      ["price", "netUnit"].forEach((f) => { if (ex[f] === null) ex[f] = it[f]; });
      if (!ex.unitRaw) ex.unitRaw = it.unitRaw;
    }
  }

  /* 2. Между файлами группируем ПО НАИМЕНОВАНИЮ: в инвойсе артикула может
     не быть, а в упаковочном листе он есть — жёсткий ключ «имя+артикул»
     помешал бы объединению. Если под одним наименованием встречаются РАЗНЫЕ
     артикулы — разводим по артикулам (это разные товары). */
  const byName = new Map(); // normName → parts[]
  for (const [, m] of perFile) {
    for (const [, it] of m) {
      const nkey = normKey(it.name) || "«без наименования» " + normKey(it.article);
      if (!byName.has(nkey)) byName.set(nkey, []);
      byName.get(nkey).push(it);
    }
  }

  const byGoods = new Map(); // итоговые группы (порядок вставки = порядок появления)
  for (const [nkey, parts] of byName) {
    const arts = [...new Set(parts.map((p) => normKey(p.article)).filter(Boolean))];
    if (arts.length <= 1) {
      byGoods.set(nkey, parts);
    } else {
      /* одно имя, разные артикулы → отдельные товары; части без артикула
         остаются собственной группой (однозначно отнести их нельзя) */
      for (const p of parts) {
        const sub = nkey + "|" + normKey(p.article);
        if (!byGoods.has(sub)) byGoods.set(sub, []);
        byGoods.get(sub).push(p);
      }
    }
  }

  const rows = [];
  for (const [, parts] of byGoods) {
    /* суммы по каждому файлу — для сверки */
    const byFile = new Map();
    for (const p of parts) {
      if (!byFile.has(p.source)) byFile.set(p.source, { qty: null, total: null, net: null, gross: null });
      const a = byFile.get(p.source);
      if (p.qty !== null)      a.qty   = (a.qty   ?? 0) + p.qty;
      if (p.total !== null)    a.total = (a.total ?? 0) + p.total;
      if (p.netTotal !== null) a.net   = (a.net   ?? 0) + p.netTotal;
      if (p.gross !== null)    a.gross = (a.gross ?? 0) + p.gross;
    }
    const discrepancies = [];
    const check = (field, label, tol) => {
      const vals = [...byFile.values()].map((a) => a[field]).filter((v) => v !== null);
      if (vals.length > 1 && Math.max(...vals) - Math.min(...vals) > tol)
        discrepancies.push(`${label}: ` + [...byFile.entries()]
          .filter(([, a]) => a[field] !== null)
          .map(([f, a]) => `${f} — ${a[field]}`).join(", "));
    };
    check("qty",   "количество", 0.0001);
    check("total", "стоимость",  0.01);
    check("net",   "вес нетто",  0.001);

    /* объединённые данные: берём максимум информации, не удваивая */
    const pick = (sel) => {
      for (const p of parts) { const v = sel(p); if (v !== null && v !== "" && v !== undefined) return v; }
      return null;
    };
    const filesWithQty   = [...byFile.values()].filter((a) => a.qty   !== null);
    const filesWithTotal = [...byFile.values()].filter((a) => a.total !== null);
    const filesWithNet   = [...byFile.values()].filter((a) => a.net   !== null);

    const places = [...new Set(parts.map((p) => p.place).filter(Boolean))];

    /* Нетто и брутто в разрезе мест берём из одного файла (обычно это
       упаковочный лист) — выбираем файл с максимальным покрытием мест,
       чтобы не удваивать вес при пересечении документов. */
    const placeNet = new Map();
    const placeGross = new Map();
    let bestFileForPlaces = null, bestCover = -1;
    for (const [f] of byFile) {
      const cover = parts.filter((p) => p.source === f && p.place).length;
      if (cover > bestCover) { bestCover = cover; bestFileForPlaces = f; }
    }
    for (const p of parts) {
      if (p.source !== bestFileForPlaces) continue;
      const pl = p.place || "";
      if (p.netTotal !== null) placeNet.set(pl, (placeNet.get(pl) ?? 0) + p.netTotal);
      if (p.gross !== null)    placeGross.set(pl, (placeGross.get(pl) ?? 0) + p.gross);
    }

    const qty   = filesWithQty.length   ? Math.max(...filesWithQty.map((a) => a.qty))     : null;
    const total = filesWithTotal.length ? Math.max(...filesWithTotal.map((a) => a.total)) : null;
    const net   = filesWithNet.length   ? Math.max(...filesWithNet.map((a) => a.net))     : null;

    let price = pick((p) => p.price);
    if (price === null && total !== null && qty) price = round2(total / qty);
    let netUnit = pick((p) => p.netUnit);
    if (netUnit === null && net !== null && qty) netUnit = round3(net / qty);
    let totalC = total;
    if (totalC === null && price !== null && qty !== null) totalC = round2(price * qty);

    const unitRaw = pick((p) => p.unitRaw) || "";
    const codes = unitCodes(unitRaw);

    rows.push({
      name: pick((p) => p.name) || "",
      article: pick((p) => p.article) || "",
      unitRaw, unitNum: codes.num, unitLet: codes.let,
      qty, price, total: totalC,
      netUnit, netTotal: net,
      grossParts: placeGross,   // брутто по местам (до распределения)
      netParts: placeNet,       // нетто по местам
      gross: null,              // будет рассчитано распределением
      places,
      flagged: discrepancies.length > 0,
      discrepancies,
    });
  }
  return rows;
}

/* ---------- Распределение брутто по местам -------------------------------
   Брутто грузового места распределяется между товарами этого места
   пропорционально их весу нетто, округление до 3 знаков.               */
function distributeGross(rows) {
  const placeTotals = new Map(); // место → { gross, entries:[{row, net}] }
  for (const row of rows) {
    for (const [pl, g] of row.grossParts) {
      if (!placeTotals.has(pl)) placeTotals.set(pl, { grossVals: [], entries: [] });
      placeTotals.get(pl).grossVals.push(g);
    }
    const placesOfRow = row.netParts.size ? [...row.netParts.keys()] : row.places.length ? row.places : [""];
    for (const pl of placesOfRow) {
      if (!placeTotals.has(pl)) placeTotals.set(pl, { grossVals: [], entries: [] });
      placeTotals.get(pl).entries.push({ row, net: row.netParts.get(pl) ?? null, share: null });
    }
  }

  for (const [pl, info] of placeTotals) {
    const entries = info.entries;
    if (!entries.length) continue;
    /* Брутто места: если у всех строк места указано одно и то же значение —
       это общий вес места; иначе — сумма построчных значений. */
    let placeGross = null;
    if (info.grossVals.length) {
      const uniq = [...new Set(info.grossVals.map((v) => round3(v)))];
      placeGross = (uniq.length === 1 && entries.length > 1) ? uniq[0] : info.grossVals.reduce((s, v) => s + v, 0);
    }
    if (placeGross === null) continue;

    const withNet = entries.filter((e) => e.net !== null && e.net > 0);
    const netSum = withNet.reduce((s, e) => s + e.net, 0);
    if (withNet.length && netSum > 0) {
      let acc = 0;
      withNet.forEach((e, i) => {
        let share = (i === withNet.length - 1) ? round3(placeGross - acc) : round3(placeGross * e.net / netSum);
        acc = round3(acc + share);
        e.row.gross = round3((e.row.gross ?? 0) + share);
      });
    } else if (entries.length === 1) {
      entries[0].row.gross = round3((entries[0].row.gross ?? 0) + placeGross);
    } else {
      /* нет данных нетто — делим поровну */
      let acc = 0;
      entries.forEach((e, i) => {
        let share = (i === entries.length - 1) ? round3(placeGross - acc) : round3(placeGross / entries.length);
        acc = round3(acc + share);
        e.row.gross = round3((e.row.gross ?? 0) + share);
      });
    }
  }
}

/* ---------- Сборка -------------------------------------------------------- */
buildBtn.addEventListener("click", async () => {
  buildBtn.disabled = true;
  setStatus("Читаю документы…");
  state.notes = [];
  try {
    const all = [];
    for (const f of state.files) {
      setStatus(`Обрабатываю: ${f.name}`);
      try {
        const items = await readFileItems(f);
        if (!items.length) state.notes.push(`В файле «${f.name}» табличные данные о товарах не найдены — проверьте документ.`);
        all.push(...items);
      } catch (err) {
        state.notes.push(`Файл «${f.name}» не прочитан: ${err.message}`);
      }
    }
    if (!all.length) {
      setStatus("Данные о товарах не найдены ни в одном файле.", true);
      buildBtn.disabled = false;
      return;
    }
    const rows = mergeItems(all);
    distributeGross(rows);
    /* порядок строк — порядок появления товаров в документах (как в инвойсе) */
    state.rows = rows;
    renderResult();
    setStatus(`Готово: товаров — ${rows.length}, обработано файлов — ${state.files.length}.`);
  } catch (err) {
    setStatus("Ошибка обработки: " + err.message, true);
  }
  buildBtn.disabled = false;
});

/* ---------- Отрисовка ------------------------------------------------------ */
const fmt = (v, dec) => (v === null || v === undefined ? "" :
  Number(v).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: dec }));

function renderResult() {
  const tbody = document.querySelector("#result-table tbody");
  const tfoot = document.querySelector("#result-table tfoot");
  tbody.innerHTML = ""; tfoot.innerHTML = "";
  const sums = { qty: 0, total: 0, net: 0, gross: 0 };

  state.rows.forEach((r, i) => {
    const tr = document.createElement("tr");
    if (r.flagged) { tr.classList.add("is-flagged"); tr.title = r.discrepancies.join("\n"); }
    tr.innerHTML =
      `<td>${i + 1}</td>` +
      `<td class="cell-name">${escapeHtml(r.name)}</td>` +
      `<td>${r.unitNum}</td>` +
      `<td>${r.unitLet}</td>` +
      `<td>${fmt(r.qty, 3)}</td>` +
      `<td>${fmt(r.price, 2)}</td>` +
      `<td>${fmt(r.total, 2)}</td>` +
      `<td class="cell-art">${escapeHtml(r.article)}</td>` +
      `<td>${fmt(r.netUnit, 3)}</td>` +
      `<td>${fmt(r.netTotal, 3)}</td>` +
      `<td>${fmt(r.gross, 3)}</td>` +
      `<td>${escapeHtml(r.places.join(", "))}</td>`;
    tbody.appendChild(tr);
    sums.qty += r.qty ?? 0; sums.total += r.total ?? 0;
    sums.net += r.netTotal ?? 0; sums.gross += r.gross ?? 0;
  });

  tfoot.innerHTML =
    `<tr><td colspan="4">Итого</td>` +
    `<td>${fmt(sums.qty, 3)}</td><td></td><td>${fmt(round2(sums.total), 2)}</td><td></td>` +
    `<td></td><td>${fmt(round3(sums.net), 3)}</td><td>${fmt(round3(sums.gross), 3)}</td><td></td></tr>`;

  const notesEl = $("notes");
  notesEl.innerHTML = "";
  const flaggedCount = state.rows.filter((r) => r.flagged).length;
  if (flaggedCount) {
    const p = document.createElement("p");
    p.className = "n-flag";
    p.textContent = `Расхождения между документами найдены в ${flaggedCount} строк(ах) — они выделены жёлтым; подробности во всплывающей подсказке строки и в файле выгрузки.`;
    notesEl.appendChild(p);
  }
  for (const n of state.notes) {
    const p = document.createElement("p");
    p.textContent = "• " + n;
    notesEl.appendChild(p);
  }
  $("result-panel").hidden = false;
  $("result-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Экспорт в XLSX ------------------------------------------------- */
exportBtn.addEventListener("click", async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Товары", { views: [{ state: "frozen", ySplit: 1 }] });

  ws.columns = [
    { header: "№ п/п",                              key: "n",      width: 7  },
    { header: "Наименование товара",                key: "name",   width: 48 },
    { header: "Код ед. изм. (цифровой)",            key: "unum",   width: 12 },
    { header: "Код ед. изм. (буквенный)",           key: "ulet",   width: 12 },
    { header: "Количество",                         key: "qty",    width: 12 },
    { header: "Цена за единицу",                    key: "price",  width: 14 },
    { header: "Общая стоимость",                    key: "total",  width: 15 },
    { header: "Код изделия / артикул",              key: "art",    width: 18 },
    { header: "Вес нетто за единицу, кг",           key: "netu",   width: 14 },
    { header: "Общий вес нетто, кг",                key: "net",    width: 14 },
    { header: "Общий вес брутто, кг",               key: "gross",  width: 14 },
    { header: "№ грузового места",                  key: "place",  width: 14 },
  ];

  const head = ws.getRow(1);
  head.font = { bold: true, size: 10 };
  head.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  head.height = 30;

  state.rows.forEach((r, i) => {
    const row = ws.addRow({
      n: i + 1,
      name: r.name,
      unum: r.unitNum || "",
      ulet: r.unitLet || "",
      qty: r.qty ?? "",
      price: r.price ?? "",
      total: r.total ?? "",
      art: r.article || "",
      netu: r.netUnit ?? "",
      net: r.netTotal ?? "",
      gross: r.gross ?? "",
      place: r.places.join(", "),
    });
    row.getCell("price").numFmt = "#,##0.00";
    row.getCell("total").numFmt = "#,##0.00";
    row.getCell("netu").numFmt  = "0.000";
    row.getCell("net").numFmt   = "0.000";
    row.getCell("gross").numFmt = "0.000";
    if (r.flagged) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
      });
      const noteCell = row.getCell("name");
      noteCell.note = "Расхождение между документами:\n" + r.discrepancies.join("\n");
    }
  });

  const last = ws.rowCount + 1;
  const totalRow = ws.getRow(last);
  totalRow.getCell(1).value = "Итого";
  totalRow.getCell(5).value  = { formula: `SUM(E2:E${last - 1})` };
  totalRow.getCell(7).value  = { formula: `SUM(G2:G${last - 1})` };
  totalRow.getCell(10).value = { formula: `SUM(J2:J${last - 1})` };
  totalRow.getCell(11).value = { formula: `SUM(K2:K${last - 1})` };
  totalRow.font = { bold: true };
  totalRow.getCell(10).numFmt = "0.000";
  totalRow.getCell(11).numFmt = "0.000";
  totalRow.getCell(7).numFmt  = "#,##0.00";

  ws.eachRow((row) => row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
  }));

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tovary_dlya_zapolnitelya.xlsx";
  a.click();
  URL.revokeObjectURL(a.href);
});
