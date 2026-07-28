/* =========================================================================
   ai-recognize.js — распознавание товарных позиций через Claude API.

   Подключается ПОСЛЕ app.js. Перехватывает readFileItems: сначала пробует
   ИИ (через прокси /api/anthropic), при недоступности API откатывается на
   штатный локальный парсер. Возвращает позиции в том же формате, что и
   app.js, поэтому вся дальнейшая обработка (объединение, распределение
   брутто, сверка, выгрузка XLSX) работает без изменений.
   ========================================================================= */
"use strict";

(function () {
  /* Модель задаётся на сервере (ANTHROPIC_MODEL); клиент её не навязывает. */
  const MAX_PDF_PAGES = 6;      // ограничение страниц для сканов (стоимость/размер)
  const RENDER_SCALE = 2;       // масштаб рендера страницы скана в картинку

  const SYSTEM_PROMPT =
    "Ты — парсер коммерческих документов ВЭД (инвойсы, упаковочные листы, " +
    "спецификации) на русском, английском и китайском. Извлекаешь только " +
    "реальные товарные позиции. Отвечаешь ТОЛЬКО валидным JSON-массивом — " +
    "без markdown-обёрток, без пояснений, без текста до или после.";

  const SCHEMA_INSTRUCTION = `Извлеки все товарные позиции документа в JSON-массив. Каждый элемент:
{
  "name": "наименование товара как в документе, целиком (строка)",
  "nameRu": "наименование товара на русском языке (см. правила ниже)",
  "nameForeign": "наименование товара на иностранном языке, или пустая строка",
  "nameTranslated": true | false,   // true, если "nameRu" — твой перевод, а не текст документа
  "article": "артикул / код изделия, или пустая строка",
  "brand": "марка / торговая марка товара, или пустая строка",
  "model": "модель товара, или пустая строка",
  "maker": "изготовитель / производитель товара, или пустая строка",
  "unitRaw": "единица измерения как в документе (шт, pcs, кг, компл, pair...), или пустая строка",
  "qty": число или null,        // количество
  "price": число или null,      // цена за единицу
  "total": число или null,      // общая стоимость строки
  "netUnit": число или null,    // вес нетто за единицу, кг
  "netTotal": число или null,   // вес нетто общий по строке, кг
  "gross": число или null,      // вес брутто, кг
  "place": "№ грузового места, или пустая строка"
}

Правила:
- Только товарные строки. Пропускай «Итого/Всего/Total/Grand total», реквизиты, банковские данные, адреса, подписи, габариты, служебные строки.
- Числа возвращай числами (десятичный разделитель — точка), а не строками. Если значения в документе нет — null. Ничего не выдумывай.
- unitRaw — ровно как в документе, без нормализации в коды.
- Если один товар лежит в нескольких грузовых местах — сделай отдельный элемент на каждое место со своим "place" и своими весами.
- Наименование бери максимально полное, не вырезай из него марку/модель — "name" остаётся как в документе.
- Наименование по языкам ("nameRu" / "nameForeign" / "nameTranslated") — строго по трём случаям:
  1) в документе наименование дано на двух языках (через «/», в скобках, второй строкой, в соседней колонке) — русский текст в "nameRu", иностранный в "nameForeign", "nameTranslated": false;
  2) в документе наименование только на русском — весь текст в "nameRu", "nameForeign" оставь пустой строкой, "nameTranslated": false;
  3) в документе наименование только на иностранном языке — исходный текст в "nameForeign", а в "nameRu" помести СВОЙ перевод на русский и поставь "nameTranslated": true.
  Перевод делай техническим, пригодным для графы 31 декларации на товары; артикулы, коды, типоразмеры, обозначения стандартов и латинские написания марок оставляй как есть.
  Латинскую марку/модель внутри русского наименования отдельным иностранным наименованием НЕ считай (например, «Подшипник SKF 6205» — это только "nameRu").
- brand/model/maker: сначала смотри отдельные колонки документа (Brand, Trademark, Model, Manufacturer, Марка, Модель, Изготовитель и т. п.); если отдельной колонки нет — определи их по тексту наименования товара (например, «Подшипник SKF 6205» → brand "SKF", model "6205"; «Насос масляный, изготовитель ООО Ромб» → maker "ООО Ромб"). Если оснований недостаточно — оставляй пустую строку, не угадывай.
- article — короткий код (номер по каталогу/накладной), а НЕ вторая (например, англоязычная) строка описания того же товара. Если под наименованием на другом языке или в скобках идёт целое повторное описание без явного отдельного кода — не копируй его целиком в article; возьми из него только явный отдельно стоящий буквенно-цифровой код (если он есть) как model, а если такого кода нет — оставь article пустым.

Верни только JSON-массив (может быть пустым []).`;

  /* ---------- Извлечение содержимого документа ---------------------------- */

  async function pdfText(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      text += content.items.map((i) => i.str).join(" ") + "\n";
    }
    return text;
  }

  async function pdfToImages(file) {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const images = [];
    const n = Math.min(pdf.numPages, MAX_PDF_PAGES);
    for (let p = 1; p <= n; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
      images.push(canvas.toDataURL("image/png").split(",")[1]);
    }
    return { images, truncated: pdf.numPages > n, total: pdf.numPages };
  }

  async function getDocContent(file) {
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      let text = "";
      for (const name of wb.SheetNames) {
        text += `# Лист: ${name}\n` + XLSX.utils.sheet_to_csv(wb.Sheets[name]) + "\n\n";
      }
      return { type: "text", text };
    }

    if (ext === "docx") {
      const buf = await file.arrayBuffer();
      const res = await mammoth.extractRawText({ arrayBuffer: buf });
      return { type: "text", text: res.value };
    }

    if (ext === "txt") {
      return { type: "text", text: await file.text() };
    }

    if (ext === "pdf") {
      const t = await pdfText(file);
      /* Есть текстовый слой — работаем по тексту; иначе это скан → картинки. */
      if (t.replace(/\s/g, "").length > 40) return { type: "text", text: t };
      const { images, truncated, total } = await pdfToImages(file);
      if (truncated && typeof state !== "undefined" && Array.isArray(state.notes)) {
        state.notes.push(
          `«${file.name}»: скан на ${total} стр., распознаны первые ${MAX_PDF_PAGES}. ` +
          `Остальные пропущены (ограничение по стоимости запроса).`);
      }
      return { type: "images", images };
    }

    return { type: "text", text: await file.text() };
  }

  /* ---------- Вызов Claude через прокси ----------------------------------- */

  async function callClaude(userContent) {
    const res = await fetch("/api/anthropic", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system: SYSTEM_PROMPT,
        max_tokens: 8000,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "HTTP " + res.status);
    return (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("");
  }

  function parseJsonLoose(text) {
    let t = String(text).trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const a = t.indexOf("["), b = t.lastIndexOf("]");
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    return JSON.parse(t);
  }

  /* ---------- Приведение к формату позиций app.js ------------------------- */

  const num = (v) => {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    const n = parseFloat(String(v).replace(/\s/g, "").replace(",", "."));
    return isFinite(n) ? n : null;
  };
  const str = (v) => (v === null || v === undefined ? "" : String(v).trim());

  function toItem(o, source) {
    return {
      source,
      /* "name" — рабочее поле для слияния позиций между файлами; если ИИ его
         не вернул, берём любое из языковых наименований. */
      name: str(o.name) || str(o.nameRu) || str(o.nameForeign),
      nameRu: str(o.nameRu),
      nameForeign: str(o.nameForeign),
      nameTranslated: o.nameTranslated === true,
      article: str(o.article),
      brand: str(o.brand),
      model: str(o.model),
      maker: str(o.maker),
      unitRaw: str(o.unitRaw),
      qty: num(o.qty),
      price: num(o.price),
      total: num(o.total),
      netUnit: num(o.netUnit),
      netTotal: num(o.netTotal),
      gross: num(o.gross),
      place: str(o.place),
      mathErrors: [],   // математическую сверку downstream не ломает пустой массив
    };
  }

  /* Подстраховка: если ИИ не определил марку/модель, пробуем локальную эвристику
     parseNameParts (та же, что использует локальный парсер app.js) по названию. */
  function fillBrandModelFallback(it) {
    if ((!it.brand || !it.model) && typeof parseNameParts === "function") {
      const p = parseNameParts(it.name);
      if (!it.brand && p.brand) it.brand = p.brand;
      if (!it.model && p.model) it.model = p.model;
    }
    return it;
  }

  async function aiExtract(file) {
    const content = await getDocContent(file);
    let userContent;
    if (content.type === "images") {
      userContent = content.images.map((b64) => ({
        type: "image",
        source: { type: "base64", media_type: "image/png", data: b64 },
      }));
      userContent.push({ type: "text", text: SCHEMA_INSTRUCTION });
    } else {
      userContent = [{
        type: "text",
        text: SCHEMA_INSTRUCTION + "\n\n=== ДОКУМЕНТ ===\n" + content.text,
      }];
    }
    const answer = await callClaude(userContent);
    const arr = parseJsonLoose(answer);
    if (!Array.isArray(arr)) throw new Error("ИИ вернул не JSON-массив");
    return arr.map((o) => toItem(o, file.name))
      .filter((it) => it.name || it.article)
      .map(fillBrandModelFallback);
  }

  /* ---------- Перехват readFileItems: ИИ → фолбэк на локальный парсер ------ */

  if (typeof window.readFileItems !== "function") {
    console.warn("ai-recognize: readFileItems не найден — модуль не активирован.");
    return;
  }
  const localReader = window.readFileItems;

  window.readFileItems = async function (file) {
    try {
      if (typeof setStatus === "function") setStatus(`ИИ распознаёт: ${file.name}…`);
      return await aiExtract(file);
    } catch (err) {
      if (typeof state !== "undefined" && Array.isArray(state.notes)) {
        state.notes.push(
          `ИИ недоступен для «${file.name}» (${err.message}) — обработано локальным парсером.`);
      }
      return localReader(file);
    }
  };

  console.log("ai-recognize: ИИ-распознавание активно (фолбэк на локальный парсер).");
})();
