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


/* ---------- Классификатор стран мира (ISO 3166-1) ----------------------- */
const COUNTRIES = {
  "AFGHANISTAN":{"a2":"AF","num":"004"},"ALBANIA":{"a2":"AL","num":"008"},
  "ALGERIA":{"a2":"DZ","num":"012"},"ANDORRA":{"a2":"AD","num":"020"},
  "ANGOLA":{"a2":"AO","num":"024"},"ARGENTINA":{"a2":"AR","num":"032"},
  "ARMENIA":{"a2":"AM","num":"051"},"AUSTRALIA":{"a2":"AU","num":"036"},
  "AUSTRIA":{"a2":"AT","num":"040"},"AZERBAIJAN":{"a2":"AZ","num":"031"},
  "BAHRAIN":{"a2":"BH","num":"048"},"BANGLADESH":{"a2":"BD","num":"050"},
  "BELARUS":{"a2":"BY","num":"112"},"BELGIUM":{"a2":"BE","num":"056"},
  "BOLIVIA":{"a2":"BO","num":"068"},"BRAZIL":{"a2":"BR","num":"076"},
  "BULGARIA":{"a2":"BG","num":"100"},"CAMBODIA":{"a2":"KH","num":"116"},
  "CAMEROON":{"a2":"CM","num":"120"},"CANADA":{"a2":"CA","num":"124"},
  "CHILE":{"a2":"CL","num":"152"},"CHINA":{"a2":"CN","num":"156"},
  "COLOMBIA":{"a2":"CO","num":"170"},"CROATIA":{"a2":"HR","num":"191"},
  "CUBA":{"a2":"CU","num":"192"},"CYPRUS":{"a2":"CY","num":"196"},
  "CZECHIA":{"a2":"CZ","num":"203"},"CZECH REPUBLIC":{"a2":"CZ","num":"203"},
  "DENMARK":{"a2":"DK","num":"208"},"ECUADOR":{"a2":"EC","num":"218"},
  "EGYPT":{"a2":"EG","num":"818"},"ESTONIA":{"a2":"EE","num":"233"},
  "ETHIOPIA":{"a2":"ET","num":"231"},"FINLAND":{"a2":"FI","num":"246"},
  "FRANCE":{"a2":"FR","num":"250"},"GEORGIA":{"a2":"GE","num":"268"},
  "GERMANY":{"a2":"DE","num":"276"},"GREECE":{"a2":"GR","num":"300"},
  "HONG KONG":{"a2":"HK","num":"344"},"HUNGARY":{"a2":"HU","num":"348"},
  "ICELAND":{"a2":"IS","num":"352"},"INDIA":{"a2":"IN","num":"356"},
  "INDONESIA":{"a2":"ID","num":"360"},"IRAN":{"a2":"IR","num":"364"},
  "IRAQ":{"a2":"IQ","num":"368"},"IRELAND":{"a2":"IE","num":"372"},
  "ISRAEL":{"a2":"IL","num":"376"},"ITALY":{"a2":"IT","num":"380"},
  "JAPAN":{"a2":"JP","num":"392"},"JORDAN":{"a2":"JO","num":"400"},
  "KAZAKHSTAN":{"a2":"KZ","num":"398"},"KENYA":{"a2":"KE","num":"404"},
  "NORTH KOREA":{"a2":"KP","num":"408"},"SOUTH KOREA":{"a2":"KR","num":"410"},
  "KOREA":{"a2":"KR","num":"410"},"KUWAIT":{"a2":"KW","num":"414"},
  "KYRGYZSTAN":{"a2":"KG","num":"417"},"LATVIA":{"a2":"LV","num":"428"},
  "LEBANON":{"a2":"LB","num":"422"},"LIBYA":{"a2":"LY","num":"434"},
  "LIECHTENSTEIN":{"a2":"LI","num":"438"},"LITHUANIA":{"a2":"LT","num":"440"},
  "LUXEMBOURG":{"a2":"LU","num":"442"},"MALAYSIA":{"a2":"MY","num":"458"},
  "MALTA":{"a2":"MT","num":"470"},"MEXICO":{"a2":"MX","num":"484"},
  "MOLDOVA":{"a2":"MD","num":"498"},"MONACO":{"a2":"MC","num":"492"},
  "MONGOLIA":{"a2":"MN","num":"496"},"MOROCCO":{"a2":"MA","num":"504"},
  "MYANMAR":{"a2":"MM","num":"104"},"NETHERLANDS":{"a2":"NL","num":"528"},
  "NEW ZEALAND":{"a2":"NZ","num":"554"},"NIGERIA":{"a2":"NG","num":"566"},
  "NORTH MACEDONIA":{"a2":"MK","num":"807"},"NORWAY":{"a2":"NO","num":"578"},
  "OMAN":{"a2":"OM","num":"512"},"PAKISTAN":{"a2":"PK","num":"586"},
  "PERU":{"a2":"PE","num":"604"},"PHILIPPINES":{"a2":"PH","num":"608"},
  "POLAND":{"a2":"PL","num":"616"},"PORTUGAL":{"a2":"PT","num":"620"},
  "QATAR":{"a2":"QA","num":"634"},"ROMANIA":{"a2":"RO","num":"642"},
  "RUSSIA":{"a2":"RU","num":"643"},"RUSSIAN FEDERATION":{"a2":"RU","num":"643"},
  "SAUDI ARABIA":{"a2":"SA","num":"682"},"SENEGAL":{"a2":"SN","num":"686"},
  "SERBIA":{"a2":"RS","num":"688"},"SINGAPORE":{"a2":"SG","num":"702"},
  "SLOVAKIA":{"a2":"SK","num":"703"},"SLOVENIA":{"a2":"SI","num":"705"},
  "SOUTH AFRICA":{"a2":"ZA","num":"710"},"SPAIN":{"a2":"ES","num":"724"},
  "SRI LANKA":{"a2":"LK","num":"144"},"SWEDEN":{"a2":"SE","num":"752"},
  "SWITZERLAND":{"a2":"CH","num":"756"},"SYRIA":{"a2":"SY","num":"760"},
  "TAIWAN":{"a2":"TW","num":"158"},"TAJIKISTAN":{"a2":"TJ","num":"762"},
  "THAILAND":{"a2":"TH","num":"764"},"TUNISIA":{"a2":"TN","num":"788"},
  "TURKEY":{"a2":"TR","num":"792"},"TURKIYE":{"a2":"TR","num":"792"},
  "TURKMENISTAN":{"a2":"TM","num":"795"},"UKRAINE":{"a2":"UA","num":"804"},
  "UAE":{"a2":"AE","num":"784"},"UNITED ARAB EMIRATES":{"a2":"AE","num":"784"},
  "UK":{"a2":"GB","num":"826"},"UNITED KINGDOM":{"a2":"GB","num":"826"},
  "GREAT BRITAIN":{"a2":"GB","num":"826"},"USA":{"a2":"US","num":"840"},
  "UNITED STATES":{"a2":"US","num":"840"},"UZBEKISTAN":{"a2":"UZ","num":"860"},
  "VENEZUELA":{"a2":"VE","num":"862"},"VIETNAM":{"a2":"VN","num":"704"},"VIET NAM":{"a2":"VN","num":"704"},"HONG-KONG":{"a2":"HK","num":"344"},"HONG KONG SAR":{"a2":"HK","num":"344"},
  "YEMEN":{"a2":"YE","num":"887"},
  /* Русские названия */
  "ГЕРМАНИЯ":{"a2":"DE","num":"276"},"РОССИЯ":{"a2":"RU","num":"643"},
  "ШВЕЦИЯ":{"a2":"SE","num":"752"},"ПОЛЬША":{"a2":"PL","num":"616"},
  "КИТАЙ":{"a2":"CN","num":"156"},"ЯПОНИЯ":{"a2":"JP","num":"392"},
  "ФРАНЦИЯ":{"a2":"FR","num":"250"},"ИТАЛИЯ":{"a2":"IT","num":"380"},
  "ИНДИЯ":{"a2":"IN","num":"356"},"ТУРЦИЯ":{"a2":"TR","num":"792"},
  "РУМЫНИЯ":{"a2":"RO","num":"642"},"АВСТРИЯ":{"a2":"AT","num":"040"},
  "США":{"a2":"US","num":"840"},"ВЕЛИКОБРИТАНИЯ":{"a2":"GB","num":"826"},
  "БОЛГАРИЯ":{"a2":"BG","num":"100"},"ПОРТУГАЛИЯ":{"a2":"PT","num":"620"},
  "НИДЕРЛАНДЫ":{"a2":"NL","num":"528"},"ФИНЛЯНДИЯ":{"a2":"FI","num":"246"},
  "НОРВЕГИЯ":{"a2":"NO","num":"578"},"ДАНИЯ":{"a2":"DK","num":"208"},
  "ШВЕЙЦАРИЯ":{"a2":"CH","num":"756"},"БЕЛЬГИЯ":{"a2":"BE","num":"056"},
  "ЧЕХИЯ":{"a2":"CZ","num":"203"},"СЛОВАКИЯ":{"a2":"SK","num":"703"},
  "ВЕНГРИЯ":{"a2":"HU","num":"348"},"БЕЛАРУСЬ":{"a2":"BY","num":"112"},
  "УКРАИНА":{"a2":"UA","num":"804"},"КАЗАХСТАН":{"a2":"KZ","num":"398"},
  "ВЬЕТНАМ":{"a2":"VN","num":"704"},"МАЛАЙЗИЯ":{"a2":"MY","num":"458"},
  "ТАИЛАНД":{"a2":"TH","num":"764"},"ИЗРАИЛЬ":{"a2":"IL","num":"376"},
  "ИРАН":{"a2":"IR","num":"364"},"КОРЕЯ":{"a2":"KR","num":"410"},
};

function countryByName(raw) {
  if (!raw) return { name: "", a2: "", num: "" };
  /* может быть "FAG\nGERMANY" — берём последнюю строку */
  const lines = String(raw).trim().split(/\n|\r/);
  const last = lines[lines.length - 1].trim().toUpperCase();
  const entry = COUNTRIES[last];
  if (entry) return { name: lines[lines.length - 1].trim(), a2: entry.a2, num: entry.num };
  /* Частичное совпадение по началу */
  for (const [k, v] of Object.entries(COUNTRIES)) {
    if (last.startsWith(k) || k.startsWith(last)) return { name: lines[lines.length - 1].trim(), a2: v.a2, num: v.num };
  }
  return { name: lines[lines.length - 1].trim(), a2: "", num: "" };
}

/* Если первая строка — известный бренд, а не страна — извлекаем её отдельно */
function brandFromCountryCol(raw) {
  if (!raw) return "";
  const lines = String(raw).trim().split(/\n|\r/);
  if (lines.length < 2) return "";
  const first = lines[0].trim();
  /* Если это не страна — считаем брендом */
  const isCountry = COUNTRIES[first.toUpperCase()];
  return isCountry ? "" : first;
}


/* ---------- Разбивка «артикул + бренд» ---------------------------------- */
/* В документах Agricos артикул = "22344-BE-XL FAG" → арт + бренд через пробел. */
const KNOWN_BRANDS = new Set([
  "FAG","SKF","NSK","NTN","TIMKEN","INA","KOYO","NACHI","SNR","RHP",
  "HRB","LYC","ZWZ","ASAHI","FYH","NMB","PEER","RBC","SL","URB",
  "CRAFT","RUVILLE","BOSCH","ZF","SACHS","VALEO","LUK","IHC","GATES",
  "MANN","MAHLE","ELRING","VICTOR REINZ","GLASER","GOETZE","KOLBENSCHMIDT",
  "MAHLE","GLYCO","GLYCODUR","FEDERAL MOGUL","DELPHI","DENSO","CONTINENTAL",
  "SIEMENS","ABB","SCHAEFFER","IGUS","REXNORD","DODGE","SEALMASTER",
  "UCFC","UCF","UCFL","UCFB","UCFCX","UCFCF","UCFCFL",
  "3M","SKF","KLUBER","MOLYKOTE","CASTROL","SHELL","MOBIL","TOTAL",
]);

/* Разбивает строку «наименование [марка] [модель] [артикул]» на части.
   
   Логика для кириллических строк (есть хотя бы одно кириллическое слово):
   1. Начальные кириллические слова → наименование товара
   2. Следующее слово, если оно начинается с заглавной и не похоже на код (≥2 букв, нет цифр
      в первых 2 символах) → марка
   3. Следующее слово аналогично → модель
   4. Остаток (если есть цифро-буквенный код) → артикул (не перезаписывает уже найденный)
   
   Логика для чисто латинских/цифровых строк:
   — Если в конце стоит известный бренд → brand, остальное → cleanName
   — Иначе → cleanName = вся строка (не угадываем) */
function parseNameParts(raw) {
  if (!raw) return { cleanName: "", brand: "", model: "" };
  const s = String(raw).trim();
  const tokens = s.split(/\s+/);
  
  /* 1. Известный бренд в конце латинской строки: "22344-BE-XL FAG" */
  if (tokens.length >= 2 && KNOWN_BRANDS.has(tokens[tokens.length - 1].toUpperCase())) {
    const brand = tokens[tokens.length - 1];
    const cleanName = tokens.slice(0, -1).join(" ");
    return { cleanName, brand, model: "" };
  }

  /* 2. Кириллическая строка — разбиваем по смысловым зонам */
  const hasCyr = /[А-Яа-яЁё]/.test(s);
  if (!hasCyr) return { cleanName: s, brand: "", model: "" };

  let i = 0;
  const nameParts = [];

  /* Проверка: является ли токен вероятным кодом изделия/артикулом (не маркой)?
     Критерии: содержит цифры в первых 4 символах ИЛИ вся строка короче 3 букв подряд */
  const isCode = (tok) => {
    if (!tok) return false;
    if (/^\d/.test(tok)) return true;             // начинается с цифры
    if (/^[A-Za-z]{1,3}\d/.test(tok)) return true; // 1-3 буквы + цифра (N319, UC210)
    if ((tok.match(/\d/g) || []).length > tok.length * 0.3) return true; // >30% цифр
    return false;
  };

  /* Зона наименования.
     Для строк вида "автомобиль Субару форестер SH5":
     — останавливаемся перед токеном, который НАЧИНАЕТСЯ с заглавной НО не является
       продолжением кириллического наименования (т.е. предыдущий токен уже кириллический
       и следующий тоже кириллический-заглавный → это уже марка).
     Правило: берём первый «тематический блок» — пока токены содержат кириллицу и
     следующий токен не выглядит как отдельное имя собственное. */
  while (i < tokens.length) {
    const tok = tokens[i];
    const hasCyrInTok = /[А-Яа-яЁё]/.test(tok);
    if (!hasCyrInTok) break;  // перешли в латиницу/цифры — стоп
    /* Если это ЗАГЛАВНОЕ кириллическое слово (потенциальная марка) и наименование уже есть */
    if (nameParts.length > 0 && /^[А-ЯЁ][а-яё]/.test(tok)) {
      /* Это слово с большой буквы после строчных — вероятная марка, стоп */
      break;
    }
    nameParts.push(tok); i++;
  }

  /* Зона марки: следующий токен, начинающийся с заглавной,
     НЕ являющийся кодом изделия */
  const isBrandToken = (tok) =>
    /^[A-ZА-ЯЁ]/.test(tok) && !isCode(tok) && tok.length >= 2;

  let brand = "", model = "";
  if (i < tokens.length && isBrandToken(tokens[i])) {
    brand = tokens[i]; i++;
  }

  /* Зона модели: если brand найден, следующий токен — модель */
  if (brand && i < tokens.length) {
    const tok = tokens[i];
    if (!/^\d+$/.test(tok)) { model = tok; i++; }
  }

  const cleanName = nameParts.join(" ") || s;
  return { cleanName, brand, model };
}

/* ---------- Ключевые слова для поиска колонок --------------------------- */
/* Порядок важен: более специфичные поля проверяются раньше. */
const FIELD_PATTERNS = [
  /* Порядковый номер строки — НЕ наименование.
     "ITEM" само по себе = наименование товара (не порядковый номер). */
  ["serial",   /^(item\s*(no\.?|№|number|#)|#|№|no\.?|поз\.?|п\/п)$/i],
  /* Нетто за единицу — обязательно ДО netTotal */
  ["netUnit",  /нетто[^а-яa-z]*(ед|за\s*ед|единиц)|вес\s*ед[^а-яa-z]*нетто|n\.w\.?\s*\/\s*pc|net\s*weight\s*(per\s*)?(unit|pcs?|each)|unit\s*net\s*weight/i],
  ["netTotal", /total\s*n\.?w|нетто|net\s*w(eigh)?t(?!\s*(per|by|each|\/\s*pc))|\btotal\s+net\b|\bn\.\s*w\.?(?![a-z])/i],
  ["gross",    /total\s*g\.?w|брутто|gross\s*w(eigh)?t|\btotal\s+gross\b|g\.?w\.?\s*\/\s*ctn|\bg\.\s*w\.?(?![a-z])/i],
  ["price",    /цена|price(?!\s*list)|стоимость\s*(за\s*)?ед|rate(?!d)/i],
  ["total",    /стоимост|сумма(?!\s*нал)|amount(?!\s*of)|total\s*(usd|eur|rub|price|value|cost)|итого\s*стоим/i],
  ["qty",      /кол-?\s?во|количеств|\btotal\s+(qty|quantity)\b|qty\/?(\s*pcs?|total|box|ctn)?|\bquantity\b|кол\.(?!\s*ед)/i],
  ["unit",     /ед\.?\s?изм|единиц[аы]\s*измерени|^unit\s*(of\s*meas)?$|^ед\.?$|unit\s*of\s*measure/i],
  /* ТНВЭД / HTS Code */
  ["tnved",    /тн\s*вэд|hs\s*code|hts\s*code|harmonized|таможенн\w*\s*код|код\s*тн/i],
  /* Нотификация */
  ["notify",   /нотификаци|notification|cert(ificate)?\s*(no|#|number)?$/i],
  /* Артикул / код изделия */
  ["article",  /артикул|код\s*(изделия|товара|продукта)|product\s*(code|no\.?|#|id)|изделие|article|part\s*(no|№|number)|item\s*(no|№|code|id)|sku|art\.?(?![a-z])|ref\.?\s*(no|№)?/i],
  ["brand",    /^(бренд|торгов\w*\s*марк|trade\s*mark|trademark)$/i],
  ["brandcountry", /brand[^а-яa-z]*country|country[^а-яa-z]*origin|brand\s*\n/i],
  ["model",    /модель|model(?!\s*(no|#|code))/i],
  ["maker",    /изготовитель|производитель|manufacturer|made\s*by/i],
  ["country",  /страна\s*(происхождения|изготовлен|origin)?|coo(?!\s*[a-z])|country\s*(of\s*)?(origin|manufacture)?|origin(?!\s*price)/i],
  ["place",    /груз\w*\s*мест|мест[оа]\s*№?|№\s*мест|place|package\s*(no|№|number)|box\s*(no\.?|№|number)|carton\s*(no|№)?|кор(об|обк)\w*|паллет|pallet|case\s*(no|№)/i],
  /* Наименование — в ПОСЛЕДНЮЮ очередь */
  ["name",     /наименован|назван|описан|товар|description|goods|^name$|^item$|product(?!\s*(code|no\.?|#|id))|^product$|commodity/i],
];

function detectField(headerText) {
  const h = String(headerText || "").trim();
  if (!h) return null;
  for (const [field, re] of FIELD_PATTERNS) if (re.test(h)) return field;
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   ИИ-РАСПОЗНАВАНИЕ (Claude API)
   Две задачи:
   1. aiDetectFields — определить какое поле (qty/price/name/…) скрывается
      за каждым заголовком таблицы
   2. aiParseNameParts — разбить наименование товара на части
      (наименование / марка / модель)

   Архитектурные принципы:
   • Кэш в памяти — одинаковые запросы не дублируются
   • Плавная деградация — если API недоступен, используем локальную логику
   • Батчинг — все заголовки одной таблицы отправляются одним запросом
   ═══════════════════════════════════════════════════════════════════════════ */

const _aiFieldCache   = new Map(); // JSON.stringify(headers) → {field1, field2, …}
const _aiNameCache    = new Map(); // raw name → {cleanName, brand, model}

/* Список допустимых полей с расшифровкой для промпта */
const FIELD_DESCRIPTIONS = {
  serial:       "порядковый номер строки (No., №, Item)",
  name:         "наименование товара (Description, Goods, Наименование, товар)",
  article:      "артикул / код изделия (Part No, Article, Артикул, Код изделия)",
  qty:          "количество (Qty, Quantity, Кол-во, Количество)",
  unit:         "единица измерения (Unit, Ед. изм.)",
  price:        "цена за единицу (Price, Unit Price, Цена)",
  total:        "общая стоимость / сумма (Amount, Total, Сумма, Стоимость)",
  netUnit:      "вес нетто за единицу (Net Weight per unit, Нетто ед.)",
  netTotal:     "общий вес нетто (Net Weight, N.W., Нетто общий)",
  gross:        "общий вес брутто (Gross Weight, G.W., Брутто)",
  place:        "номер грузового места (Package No, Box No, № места)",
  country:      "страна происхождения (Country of Origin, COO, Страна)",
  maker:        "изготовитель / производитель (Manufacturer, Изготовитель)",
  model:        "модель (Model, Модель)",
  brand:        "торговая марка / бренд (Brand, Trade Mark)",
  tnved:        "код ТН ВЭД / HS Code (HTS Code, ТНВЭД)",
  notify:       "нотификация / сертификат (Notification, Certificate No)",
};

async function _callClaude(prompt, maxTokens = 500) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error("Claude API: " + resp.status);
  const data = await resp.json();
  return data.content.map(b => b.text || "").join("").trim();
}

/**
 * Определяет семантику каждого заголовка таблицы через Claude.
 * @param {string[]} headers — массив заголовков (до 30)
 * @returns {Promise<Object>} — { "Наименование": "name", "Qty": "qty", … }
 */
async function aiDetectFields(headers) {
  const key = JSON.stringify(headers);
  if (_aiFieldCache.has(key)) return _aiFieldCache.get(key);

  const fieldList = Object.entries(FIELD_DESCRIPTIONS)
    .map(([k, v]) => `  "${k}" — ${v}`)
    .join("\n");

  const prompt =
`Ты помогаешь разобрать заголовки таблицы коммерческого документа (инвойс, упаковочный лист, спецификация).

Допустимые поля и их смысл:
${fieldList}

Заголовки таблицы (могут быть на русском, английском, китайском или смешанные):
${headers.map((h, i) => `${i}: ${JSON.stringify(h)}`).join("\n")}

Ответь ТОЛЬКО валидным JSON-объектом вида {"0": "field", "1": "qty", …},
где ключ — индекс заголовка, значение — одно из допустимых полей выше.
Если заголовок не соответствует ни одному полю — не включай его в ответ.
Никакого пояснительного текста, только JSON.`;

  let result = {};
  try {
    const raw = await _callClaude(prompt, 300);
    const jsonStr = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    // превращаем {индекс → поле} в {заголовок → поле}
    for (const [idxStr, field] of Object.entries(parsed)) {
      const idx = parseInt(idxStr, 10);
      if (idx >= 0 && idx < headers.length && FIELD_DESCRIPTIONS[field]) {
        result[headers[idx]] = field;
      }
    }
  } catch (e) {
    console.warn("aiDetectFields fallback:", e.message);
    // При ошибке возвращаем пустой объект — вызывающий код применит локальную логику
  }
  _aiFieldCache.set(key, result);
  return result;
}

/**
 * Разбивает наименование товара на части через Claude.
 * @param {string[]} names — массив наименований (батч до 20)
 * @returns {Promise<Array>} — [{cleanName, brand, model}, …]
 */
async function aiParseNames(names) {
  if (!names.length) return [];
  // Проверяем кэш
  const uncached = names.filter(n => !_aiNameCache.has(n));
  if (!uncached.length) return names.map(n => _aiNameCache.get(n));

  const prompt =
`Разбери каждое наименование товара на составные части.

Правила:
- cleanName: само наименование товара (тип изделия), без марки и модели
- brand: торговая марка / производитель, если явно указана (иначе пустая строка)
- model: модель или серийная маркировка, если указана (иначе пустая строка)

Примеры:
"автомобиль Субару Форестер SH5" → {"cleanName":"автомобиль","brand":"Субару","model":"Форестер"}
"22344-BE-XL FAG" → {"cleanName":"22344-BE-XL","brand":"FAG","model":""}
"Насос центробежный N319GS2400" → {"cleanName":"Насос центробежный","brand":"","model":""}
"CPU Intel Core i5-12400" → {"cleanName":"CPU","brand":"Intel","model":"Core i5-12400"}

Наименования для разбора:
${uncached.map((n, i) => `${i}: ${JSON.stringify(n)}`).join("\n")}

Ответь ТОЛЬКО валидным JSON-массивом объектов [{cleanName, brand, model}, …]
строго в том же порядке, что и входные наименования. Только JSON, без пояснений.`;

  try {
    const raw = await _callClaude(prompt, 800);
    const jsonStr = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    uncached.forEach((name, i) => {
      const r = parsed[i] || {};
      _aiNameCache.set(name, {
        cleanName: r.cleanName || name,
        brand: r.brand || "",
        model: r.model || "",
      });
    });
  } catch (e) {
    console.warn("aiParseNames fallback:", e.message);
    uncached.forEach(name => {
      if (!_aiNameCache.has(name)) _aiNameCache.set(name, parseNameParts(name));
    });
  }
  return names.map(n => _aiNameCache.get(n) || parseNameParts(n));
}

/* ─── Расширенная версия extractFromGrid с ИИ-распознаванием ─────────────
   Используется вместо extractFromGrid когда доступен Claude API.
   Параметр aiFieldMap передаётся снаружи (из buildBtn после await aiDetectFields). */
function extractFromGridWithAI(rows, fileName, aiFieldMap) {
  if (!aiFieldMap || !Object.keys(aiFieldMap).length) {
    return extractFromGrid(rows, fileName);
  }
  // Клонируем строку заголовков, подменяя непознанные заголовки распознанными
  const headerRow = rows[0] ? [...rows[0]] : [];
  const patchedRows = [headerRow.map(cell => {
    const str = String(cell || "").trim();
    // Если ИИ определил поле для этого заголовка — подставляем его как ключ
    if (aiFieldMap[str]) return aiFieldMap[str];
    return cell;
  }), ...rows.slice(1)];
  return extractFromGrid(patchedRows, fileName);
}



/* ---------- Утилиты ------------------------------------------------------ */
function parseNum(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  let s = String(v).replace(/[\s\u00A0\u202F]/g, "");
  /* Убираем символы валют (включая менее распространённые) и трёхбуквенные коды валют,
     а также вертикальную черту — в некоторых PDF граница ячейки таблицы
     попадает в текстовый слой как символ "|" рядом с числом или вместо "€". */
  s = s.replace(/[₽$€¥£₴₹₩₺¤]|[|¦]|usd|eur|rub|cny|jpy|gbp|kzt|byn|uah|try|aed|руб\.?/gi, "");
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
const isTotalsRow = (s) => {
  const str = String(s || "").trim();
  if (/^\s*(итого|всего|итог|grand\s*total|total|sum)([\s:.,]|$)/i.test(str)) return true;
  /* Итоговая метка часто оформлена как «Родное название /Total» или
     «合计/Total» — слово total/итого стоит сразу после разделителя
     (слэш, двоеточие), независимо от того, что было до или идёт после
     («Общая сумма FCA Манчжурия /Total FCA Manzhouli»). */
  if (/[\/：:]\s*(итого|всего|итог|total)\b/i.test(str)) return true;
  /* То же самое, но слово стоит в самом конце строки без разделителя
     («Total USD :», «Всего к оплате»). */
  if (/\b(итого|всего|итог|total|sum)[\s:.：、]*$/i.test(str)) return true;
  return false;
};

/* Строки, которые не являются товарными, — стоп-блоки документа.
   Встретив их в позиции «наименование» или «артикул», пропускаем строку. */
const isJunkRow = (cells) => {
  const full = cells.filter(Boolean).map((v) => String(v).trim()).join(" ");
  const fullL = full.toLowerCase();
  /* Явные нетоварные маркеры в тексте строки */
  if (/(^|\s)(p\.no|dimensions?|gross\s*weight|net\s*weight|bank\s*name|beneficiary|inn\s*no|bic\s*no|account\s*no|kpp|cor\.?\s*account|buyer\s*company|seller\s*company|stamp\s*&\s*sign|authorize)($|\s)/i.test(full)) return true;
  if (/^date\s*:?$/i.test(full.trim()) || /^date\s*:?\s+date\s*:?$/i.test(full.trim())) return true;
  /* Строка содержит габариты AxBxC — но это мусор ТОЛЬКО если строка
     «голая» (номер паллета + размеры без наименования и без прочих данных),
     как в служебных таблицах габаритов вида «P.NO | DIMENSIONS».
     Если в строке есть полноценное наименование товара (колонка вида
     «Габариты в см» внутри обычной товарной строки) — это НЕ мусор. */
  if (/\d+[*x×]\d+[*x×]\d+/.test(full)) {
    const nonEmpty = cells.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
    const hasSubstantialText = nonEmpty.some((v) => /[A-Za-zА-Яа-яЁё]{4,}/.test(String(v)));
    if (!hasSubstantialText && nonEmpty.length <= 4) return true;
  }
  /* Строка — только числа и знак × (итоговая/счётная строка без наименования) */
  if (/^\d[\d\s,.*x×]*$/.test(full.trim()) && !/[A-Za-zА-Яа-яЁё]/.test(full)) return true;
  return false;
};

/* Блок в документе, после которого товары точно кончились (реквизиты, подписи). */
const isDocTrailerStart = (cells) => {
  const full = cells.filter(Boolean).map((v) => String(v).trim()).join(" ").toLowerCase();
  return /gross\s*weight|net\s*weight|bank\s*name|beneficiary|buyer.*stamp|seller.*stamp|p\.no\s+dimensions?|dimensions?\s+p\.no/.test(full);
};
/* Заглушки вида «--», «—», «n/a» считаем пустым значением. */
const cleanVal = (v) => {
  if (v === undefined || v === null) return "";
  const s = String(v).trim();
  return /^[-–—_.\s]*$|^(n\/?a|нет|б\/н)$/i.test(s) ? "" : s;
};
const hasLetters = (s) => /[A-Za-zА-Яа-яЁё]{3,}/.test(String(s || ""));
const hasCyrillic = (s) => /[А-Яа-яЁё]/.test(String(s || ""));

/* ---------- Состояние ---------------------------------------------------- */
const state = { files: [], rows: [], notes: [], footerErrors: [] };

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
  state.files = []; state.rows = []; state.notes = []; state.footerErrors = [];
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

    /* ── Фаза 1: ИИ определяет семантику заголовков ──────────────────────── */
    let aiFieldMap = {};
    try {
      // Ищем заголовочную строку — берём строку с наибольшим количеством непустых ячеек среди первых 30
      let headerRow = [];
      let maxNonEmpty = 0;
      for (let r = 0; r < Math.min(rows.length, 30); r++) {
        const nonEmpty = rows[r].filter(c => String(c || "").trim()).length;
        if (nonEmpty > maxNonEmpty) { maxNonEmpty = nonEmpty; headerRow = rows[r]; }
      }
      const headers = headerRow.map(c => String(c || "").trim()).filter(Boolean);
      if (headers.length >= 2) {
        aiFieldMap = await aiDetectFields(headers);
      }
    } catch (e) {
      // ИИ недоступен — продолжаем с локальной логикой
    }

    const sheetItems = extractFromGridWithAI(rows, file.name, aiFieldMap);
    items.push(...sheetItems);
  }

  /* ── Фаза 2: ИИ разбирает наименования на марку/модель ──────────────── */
  try {
    const names = [...new Set(items.map(it => it.name).filter(n => n && n.length > 3))];
    if (names.length > 0) {
      const parsed = await aiParseNames(names);
      const nameMap = new Map(names.map((n, i) => [n, parsed[i]]));
      for (const it of items) {
        const p = nameMap.get(it.name);
        if (p) {
          if (!it.brand && p.brand)  it.brand = p.brand;
          if (!it.model && p.model)  it.model = p.model;
          // cleanName заменяем только если ИИ сократил (убрал марку/модель из названия)
          if (p.cleanName && p.cleanName.length < it.name.length) it.name = p.cleanName;
        }
      }
    }
  } catch (e) {
    // ИИ недоступен — наименования остаются как есть
  }

  return items;
}

/* Поиск строки заголовка и извлечение данных из двумерного массива. */
function extractFromGrid(rows, fileName) {
  let headerIdx = -1, colMap = null, colMapAll = null, bestScore = 0;
  for (let r = 0; r < rows.length; r++) {
    const map = {}, mapAll = {};  // map = first per field, mapAll = all per field
    let score = 0;
    rows[r].forEach((cell, c) => {
      const f = detectField(cell);
      if (f) {
        if (!(f in mapAll)) { mapAll[f] = []; }
        mapAll[f].push(c);
        if (!(f in map)) { map[f] = c; score++; }
      }
    });
    if (score >= 2 && score > bestScore) { bestScore = score; headerIdx = r; colMap = map; colMapAll = mapAll; }
  }
  if (headerIdx < 0) return [];

  /* Двухстрочный заголовок: если строка ПЕРЕД headerIdx тоже содержит
     распознаваемые поля — объединяем с текущим colMap:
     для колонок qty/gross/netTotal берём строку, где есть слово "total" */
  if (headerIdx > 0) {
    const prevRow = rows[headerIdx - 1];
    const prevFields = {};
    prevRow.forEach((cell, c) => {
      const f = detectField(cell);
      if (f) {
        if (!prevFields[f]) prevFields[f] = [];
        prevFields[f].push({ c, h: String(cell || "").trim().toLowerCase() });
      }
    });
    /* Для каждого поля из prevRow: если в colMap уже есть это поле,
       но в prevRow есть вариант с "total" — используем его */
    for (const [f, entries] of Object.entries(prevFields)) {
      const totalEntry = entries.find((e) => /total/.test(e.h));
      if (totalEntry && ["qty", "netTotal", "gross"].includes(f)) {
        /* Есть явный "total" вариант — берём его */
        colMap[f] = totalEntry.c;
      } else if (!(f in colMap)) {
        /* Поле не найдено в основной строке заголовка — добавляем из предыдущей */
        colMap[f] = entries[0].c;
      }
      /* Если поле уже есть в colMap — не перезаписываем (основная строка приоритетнее) */
    }
  }

    /* Постобработка colMap: устраняем неоднозначности */
  if (colMap && colMapAll) {
    const hRow = rows[headerIdx];
    /* Fallback: заголовок колонки количества может быть искажён при
       извлечении текста из PDF (нечитаемые символы вместо «QTY») и не
       совпасть ни с одним известным паттерном. Если между колонками
       «наименование» и «цена» есть ровно одна незанятая колонка —
       считаем её количеством. */
    if (!("qty" in colMap) && "name" in colMap && "price" in colMap) {
      const occupied = new Set(Object.values(colMap));
      const between = [];
      for (let c = colMap.name + 1; c < colMap.price; c++) {
        if (!occupied.has(c)) between.push(c);
      }
      if (between.length === 1) colMap.qty = between[0];
    }
    /* Fallback: заголовок колонки наименования (и/или артикула) может быть
       на нераспознанном языке (например китайские иероглифы без перевода)
       и не совпасть ни с одним известным паттерном. Если между «serial»
       и «qty» есть 1–2 незанятые колонки — считаем первую наименованием,
       вторую (если есть) — артикулом. */
    if (!("name" in colMap) && !("serial" in colMap) && "qty" in colMap && colMap.qty > 0) {
      /* Ни serial, ни name не распознаны текстово — по общепринятой практике
         самая первая колонка таблицы почти всегда порядковый номер. */
      if (!Object.values(colMap).includes(0)) colMap.serial = 0;
    }
    if (!("name" in colMap) && "serial" in colMap && "qty" in colMap) {
      const occupied = new Set(Object.values(colMap));
      const between = [];
      for (let c = colMap.serial + 1; c < colMap.qty; c++) {
        if (!occupied.has(c)) between.push(c);
      }
      if (between.length === 1) colMap.name = between[0];
      else if (between.length >= 2) {
        colMap.name = between[0];
        /* Если незанятых колонок несколько (например дубль наименования
           на двух языках) — артикул/номер детали обычно стоит ПОСЛЕДНИМ
           перед qty, а не сразу после наименования. */
        if (!("article" in colMap)) colMap.article = between[between.length - 1];
      }
    }
    /* Все колонки с полем "name" */
    const allNameCols = colMapAll["name"] || [];
    if (allNameCols.length > 1) {
      /* Ищем колонку "PRODUCT" без code/no — это артикул */
      let productCol = -1, descCol = -1, itemOnlyCol = -1;
      const descCols = [];
      for (const c of allNameCols) {
        const h = String(hRow[c] || "").trim().toLowerCase();
        if (/^product$|^продукт$/.test(h)) productCol = c;
        else if (/description|описан/.test(h)) descCols.push(c);
        else if (/^item$/.test(h)) itemOnlyCol = c;
      }
      descCol = descCols.length ? descCols[0] : -1;
      if (productCol >= 0) {
        if (!("article" in colMap)) colMap["article"] = productCol;
        colMap["name"] = descCol >= 0 ? descCol : allNameCols.find((c) => c !== productCol) || allNameCols[0];
      } else if (itemOnlyCol >= 0 && descCol >= 0) {
        /* «Item» рядом с явной колонкой «Description»/«Описание» — это
           порядковый номер строки, а не наименование товара. */
        colMap["serial"] = itemOnlyCol;
        colMap["name"] = descCol;
      }
    }
    /* "COO" (только 3 буквы) в строке заголовка → country */
    if (!("country" in colMap)) {
      hRow.forEach((cell, c) => {
        if (/^coo$/i.test(String(cell || "").trim())) colMap["country"] = c;
      });
    }
    /* Total QTY при наличии qty/ctns — берём Total QTY как основное qty */
    if (colMapAll["qty"] && colMapAll["qty"].length > 1) {
      for (const c of colMapAll["qty"]) {
        const h = String(hRow[c] || "").trim().toLowerCase();
        if (/total/.test(h)) { colMap["qty"] = c; break; }
      }
    }
    /* Total G.W — берём вместо G.W/CTN (вес партии, не коробки) */
    if (colMapAll["gross"] && colMapAll["gross"].length > 1) {
      for (const c of colMapAll["gross"]) {
        const h = String(hRow[c] || "").trim().toLowerCase();
        if (/total/.test(h)) { colMap["gross"] = c; break; }
      }
    }
    /* Total N.W — аналогично */
    if (colMapAll["netTotal"] && colMapAll["netTotal"].length > 1) {
      for (const c of colMapAll["netTotal"]) {
        const h = String(hRow[c] || "").trim().toLowerCase();
        if (/total/.test(h)) { colMap["netTotal"] = c; break; }
      }
    }
  }

  const items = [];
  let lastPlace = "";
  let lastName = "", lastArticle = "";
  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    const get = (f) => (f in colMap ? row[colMap[f]] : "");
    let name = cleanVal(get("name")).replace(/\s+/g, " ");
    let article = cleanVal(get("article")).replace(/\s+/g, " ");
    /* Итоговую строку («Итого», «合计/Total» и т.п.) отсекаем СРАЗУ, на сырых
       данных — до того как решать про наследование названия от предыдущей
       товарной строки (иначе итог может ошибочно «унаследовать» товар). */
    if (isTotalsRow(name) || isTotalsRow(row[0]) || isTotalsRow(article)) continue;
    if (!name && !article) {
      /* Товар может быть физически разбит на несколько грузовых мест —
         строка-продолжение содержит только вес/место, без наименования.
         Если в строке есть значимые числовые данные и уже была товарная
         строка выше — наследуем от неё название и артикул.
         НО: сначала проверяем ВСЮ строку (все ячейки, не только колонки
         name/article/serial) на признак итога документа — иначе строка
         вида «Всего к оплате 187544,20» может ошибочно «унаследовать»
         название последнего товара. */
      const rowLooksLikeTotal = row.some((cell) => isTotalsRow(cell));
      const hasNumericData = !rowLooksLikeTotal && ["qty", "netTotal", "gross", "netUnit", "price", "total"]
        .some((f) => f in colMap && parseNum(cleanVal(get(f))) !== null);
      if (hasNumericData && (lastName || lastArticle)) {
        name = lastName; article = lastArticle;
      } else {
        continue;
      }
    }
    if (isJunkRow(row)) continue;
    /* Как только встречаем маркер хвоста документа — прекращаем чтение */
    if (isDocTrailerStart(row)) break;
    /* Отсеиваем строки нумерации граф («1», «1а», «2а»…) и прочий мусор:
       в наименовании должно быть хотя бы 3 буквы подряд, либо внятный артикул. */
    if (!hasLetters(name) && !/[A-Za-zА-Яа-я0-9]{3,}/.test(article)) continue;
    /* Двухстрочные заголовки (EN + RU): если ячейки строки сами похожи
       на названия колонок — это продолжение шапки, а не товар. */
    let headerish = 0;
    for (const c of Object.values(colMap)) {
      const v = String(row[c] ?? "").trim();
      if (v && detectField(v)) headerish++;
    }
    if (headerish >= 2) continue;
    /* Запоминаем последнее «настоящее» наименование/артикул для наследования
       следующими строками-продолжениями (если это не унаследованная строка) */
    if (cleanVal(get("name")) || cleanVal(get("article"))) { lastName = name; lastArticle = article; }

    let place = cleanVal(get("place"));
    if ("place" in colMap) {
      if (place) lastPlace = place;
      else place = lastPlace;
    }

    const unitRaw   = cleanVal(get("unit"));
    /* Бренд/страна: из отдельных колонок или встроены в артикул/наименование */
    const brandRaw_raw = cleanVal(get("brand"));
    const makerRaw     = cleanVal(get("maker"));
    const countryRaw_raw = cleanVal(get("country"));
    const modelRaw     = cleanVal(get("model")).replace(/[\n\r]+/g, " ").trim();
    const tnvedRaw   = cleanVal(get("tnved"));
    const notifyRaw  = cleanVal(get("notify"));
    /* "Brand\nCountry of Origin" — смешанная колонка Agricos PL:
       значение "GERMANY" → страна; "FAG\nGERMANY" → бренд + страна */
    const bcRaw = cleanVal(get("brandcountry"));
    let brandRaw   = brandRaw_raw;
    let countryRaw = countryRaw_raw;
    if (bcRaw) {
      const bcLines = bcRaw.split(/\n|\r/).map((s) => s.trim()).filter(Boolean);
      if (bcLines.length >= 2) {
        /* первая строка — бренд, последняя — страна */
        brandRaw   = brandRaw   || bcLines[0];
        countryRaw = countryRaw || bcLines[bcLines.length - 1];
      } else if (bcLines.length === 1) {
        /* одна строка — это страна (если известная) или бренд */
        const testCountry = countryByName(bcLines[0]);
        if (testCountry.a2) countryRaw = countryRaw || bcLines[0];
        else brandRaw = brandRaw || bcLines[0];
      }
    }
    const nameParsed = parseNameParts(name);
    const _qty      = parseNum(cleanVal(get("qty")));
    const _price    = parseNum(cleanVal(get("price")));
    const _total    = parseNum(cleanVal(get("total")));
    const _netUnit  = parseNum(cleanVal(get("netUnit")));
    const _netTotal = parseNum(cleanVal(get("netTotal")));
    const _gross    = parseNum(cleanVal(get("gross")));
    /* Извлекаем бренд из артикула, если не задан явно */
    const artParsed   = parseNameParts(article);
    /* brandRaw не должен быть страной */
    const brandCandid = brandRaw && !countryByName(brandRaw).a2 ? brandRaw : "";
    const finalBrand  = brandCandid || artParsed.brand || nameParsed.brand || "";
    const finalModel  = modelRaw || nameParsed.model || "";
    const finalMaker = makerRaw ? makerRaw.split(",")[0].trim() : "";
    /* Страна: убираем суффикс "X/ Страна" (Vietnam/ Вьетнам → Вьетнам) */
    const countryRawClean = (() => {
      if (!countryRaw) return "";
      const sl = countryRaw.indexOf("/");
      if (sl >= 0) { const af = countryRaw.slice(sl + 1).trim(); return af || countryRaw.slice(0, sl).trim(); }
      return countryRaw.trim();
    })();
    const countryInfo = countryByName(countryRawClean);
    const countryInfoFb = countryInfo.a2 ? countryInfo
      : countryByName(countryRaw && countryRaw.indexOf("/") >= 0 ? countryRaw.slice(0, countryRaw.indexOf("/")).trim() : "");
    const finalCountryName = countryRawClean || "";
    const finalCountryA2   = countryInfo.a2  || countryInfoFb.a2  || "";
    const finalCountryNum  = countryInfo.num || countryInfoFb.num || "";
    /* Артикул: очищаем от бренда если он был в хвосте */
    const cleanArticle = artParsed.cleanName || article;

    const item = {
      source: fileName,
      name, article: cleanArticle,
      brand: finalBrand, model: finalModel, maker: finalMaker,
      country: finalCountryName, countryA2: finalCountryA2, countryNum: finalCountryNum,
      tnved:  tnvedRaw  || "",
      notify: notifyRaw || "",
      unitRaw,
      qty:      _qty,
      price:    _price,
      total:    _total,
      netUnit:  _netUnit,
      netTotal: _netTotal,
      gross:    _gross,
      place,
      /* Математические проверки построчно:
         если расчёт программы расходится с тем, что написано в файле — фиксируем. */
      mathErrors: [],
    };
    /* qty × price vs total */
    if (_qty !== null && _price !== null && _total !== null) {
      const calc = round2(_qty * _price);
      if (Math.abs(calc - _total) > 0.02)
        item.mathErrors.push({ field: "total", calc, stated: _total });
    }
    /* qty × netUnit vs netTotal */
    if (_qty !== null && _netUnit !== null && _netTotal !== null) {
      const calc = round3(_qty * _netUnit);
      /* Допуск: округление единичного веса накапливается; берём погрешность
         в 2% или 0.1 кг (что больше) — иначе слишком много ложных срабатываний. */
      const tol = Math.max(0.1, _netTotal * 0.02);
      if (Math.abs(calc - _netTotal) > tol)
        item.mathErrors.push({ field: "netTotal", calc, stated: _netTotal });
    }
    if (item.qty === null && item.total === null && item.netTotal === null && !item.article) continue;
    items.push(item);
  }
  /* Итоговые контрольные значения из «подвала» документа
     (строки «Gross Weight | 5548.58», «Net weight | 5207.69» и аналогичные). */
  const fileTotals = { netWeight: null, grossWeight: null };
  const footerRe = /gross\s*weight|net\s*weight|total\s*net|total\s*gross|нетто.{0,10}партии|брутто.{0,10}партии/i;
  for (const row of rows) {
    const cells = row.map((v) => (v === null || v === undefined ? "" : String(v).trim()));
    const joined = cells.join(" ").toLowerCase();
    if (!footerRe.test(joined)) continue;
    const nums = cells.map(parseNum).filter((n) => n !== null && n > 0);
    if (!nums.length) continue;
    const val = nums[0];
    if (/gross\s*weight|брутто.{0,10}партии/i.test(joined) && fileTotals.grossWeight === null)
      fileTotals.grossWeight = val;
    if (/net\s*weight|total\s*net(?!\s*gross)|нетто.{0,10}партии/i.test(joined) && fileTotals.netWeight === null)
      fileTotals.netWeight = val;
  }
  /* Сравниваем сумму нетто/брутто строк с контрольными значениями подвала.
     Результат кладём в специальный маркер, который mergeItems разберёт позже. */
  if (fileTotals.netWeight !== null || fileTotals.grossWeight !== null) {
    const sumNet   = items.reduce((s, it) => it.netTotal !== null ? s + it.netTotal : s, 0);
    const sumGross = items.reduce((s, it) => it.gross   !== null ? s + it.gross    : s, 0);
    const footerErrors = [];
    if (fileTotals.netWeight !== null && Math.abs(round3(sumNet) - fileTotals.netWeight) > 0.05)
      footerErrors.push({ field: "netWeight",   calc: round3(sumNet),   stated: fileTotals.netWeight });
    if (fileTotals.grossWeight !== null && Math.abs(round3(sumGross) - fileTotals.grossWeight) > 0.05)
      footerErrors.push({ field: "grossWeight", calc: round3(sumGross), stated: fileTotals.grossWeight });
    if (footerErrors.length) {
      /* Помечаем первый элемент-маркер (у него нет имени/артикула) */
      items._footerErrors = footerErrors;
      items._footerSource = fileName;
    }
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

/* PDF: восстанавливаем таблицу по координатам текстовых фрагментов.
   Алгоритм: многострочный заголовок → x-границы колонок → «якорные» линии
   товаров → фрагменты соседних линий (переносы наименований) приписываются
   ближайшему якорю. Артефакты печати объединённых ячеек Excel (номера мест,
   отрисованные за пределами страницы или на чужих строках) отсекаются. */
async function readPdf(file) {
  if (!window.pdfjsLib) throw new Error("Библиотека pdf.js не загрузилась. Проверьте доступ в интернет.");
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages = [];
  let totalFrags = 0;
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const frags = [];
    for (const it of content.items) {
      if (!it.str || !it.str.trim()) continue;
      frags.push({ x: it.transform[4], y: it.transform[5], w: it.width || it.str.length * 4, str: it.str });
    }
    totalFrags += frags.length;
    pages.push({ h: vp.height, frags });
  }
  /* Детекция скана: если текстовых фрагментов нет или почти нет — PDF является изображением */
  if (totalFrags < 5) {
    throw new Error(
      `SCAN:«${file.name}» является отсканированным документом без текстового слоя.\n` +
      `Памятка для работы со сканами:\n` +
      `1. Открыть https://www.ilovepdf.com/ocr-pdf\n` +
      `2. Загрузить скан → выбрать язык «Russian + English» → Convert\n` +
      `3. Скачать PDF с текстовым слоем\n` +
      `4. Загрузить в программу как обычный PDF`
    );
  }
  return await extractFromPdfPages(pages, file.name);
}

let pdfWarnings = [];

/* Фрагменты → «линии» (кластеризация по y, сверху вниз). */
function pdfLines(frags) {
  const lines = [];
  const sorted = [...frags].sort((a, b) => b.y - a.y || a.x - b.x);
  for (const f of sorted) {
    const line = lines.find((L) => Math.abs(L.y - f.y) <= 2.5);
    if (line) line.frags.push(f);
    else lines.push({ y: f.y, frags: [f] });
  }
  for (const L of lines) {
    L.frags.sort((a, b) => a.x - b.x);
    const cells = [];
    for (const f of L.frags) {
      const last = cells[cells.length - 1];
      if (last && f.x - (last.x + last.w) < 4) {
        last.str += (f.x - (last.x + last.w) > 0.7 ? " " : "") + f.str;
        last.w = f.x + f.w - last.x;
      } else cells.push({ x: f.x, w: f.w, str: f.str });
    }
    L.cells = cells;
  }
  return lines;
}

async function extractFromPdfPages(pages, fileName) {
  const stray = [];        // фрагменты за пределами страницы — артефакты merged-ячеек
  const pageLines = pages.map((pg) => {
    const inPage = [], out = [];
    for (const f of pg.frags) (f.y < -2 || f.y > pg.h + 2 ? out : inPage).push(f);
    stray.push(...out);
    return pdfLines(inPage);
  });

  /* 1. Заголовок: главная линия (score ≥ 3) + соседние линии-этажи. */
  let hp = -1, hi = -1;
  outer:
  for (let p = 0; p < pageLines.length; p++) {
    for (let i = 0; i < pageLines[p].length; i++) {
      let score = 0;
      const seen = new Set();
      for (const c of pageLines[p][i].cells) {
        const f = detectField(c.str);
        if (f && !seen.has(f)) { seen.add(f); score++; }
      }
      if (score >= 3) { hp = p; hi = i; break outer; }
    }
  }
  if (hp < 0) return [];

  /* Блок заголовка: главная линия + до 3 линий ниже, содержащих слова без чисел
     или названия колонок (вторая языковая строка, «этажи» ячеек). */
  const hLines = [pageLines[hp][hi]];
  for (let i = hi + 1; i < Math.min(hi + 4, pageLines[hp].length); i++) {
    const L = pageLines[hp][i];
    const looksHeader = L.cells.some((c) => detectField(c.str)) ||
      L.cells.every((c) => parseNum(c.str) === null && c.str.length < 40);
    const hasAnchor = /^\d{1,4}$/.test(String(L.cells[0] && L.cells[0].str || "").trim());
    if (looksHeader && !hasAnchor) hLines.push(L); else break;
  }
  const headerBottomY = hLines[hLines.length - 1].y;

  /* 2. Колонки: кластеризация ячеек заголовочного блока по пересечению x. */
  /* Строка перед заголовком (напр. "QTY" над "ITEM") → в колоночную сетку.
     Включаем её только если она физически БЛИЗКО к заголовку (обычный
     межстрочный интервал) — иначе это может быть случайный текст выше
     (адрес компании, дата и т.п.), который испортит границы колонок. */
  const headerY = pageLines[hp][hi].y;
  const hPrv = (hi > 0 && Math.abs(pageLines[hp][hi - 1].y - headerY) < 20)
    ? pageLines[hp][hi - 1] : null;
  const hPrvC = hPrv ? hPrv.cells.map((c) => ({ ...c, y: hPrv.y })) : [];
  const hCells = [...hPrvC, ...hLines.flatMap((L) => L.cells.map((c) => ({ ...c, y: L.y })))];
  const colsArr = [];
  for (const c of hCells.sort((a, b) => a.x - b.x)) {
    const col = colsArr.find((k) => c.x < k.x1 + 3 && c.x + c.w > k.x0 - 3);
    if (col) {
      col.x0 = Math.min(col.x0, c.x);
      col.x1 = Math.max(col.x1, c.x + c.w);
      col.parts.push(c);
    } else colsArr.push({ x0: c.x, x1: c.x + c.w, parts: [c] });
  }
  colsArr.sort((a, b) => a.x0 - b.x0);
  let headerTexts = colsArr.map((k) =>
    k.parts.sort((a, b) => b.y - a.y || a.x - b.x).map((p) => p.str).join(" "));

  /* Узкие соседние колонки («Вес нетто | Вес брутто», «Цена | Стоимость»)
     в PDF порой сливаются в одну ячейку — разрезаем такие пополам. */
  const twinPairs = [
    [/нетто|net\s*w(eigh)?t/i, /брутто|gross\s*w(eigh)?t/i, "netTotal", "gross"],
    [/цена|price(?!s)/i, /стоимост|сумма|total\s*(price|value)|amount/i, "price", "total"],
  ];
  for (let i = colsArr.length - 1; i >= 0; i--) {
    const t = headerTexts[i];
    for (const [reA, reB] of twinPairs) {
      const mA = reA.exec(t), mB = reB.exec(t);
      if (mA && mB && mA.index !== mB.index) {
        const first = mA.index < mB.index;
        const { x0, x1 } = colsArr[i];
        const mid = (x0 + x1) / 2;
        const tA = t.slice(0, Math.max(mA.index, mB.index));
        const tB = t.slice(Math.max(mA.index, mB.index));
        colsArr.splice(i, 1,
          { x0, x1: mid, parts: [] },
          { x0: mid, x1, parts: [] });
        headerTexts.splice(i, 1, first ? tA : tB, first ? tB : tA);
        break;
      }
    }
  }
  const map = {};
  headerTexts.forEach((t, i) => {
    const f = detectField(t);
    if (f && !(f in map)) map[f] = i;
  });
  /* Fallback: заголовок колонки количества иногда искажается при извлечении
     текста из PDF (нечитаемые символы вместо «QTY»/«Кол-во») и не совпадает
     ни с одним известным паттерном. Если между колонками «наименование»
     и «цена» есть ровно одна незанятая колонка — считаем её количеством. */
  if (!("qty" in map) && "name" in map && "price" in map) {
    const between = [];
    for (let c = map.name + 1; c < map.price; c++) {
      if (!Object.values(map).includes(c)) between.push(c);
    }
    if (between.length === 1) map.qty = between[0];
  }
  if (Object.keys(map).length < 2) return [];

  const bounds = [-Infinity];
  for (let i = 1; i < colsArr.length; i++) {
    const prev = colsArr[i - 1], cur = colsArr[i];
    const prevWidth = prev.x1 - prev.x0;
    const gap = cur.x0 - prev.x1;
    /* Если предыдущая колонка узкая (напр. «№»/NO), а разрыв до следующей
       широкий (заголовок широкой текстовой колонки часто стоит по центру,
       далеко от начала данных) — граница midpoint окажется слишком далеко
       вправо, и короткие строки данных широкой колонки попадут в узкую
       предыдущую. Ставим границу ближе к концу узкой колонки.
       Применяем только к ПЕРВОЙ границе (i===1): именно там обычно стоит
       порядковый номер — гарантированно узкая колонка. Для остальных
       колонок короткое слово-заголовок (например «ITEM») не означает,
       что сама колонка данных узкая — там это правило было бы ошибкой. */
    if (i === 1 && prevWidth < 30 && gap > 60) bounds.push(prev.x1 + Math.min(gap * 0.25, 20));
    else bounds.push((prev.x1 + cur.x0) / 2);
  }
  bounds.push(Infinity);
  const colOf = (f) => {
    const cx = f.x + f.w / 2;
    for (let i = 0; i < colsArr.length; i++) if (cx >= bounds[i] && cx < bounds[i + 1]) return i;
    return colsArr.length - 1;
  };

  /* 3. Постранично: якорные линии → записи; остальные линии — к ближайшему якорю. */
  const records = [];
  const placeVals = new Set();
  for (let p = 0; p < pageLines.length; p++) {
    const lines = pageLines[p];
    const anchors = [];
    const others = [];
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      if (p === hp && i <= hi) continue;
      let headerish = 0;
      for (const c of L.cells) if (detectField(c.str)) headerish++;
      if (headerish >= 2) continue;                      // повтор заголовка
      if (p === hp && L.y >= headerBottomY && hLines.includes(L)) continue;
      const first = String(L.cells[0] && L.cells[0].str || "").trim();
      if (isTotalsRow(first)) continue;
      if (isJunkRow(L.cells.map((c) => c.str))) continue;
      if (isDocTrailerStart(L.cells.map((c) => c.str))) break;
      const row = new Array(colsArr.length).fill("");
      for (const f of L.frags) {
        const i2 = colOf(f);
        row[i2] = row[i2] ? row[i2] + " " + f.str : f.str;
      }
      const get = (fld) => (fld in map ? row[map[fld]] : "");
      /* Иногда граница ячейки таблицы (вертикальная линия) попадает в текст
         и «склеивает» соседние значения в одну ячейку, например
         «18 | €51,67» (количество и цена) или «6 — 50-1100» (количество
         и артикул в документах без цены). Разносим их по местам. */
      if ("qty" in map) {
        const qtyRaw = String(row[map.qty] || "").trim();
        if (!qtyRaw && "price" in map) {
          const priceRaw = String(row[map.price] || "").trim();
          const m1 = priceRaw.match(/^(\d{1,4})\s*[|¦]?\s*([€$¥£₽].+)$/);
          if (m1) { row[map.qty] = m1[1]; row[map.price] = m1[2]; }
        }
        if (!String(row[map.qty] || "").trim() && "article" in map) {
          const artRaw = String(row[map.article] || "").trim();
          const m2 = artRaw.match(/^(\d{1,4})\s*[—–\-|¦]\s*(\S.+)$/);
          if (m2) { row[map.qty] = m2[1]; row[map.article] = m2[2]; }
        }
      }
      if (isTotalsRow(get("name"))) continue;
      const isAnchor = /^\d{1,4}$/.test(first) && L.cells.length >= 2;
      const dataCount = ["qty", "price", "total", "netTotal", "gross"]
        .filter((fld) => fld in map && parseNum(cleanVal(get(fld))) !== null).length;
      /* Документы без цены (например упаковочные листы) могут иметь всего
         одно числовое поле (qty). Если вдобавок есть непустой артикул или
         наименование — это полноценная товарная строка, даже если серийный
         номер искажён при извлечении текста (напр. OCR принял «11» за «"»). */
      const hasQty = "qty" in map && parseNum(cleanVal(get("qty"))) !== null;
      const hasArticleOrName =
        ("article" in map && hasLetters(cleanVal(get("article")))) ||
        ("name" in map && hasLetters(cleanVal(get("name"))));
      if (isAnchor || dataCount >= 2 || (hasQty && hasArticleOrName)) anchors.push({ y: L.y, row });
      else others.push(L);
    }
    if (!anchors.length) continue;
    /* медианный шаг между якорями — лимит прилипания */
    const steps = anchors.slice(1).map((a, i) => Math.abs(anchors[i].y - a.y)).sort((a, b) => a - b);
    const pitch = steps.length ? steps[Math.floor(steps.length / 2)] : 24;
    for (const L of others) {
      let best = null, bd = Infinity;
      for (const a of anchors) {
        const d = Math.abs(a.y - L.y);
        if (d < bd) { bd = d; best = a; }
      }
      /* линия-перенос: близко к якорю, есть текст в колонке наименования,
         нет чисел в числовых колонках, не итоговая строка */
      const numCols = new Set(["qty", "price", "total", "netTotal", "netUnit", "gross"]
        .filter((fld) => fld in map).map((fld) => map[fld]));
      const fullText = L.cells.map((c) => c.str).join(" ");
      const isWrap =
        !/^\s*(сумма|итого|всего|итог|total|grand)/i.test(fullText) &&
        !L.frags.some((f) => numCols.has(colOf(f)) && parseNum(f.str) !== null) &&
        ("name" in map && L.frags.some((f) => colOf(f) === map.name));
      if (!best || bd > Math.max(pitch * 0.85, 12) || !isWrap) {
        /* линия вне сетки строк: возможно, отметка грузового места */
        if ("place" in map) {
          for (const f of L.frags) if (colOf(f) === map.place) placeVals.add(f.str.trim());
        }
        continue;
      }
      const above = L.y > best.y; // перенос над якорем — текст идёт ПЕРЕД
      for (const f of L.frags) {
        const i2 = colOf(f);
        best.row[i2] = best.row[i2]
          ? (above ? f.str + " " + best.row[i2] : best.row[i2] + " " + f.str)
          : f.str;
      }
    }
    records.push(...anchors.map((a) => a.row));
  }

  /* Отметки мест из «блуждающих» фрагментов (в т.ч. за пределами страниц). */
  if ("place" in map) {
    for (const f of stray) if (colOf(f) === map.place && f.str.trim()) placeVals.add(f.str.trim());
    for (const r of records) {
      const v = cleanVal(r[map.place]);
      if (v) placeVals.add(v);
    }
  }

  /* ── ИИ-фаза 1: определяем семантику заголовков ────────────────────── */
  let aiFieldMap = {};
  try {
    const headers = headerTexts.map(c => String(c || "").trim()).filter(Boolean);
    if (headers.length >= 2) aiFieldMap = await aiDetectFields(headers);
  } catch (e) { /* ИИ недоступен — продолжаем с локальной логикой */ }

  const grid = [headerTexts, ...records];
  const items = extractFromGridWithAI(grid, fileName, aiFieldMap);

  /* ── ИИ-фаза 2: разбираем наименования на марку/модель ──────────────── */
  try {
    const names = [...new Set(items.map(it => it.name).filter(n => n && n.length > 3))];
    if (names.length > 0) {
      const parsed = await aiParseNames(names);
      const nameMap = new Map(names.map((n, i) => [n, parsed[i]]));
      for (const it of items) {
        const p = nameMap.get(it.name);
        if (p) {
          if (!it.brand && p.brand) it.brand = p.brand;
          if (!it.model && p.model) it.model = p.model;
          if (p.cleanName && p.cleanName.length < it.name.length) it.name = p.cleanName;
        }
      }
    }
  } catch (e) { /* ИИ недоступен */ }

  /* 4. Политика мест: печать Excel не сохраняет привязку объединённых ячеек
     к строкам. Одно место на файл — присваиваем всем; несколько — не гадаем. */
  const uniqPlaces = [...placeVals].filter(Boolean);
  if (uniqPlaces.length === 1) {
    for (const it of items) it.place = uniqPlaces[0];
  } else if (uniqPlaces.length > 1) {
    const covered = items.filter((it) => it.place).length;
    if (covered < items.length) {
      for (const it of items) { it.place = ""; it.gross = null; }
      pdfWarnings.push(
        `«${fileName}»: товары упакованы в ${uniqPlaces.length} грузовых места (${uniqPlaces.join(", ")}), ` +
        `но PDF не сохраняет привязку строк к объединённым ячейкам мест — графы «№ места» и «брутто» оставлены пустыми. ` +
        `Чтобы распределить брутто по местам, загрузите упаковочный лист в формате Excel.`);
    }
  }
  return items;
}

async function readDocx(file) {
  if (!window.mammoth) throw new Error("Библиотека mammoth не загрузилась. Проверьте доступ в интернет.");
  const buf = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buf });
  return extractFromTextWithAI(res.value, file.name);
}

async function readTxt(file) {
  return extractFromTextWithAI(await file.text(), file.name);
}

/* Текстовые документы: строим «сетку» из строк, разделённых табами / 2+ пробелами / «;»,
   затем применяем ту же логику поиска заголовков, что и для таблиц. */
function extractFromText(text, fileName, aiFieldMap) {
  const rawLines = text.split(/\r?\n/).map((l) => l.replace(/\u00A0/g, " ")).filter((l) => l.trim());
  const grid = rawLines.map((l) => l.split(/\t|;| {2,}/).map((c) => c.trim()).filter((c, i, a) => !(c === "" && i === a.length - 1)));
  const items = aiFieldMap && Object.keys(aiFieldMap).length
    ? extractFromGridWithAI(grid, fileName, aiFieldMap)
    : extractFromGrid(grid, fileName);
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

/* Обёртка над extractFromText с ИИ-распознаванием заголовков и наименований. */
async function extractFromTextWithAI(text, fileName) {
  /* ── ИИ-фаза 1: определяем семантику заголовков ──────────────────────── */
  let aiFieldMap = {};
  try {
    const rawLines = text.split(/\r?\n/).map(l => l.replace(/\u00A0/g, " ")).filter(l => l.trim());
    const grid0 = rawLines.slice(0, 30).map(l =>
      l.split(/\t|;| {2,}/).map(c => c.trim()).filter(Boolean));
    let headerRow = [];
    let maxNonEmpty = 0;
    for (const row of grid0) {
      if (row.length > maxNonEmpty) { maxNonEmpty = row.length; headerRow = row; }
    }
    if (headerRow.length >= 2) aiFieldMap = await aiDetectFields(headerRow);
  } catch (e) { /* ИИ недоступен */ }

  const items = extractFromText(text, fileName, aiFieldMap);

  /* ── ИИ-фаза 2: разбираем наименования на марку/модель ───────────────── */
  try {
    const names = [...new Set(items.map(it => it.name).filter(n => n && n.length > 3))];
    if (names.length > 0) {
      const parsed = await aiParseNames(names);
      const nameMap = new Map(names.map((n, i) => [n, parsed[i]]));
      for (const it of items) {
        const p = nameMap.get(it.name);
        if (p) {
          if (!it.brand && p.brand) it.brand = p.brand;
          if (!it.model && p.model) it.model = p.model;
          if (p.cleanName && p.cleanName.length < it.name.length) it.name = p.cleanName;
        }
      }
    }
  } catch (e) { /* ИИ недоступен */ }

  return items;
}

/* ---------- Объединение и сверка ----------------------------------------- */
/* ---------- Нечёткое сравнение наименований -------------------------------
   Некоторые PDF (особенно с нестандартным встроенным шрифтом) искажают текст
   при извлечении: лигатуры «fi», «ti», «li» превращаются в одну неверную
   букву (например «Lining» → «LCnCng»). Из-за этого одинаковый товар в двух
   документах получает чуть разные наименования, и точное сравнение строк
   не группирует их. Используем расстояние Левенштейна как запасной критерий:
   если строки совпадают почти полностью (отличается пара символов на фоне
   длинного текста) — считаем их одним товаром.                            */
function levenshteinDistance(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}
function nameSimilarity(a, b) {
  const maxLen = Math.max(a.length, b.length, 1);
  return 1 - levenshteinDistance(a, b) / maxLen;
}
const FUZZY_THRESHOLD = 0.82; // допускаем ~18% отличающихся символов (искажения шрифта)

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

/* 2. Между файлами группируем ПО АРТИКУЛУ — это устойчивый идентификатор
     товара. Позиции с одинаковым артикулом объединяются, даже если
     наименования записаны по-разному (перевод, лишнее слово, двуязычная
     строка «рус / eng»). Позиции БЕЗ артикула (обычно строки инвойса)
     группируются по наименованию и присоединяются к артикульной группе,
     если их наименование совпадает с наименованием одной из её позиций. */
  const allParts = [];
  for (const [, m] of perFile) for (const [, it] of m) allParts.push(it);

  const groups = new Map();        // ключ группы → parts[]
  const orderOf = new Map();       // ключ → индекс первого появления (порядок строк)
  const artKeyOf = new Map();      // нормализованный артикул → ключ группы
  const nameToArtKey = new Map();  // нормализованное имя → ключ артикульной группы

  const pushTo = (key, it, idx) => {
    if (!groups.has(key)) { groups.set(key, []); orderOf.set(key, idx); }
    groups.get(key).push(it);
  };

  /* Проход 1: позиции с артикулом → группа по артикулу. */
  allParts.forEach((it, idx) => {
    const art = normKey(it.article);
    if (!art) return;
    let key = artKeyOf.get(art);
    if (!key) { key = "art|" + art; artKeyOf.set(art, key); }
    pushTo(key, it, idx);
    const nm = normKey(it.name);
    if (nm && !nameToArtKey.has(nm)) nameToArtKey.set(nm, key);
  });

  /* Проход 2: позиции без артикула → к артикульной группе по совпадению
     наименования, иначе собственная группа по наименованию. */
  allParts.forEach((it, idx) => {
    if (normKey(it.article)) return;
    const nm = normKey(it.name);
    const key = (nm && nameToArtKey.has(nm))
      ? nameToArtKey.get(nm)
      : "name|" + (nm || "«без наименования»");
    pushTo(key, it, idx);
  });

  /* Порядок строк — по первому появлению товара в документах. */
  const byGoods = new Map(
    [...groups.keys()]
      .sort((a, b) => orderOf.get(a) - orderOf.get(b))
      .map((k) => [k, groups.get(k)])
  );

  /* 2б. Объединение по точному совпадению артикула между группами из разных файлов.
     Актуально когда один и тот же товар в разных документах имеет разные наименования
     (например, полное и сокращённое), но одинаковый артикул/код изделия.
     Работает для ВСЕХ групп, а не только для «сирот». */
  {
    const allSources0 = new Set(allItems.map((it) => it.source));
    if (allSources0.size > 1) {
      /* Строим карту: normArticle → [key, ...] для групп с непустым артикулом */
      const artToKeys = new Map();
      for (const [key, parts] of byGoods) {
        /* Берём все непустые артикулы внутри группы */
        const arts = [...new Set(parts.map(p => normKey(p.article)).filter(Boolean))];
        for (const art of arts) {
          if (!artToKeys.has(art)) artToKeys.set(art, []);
          artToKeys.get(art).push(key);
        }
      }
      for (const [, keys] of artToKeys) {
        if (keys.length < 2) continue;
        /* Проверяем: группы из разных файлов? */
        const srcSets = keys.map(k => new Set((byGoods.get(k) || []).map(p => p.source)));
        const allSrc = new Set([...srcSets].flatMap(s => [...s]));
        if (allSrc.size < 2) continue;
        /* Не объединяем группы, которые УЖЕ содержат несколько файлов (уже слиты) */
        const singleSrcKeys = keys.filter(k => {
          const parts = byGoods.get(k);
          if (!parts) return false;
          const srcs = new Set(parts.map(p => p.source));
          return srcs.size === 1;
        });
        if (singleSrcKeys.length < 2) continue;
        /* Проверяем что singleSrcKeys из РАЗНЫХ файлов */
        const singleSrcs = singleSrcKeys.map(k => [...byGoods.get(k)][0].source);
        if (new Set(singleSrcs).size < 2) continue;
        /* Объединяем все single-source группы в первую */
        const baseKey = singleSrcKeys[0];
        let mergedParts = [...byGoods.get(baseKey)];
        for (let ki = 1; ki < singleSrcKeys.length; ki++) {
          const k2 = singleSrcKeys[ki];
          mergedParts = [...mergedParts, ...byGoods.get(k2)];
          byGoods.delete(k2);
        }
        byGoods.delete(baseKey);
        byGoods.set(baseKey + "~byArt~", mergedParts);
      }
    }
  }

  /* Нечёткое дослияние: группы, ещё не покрывающие ВСЕ загруженные файлы,
     пытаемся сопоставить с такими же «недослитыми» группами из ДРУГИХ файлов —
     по точному совпадению артикула или по схожести наименования. Сравниваем
     группу целиком (а не только группы из ОДНОГО файла): группа могла уже
     объединить 2 из 3 файлов по совпавшему артикулу (шаг 2б выше), а третий
     файл — указывать для того же товара другой (или ошибочно распознанный)
     артикул; такую группу нельзя было сопоставить по имени с уже слитой
     парой, если сверка ограничивалась только «сиротами» из одного файла.
     Сравниваем только группы с НЕПЕРЕСЕКАЮЩИМИСЯ файлами-источниками — иначе
     рискуем задвоить уже учтённые данные. */
  {
    /* Общий «шумовой» суффикс (марка/бренд), который может присутствовать
       в одном документе и отсутствовать в другом — убираем перед сравнением. */
    const stripNoise = (s) => s.replace(/\s*\btrebu\b\s*$/i, "").trim();

    const allSources = new Set(allItems.map((it) => it.source));
    if (allSources.size > 1) {
      const groupKeys = [...byGoods.keys()];
      const srcSetOf = (key) => new Set(byGoods.get(key).map((p) => p.source));
      const disjoint = (a, b) => ![...a].some((s) => b.has(s));

      const usedByArticle = new Set();
      /* Приоритет №1: точное совпадение артикула между непересекающимися по
         файлам группами — самый надёжный признак одного и того же товара,
         надёжнее сравнения наименований (которые могут отличаться словами,
         языком описания или содержать OCR-искажения). */
      {
        const byArticle = new Map(); // normArticle → [idx, ...]
        groupKeys.forEach((key, idx) => {
          const art = normKey(byGoods.get(key)[0].article);
          if (!art) return;
          if (!byArticle.has(art)) byArticle.set(art, []);
          byArticle.get(art).push(idx);
        });
        for (const [, idxs] of byArticle) {
          if (idxs.length < 2) continue;
          /* Жадно объединяем записи с этим артикулом, пропуская те, что уже
             пересекаются по файлам с уже накопленной группой. */
          const merged = [idxs[0]];
          const mergedSrc = srcSetOf(groupKeys[idxs[0]]);
          for (let k = 1; k < idxs.length; k++) {
            const srcK = srcSetOf(groupKeys[idxs[k]]);
            if (!disjoint(mergedSrc, srcK)) continue;
            merged.push(idxs[k]);
            srcK.forEach((s) => mergedSrc.add(s));
          }
          if (merged.length < 2) continue; // артикул фактически встречается в одном файле
          let mergedKey = groupKeys[merged[0]];
          let mergedParts = byGoods.get(mergedKey);
          for (let k = 1; k < merged.length; k++) {
            const key2 = groupKeys[merged[k]];
            mergedParts = [...mergedParts, ...byGoods.get(key2)];
            byGoods.delete(key2);
          }
          byGoods.delete(mergedKey);
          byGoods.set(mergedKey + "~byArticle~", mergedParts);
          merged.forEach((idx) => usedByArticle.add(idx));
        }
      }
      const candidates = [];
      for (let i = 0; i < groupKeys.length; i++) {
        if (usedByArticle.has(i) || !byGoods.has(groupKeys[i])) continue;
        const partsA = byGoods.get(groupKeys[i]);
        const srcSetA = srcSetOf(groupKeys[i]);
        const nameA = stripNoise(normKey(partsA[0].name));
        const qtyA = partsA.reduce((s, p) => (p.qty !== null ? s + p.qty : s), 0) || null;
        for (let j = i + 1; j < groupKeys.length; j++) {
          if (usedByArticle.has(j) || !byGoods.has(groupKeys[j])) continue;
          const partsB = byGoods.get(groupKeys[j]);
          const srcSetB = srcSetOf(groupKeys[j]);
          if (!disjoint(srcSetA, srcSetB)) continue; // сравниваем только непересекающиеся по файлам группы
          /* Защита от ложных совпадений: если qty известен у обеих сторон,
             он ДОЛЖЕН совпадать — иначе это разные товары со схожим названием
             (например «Connector male stud» и «Connector male stud - GE-10LRED-1/8»). */
          const qtyB = partsB.reduce((s, p) => (p.qty !== null ? s + p.qty : s), 0) || null;
          const nameB = stripNoise(normKey(partsB[0].name));
          const sim = nameSimilarity(nameA, nameB);
          /* При почти полном текстовом совпадении (после очистки суффикса)
             доверяем именам даже при разном qty — это, как правило,
             означает ошибку OCR в цифрах одного из источников, а не то,
             что это разные товары. Иначе (просто похожие названия)
             расхождение qty — сигнал, что это разные товары. */
          const qtyOk = qtyA === null || qtyB === null || qtyA === qtyB || sim >= 0.97;
          if (qtyOk && sim >= FUZZY_THRESHOLD) candidates.push({ i, j, sim });
        }
      }
      candidates.sort((a, b) => b.sim - a.sim);
      const used = new Set();
      for (const { i, j } of candidates) {
        if (used.has(i) || used.has(j)) continue;
        const keyA = groupKeys[i], keyB = groupKeys[j];
        if (!byGoods.has(keyA) || !byGoods.has(keyB)) continue;
        const merged = [...byGoods.get(keyA), ...byGoods.get(keyB)];
        byGoods.delete(keyA);
        byGoods.delete(keyB);
        byGoods.set(keyA + "~fuzzy~" + keyB, merged);
        used.add(i); used.add(j);
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
    /* Для идентифицирующих полей (артикул, марка, модель, изготовитель,
       страна) разные файлы иногда расходятся (например, счёт-фактура даёт
       свой код на другом языке вместо внутреннего артикула из спецификации).
       Берём значение, подтверждённое БОЛЬШИНСТВОМ файлов, а не просто первое
       непустое — иначе результат случайно зависит от порядка слияния групп,
       а не от того, какой источник надёжнее. При отсутствии большинства
       (все значения из одного файла или ничья) поведение как у pick(). */
    const pickConsensus = (sel) => {
      const bySrc = new Map(); // source → первое непустое значение этого файла
      for (const p of parts) {
        if (bySrc.has(p.source)) continue;
        const v = sel(p);
        if (v !== null && v !== "" && v !== undefined) bySrc.set(p.source, v);
      }
      if (bySrc.size === 0) return null;
      const counts = new Map(); // normKey(v) → { v, votes, order }
      let order = 0;
      for (const v of bySrc.values()) {
        const k = normKey(v);
        if (!counts.has(k)) counts.set(k, { v, votes: 0, order: order++ });
        counts.get(k).votes++;
      }
      let best = null;
      for (const c of counts.values()) {
        if (!best || c.votes > best.votes || (c.votes === best.votes && c.order < best.order)) best = c;
      }
      return best.v;
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
      _parts: parts,
      name:      pick((p) => p.name) || "",
      article:   pickConsensus((p) => p.article) || "",
      brand:     pickConsensus((p) => p.brand)   || "",
      model:     pickConsensus((p) => p.model)   || "",
      maker:     pickConsensus((p) => p.maker)   || "",
      country:   pick((p) => p.country) || "",
      countryA2: pick((p) => p.countryA2) || "",
      countryNum:pick((p) => p.countryNum) || "",
      tnved:     pick((p) => p.tnved)    || "",
      notify:    pick((p) => p.notify)   || "",
      sources:   [...new Set(parts.map((p) => p.source))],
      unitRaw, unitNum: codes.num, unitLet: codes.let,
      qty, price, total: totalC,
      netUnit, netTotal: net,
      grossParts: placeGross,   // брутто по местам (до распределения)
      netParts: placeNet,       // нетто по местам
      gross: null,              // будет рассчитано распределением
      places,
      flagged: discrepancies.length > 0,
      discrepancies,
      comment: "",     // заполняется ниже
      absent: [],      // список файлов, в которых товар отсутствует
      mathErrors: parts.flatMap((p) => p.mathErrors || []),
    });
  }
  /* Если загружено > 1 файла, проставляем absent для каждой строки:
     список файлов, в которых данный товар вообще не встречается. */
  const allSources = [...perFile.keys()];
  if (allSources.length > 1) {
    for (const row of rows) {
      const rowSources = new Set(row._parts ? row._parts.map((p) => p.source) : []);
      row.absent = allSources.filter((s) => !rowSources.has(s));
      if (row.absent.length) {
        row.flagged = true;
        row.comment = "Отсутствует в файле: " + row.absent.join(", ");
      }
      if (row.discrepancies.length) {
        row.comment = row.comment
          ? row.comment + "; " + row.discrepancies.join("; ")
          : row.discrepancies.join("; ");
      }
    }
  } else {
    for (const row of rows) {
      if (row.discrepancies.length) row.comment = row.discrepancies.join("; ");
    }
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
  pdfWarnings = [];
  const mode = $("mode-select") ? $("mode-select").value : "merge";
  try {
    const all = [];
    const footerErrors = [];
    const scanNotes = []; // ошибки итогов файлов (нетто/брутто footer vs сумма строк)
    for (const f of state.files) {
      setStatus(`Обрабатываю: ${f.name} (запрос к ИИ…)`);
      try {
        const items = await readFileItems(f);
        if (!items.length) state.notes.push(`В файле «${f.name}» табличные данные о товарах не найдены — проверьте документ.`);
        if (items._footerErrors) footerErrors.push(...items._footerErrors.map((e) => ({ ...e, source: items._footerSource })));
        all.push(...items);
      } catch (err) {
        if (err.message.startsWith("SCAN:")) {
          scanNotes.push(err.message); // скан — особый рендеринг
        } else {
          state.notes.push(`Файл «${f.name}» не прочитан: ${err.message}`);
        }
      }
    }
    state.notes.push(...pdfWarnings);
    if (!all.length) {
      const notesEl = $("notes");
      if (scanNotes.length && notesEl) {
        setStatus("Файл является сканом без текстового слоя — см. памятку ниже.", true);
        notesEl.innerHTML = "";
        for (const n of scanNotes) {
          const body = n.slice(5);
          const lines = body.split("\n").filter(Boolean);
          const wrap = document.createElement("div");
          wrap.style.cssText = "border:1px solid #C0392B;border-radius:6px;padding:14px 18px;background:#FFF5F5;margin:8px 0";
          const title = document.createElement("p");
          title.style.cssText = "margin:0 0 10px;color:#A33B2E";
          title.textContent = "\u26A0 " + lines[0];
          wrap.appendChild(title);
          const memo = document.createElement("p");
          memo.style.cssText = "margin:0 0 8px;font-weight:600;color:#1C2A33";
          memo.textContent = "\u041F\u0430\u043C\u044F\u0442\u043A\u0430 \u0434\u043B\u044F \u0440\u0430\u0431\u043E\u0442\u044B \u0441\u043E \u0441\u043A\u0430\u043D\u0430\u043C\u0438:";
          wrap.appendChild(memo);
          const ol = document.createElement("ol");
          ol.style.cssText = "margin:0;padding-left:20px;color:#1C2A33;line-height:2";
          for (const step of lines.slice(1)) {
            const li = document.createElement("li");
            const urlRe = /https?:\/\/[^\s]+/g;
            let last = 0, html = "";
            let m;
            while ((m = urlRe.exec(step)) !== null) {
              html += escapeHtml(step.slice(last, m.index));
              html += '<a href="' + m[0] + '" target="_blank" rel="noopener" style="color:#4C43B3;font-weight:600;text-decoration:underline">' + m[0] + '</a>';
              last = m.index + m[0].length;
            }
            html += escapeHtml(step.slice(last));
            li.innerHTML = html;
            ol.appendChild(li);
          }
          wrap.appendChild(ol);
          notesEl.appendChild(wrap);
        }
        $("result-panel").hidden = false;
      } else if (state.notes.length) {
        setStatus(state.notes[0], true);
      } else {
        setStatus("\u0414\u0430\u043D\u043D\u044B\u0435 \u043E \u0442\u043E\u0432\u0430\u0440\u0430\u0445 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B \u043D\u0438 \u0432 \u043E\u0434\u043D\u043E\u043C \u0444\u0430\u0439\u043B\u0435.", true);
      }
      buildBtn.disabled = false;
      return;
    }
    let rows;
    if (mode === "rowbyrow") {
      rows = buildRowByRow(all);
    } else {
      rows = mergeItems(all);
      distributeGross(rows);
    }
    /* порядок строк — порядок появления товаров в документах (как в инвойсе) */
    state.rows = rows;
    state.footerErrors = footerErrors;
    applyMathErrors(rows, footerErrors);
    renderResult();
    setStatus(`Готово: товаров — ${rows.length}, обработано файлов — ${state.files.length}.`);
  } catch (err) {
    setStatus("Ошибка обработки: " + err.message, true);
  }
  buildBtn.disabled = false;
});

/* ---------- Построчный режим ---------------------------------------------
   Каждая строка из файлов-источников → отдельная строка таблицы.
   Файлы делятся на два типа:
   • Упаковочные листы (PL) — содержат нетто, брутто, место; это «скелет»
   • Инвойсы/спецификации (CI) — содержат цену; это «справочник цен»
   PL-файл определяется наличием колонки «gross» при отсутствии «price»/«total»,
   или наоборот. Если в файле есть и то, и другое — он служит обоими.
   Цена подтягивается по артикулу из CI. Если артикул в CI не найден —
   строка помечается замечанием.                                           */
function buildRowByRow(allItems) {
  /* Разделяем файлы на PL и CI по наличию колонок */
  const byFile = new Map();
  for (const it of allItems) {
    if (!byFile.has(it.source)) byFile.set(it.source, []);
    byFile.get(it.source).push(it);
  }

  /* Для каждого файла определяем: есть ли в нём весовые данные (PL) и/или ценовые (CI) */
  const plItems = [], ciPrices = new Map(); // artKey → {price, total, qty}
  for (const [src, items] of byFile) {
    const hasWeight = items.some((it) => it.netTotal !== null || it.gross !== null);
    const hasPrice  = items.some((it) => it.price !== null || it.total !== null);
    if (hasWeight) plItems.push(...items.map((it) => ({ ...it })));
    if (hasPrice) {
      for (const it of items) {
        if (!it.article) continue;
        const key = normKey(it.article);
        if (!ciPrices.has(key)) {
          ciPrices.set(key, { price: it.price, total: it.total, qty: it.qty });
        } else {
          /* Если тот же артикул встречается несколько раз в CI — берём первую ненулевую цену */
          const ex = ciPrices.get(key);
          if (ex.price === null && it.price !== null) ex.price = it.price;
        }
      }
    }
  }

  /* Если нет чистых PL — работаем со всеми строками */
  const base = plItems.length ? plItems : allItems;

  const rows = [];
  const allSources = [...byFile.keys()];
  const absentComment = allSources.length > 1
    ? (src) => allSources.filter((s) => s !== src).map((s) => `Отсутствует в файле: ${s}`).join("; ")
    : () => "";

  for (const it of base) {
    const artKey = normKey(it.article);
    const ci = ciPrices.get(artKey);
    let price = it.price ?? (ci ? ci.price : null);
    let total = it.total;
    if (total === null && price !== null && it.qty !== null) total = round2(price * it.qty);
    if (total === null && ci && ci.total !== null && it.qty !== null && ci.qty !== null && ci.qty > 0)
      total = round2(ci.total / ci.qty * it.qty);

    const codes = unitCodes(it.unitRaw);
    const comment = [];
    if (it.price === null && !ci && it.article)
      comment.push(`Цена не найдена: артикул «${it.article}» отсутствует в инвойсе`);

    rows.push({
      name:      it.name || "",
      article:   it.article || "",
      brand:     it.brand || "",
      model:     it.model || "",
      maker:     it.maker || "",
      country:   it.country || "",
      countryA2: it.countryA2 || "",
      countryNum:it.countryNum || "",
      tnved:     it.tnved  || "",
      notify:    it.notify || "",
      sources:   [it.source],
      unitRaw:   it.unitRaw || "",
      unitNum:   codes.num,
      unitLet:   codes.let,
      qty:     it.qty,
      price:   price,
      total:   total,
      netUnit: it.netUnit,
      netTotal: it.netTotal,
      gross:   it.gross,
      places:  it.place ? [it.place] : [],
      flagged: comment.length > 0 || (it.mathErrors && it.mathErrors.length > 0),
      discrepancies: [],
      comment: comment.join("; "),
      absent:  [],
      mathErrors: it.mathErrors || [],
    });
  }

  return rows;
}

/* Строит HTML для ячейки «Замечания заполнителя»:
   обычные замечания — обычным цветом, математические — красным. */
function buildRemarkCell(r) {
  const parts = [];
  if (r.mathComment) {
    parts.push(`<span class="math-err">${escapeHtml(r.mathComment)}</span>`);
  }
  const base = (r.comment || "").replace(r.mathComment || "", "").replace(/^;\s*|;\s*$/g,"").trim();
  if (base) parts.push(escapeHtml(base));
  return parts.join("<br>");
}

/* ---------- Математические ошибки ---------------------------------------
   Применяет построчные mathErrors к комментариям и флагам строк.
   footerErrors идут в state.footerErrors для отдельной подсветки итогов.   */
function applyMathErrors(rows, footerErrors) {
  const fieldLabel = {
    total:       "общая стоимость",
    netTotal:    "общий вес нетто",
    grossWeight: "вес брутто (итог файла)",
    netWeight:   "вес нетто (итог файла)",
  };
  for (const row of rows) {
    if (!row.mathErrors || !row.mathErrors.length) continue;
    const msgs = [];
    for (const e of row.mathErrors) {
      const lbl = fieldLabel[e.field] || e.field;
      /* Заменяем значение в ячейке на расчётное; исходное — в замечания. */
      if (e.field === "total") {
        msgs.push(`В ячейке — расчётное значение (${e.calc}); в файле указано: ${e.stated} (${lbl})`);
        row.total = e.calc;
      } else if (e.field === "netTotal") {
        msgs.push(`В ячейке — расчётное значение (${e.calc}); в файле указано: ${e.stated} (${lbl})`);
        row.netTotal = e.calc;
      } else {
        msgs.push(`Расчёт (${e.calc}) ≠ значению в файле (${e.stated}): ${lbl}`);
      }
    }
    row.mathFlag    = true;
    row.flagged     = true;
    row.mathComment = msgs.join("; ");
    row.comment     = row.comment
      ? row.comment + "; " + row.mathComment
      : row.mathComment;
  }
}

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
    if (r.mathFlag)  tr.classList.add("is-math-error");   // красная заливка
    else if (r.flagged) tr.classList.add("is-flagged");        // жёлтая
    if (r.discrepancies.length) tr.title = r.discrepancies.join("\n");
    tr.innerHTML =
      `<td>${i + 1}</td>` +
      `<td class="cell-file">${escapeHtml((r.sources || []).join("; "))}</td>` +
      `<td class="cell-name">${escapeHtml(r.name)}</td>` +
      `<td class="cell-sm">${escapeHtml(r.brand || "")}</td>` +
      `<td class="cell-sm">${escapeHtml(r.model || "")}</td>` +
      `<td class="cell-art">${escapeHtml(r.article)}</td>` +
      `<td class="cell-sm">${escapeHtml(r.maker || "")}</td>` +
      `<td class="cell-sm">${escapeHtml(r.country || "")}</td>` +
      `<td class="cell-xs">${escapeHtml(r.countryA2 || "")}</td>` +
      `<td class="cell-xs">${escapeHtml(r.countryNum || "")}</td>` +
      `<td class="cell-sm">${escapeHtml(r.brand || "")}</td>` +
      `<td class="cell-xs">${r.unitNum}</td>` +
      `<td class="cell-xs">${r.unitLet}</td>` +
      `<td class="cell-xs">${fmt(r.qty, 3)}</td>` +
      `<td class="cell-xs">${fmt(r.price, 2)}</td>` +
      `<td class="cell-xs">${fmt(r.total, 2)}</td>` +
      `<td class="cell-xs">${fmt(r.netUnit, 3)}</td>` +
      `<td class="cell-xs">${fmt(r.netTotal, 3)}</td>` +
      `<td class="cell-xs">${fmt(r.gross, 3)}</td>` +
      `<td class="cell-xs">${escapeHtml(r.places.join(", "))}</td>` +
      `<td class="cell-remark">${buildRemarkCell(r)}</td>` +
      `<td class="cell-tnved"></td>` +
      `<td class="cell-manual"></td>` +
      `<td class="cell-manual"></td>` +
      `<td class="cell-manual"></td>` +
      `<td class="cell-manual"></td>`;
    tbody.appendChild(tr);
    sums.qty += r.qty ?? 0; sums.total += r.total ?? 0;
    sums.net += r.netTotal ?? 0; sums.gross += r.gross ?? 0;
  });

  const feErrs = state.footerErrors || [];
  const feMsg = feErrs.map((e) => {
    const lbl = e.field === "netWeight" ? "нетто" : "брутто";
    return `Итог ${lbl}: расчёт (${e.field === "netWeight" ? round3(sums.net) : round3(sums.gross)}) ≠ значению в файле (${e.stated}): ${e.source}`;
  }).join("; ");
  const netClass  = feErrs.some((e) => e.field === "netWeight")   ? ' class="cell-math-error"' : "";
  const grossClass= feErrs.some((e) => e.field === "grossWeight") ? ' class="cell-math-error"' : "";
  tfoot.innerHTML =
    `<tr><td colspan="3">Итого</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>` +
    `<td class="cell-xs">${fmt(sums.qty, 3)}</td><td></td><td class="cell-xs">${fmt(round2(sums.total), 2)}</td>` +
    `<td></td><td${netClass} class="cell-xs">${fmt(round3(sums.net), 3)}</td><td${grossClass} class="cell-xs">${fmt(round3(sums.gross), 3)}</td><td></td>` +
    `<td class="cell-remark">${feMsg ? `<span class="math-err">${escapeHtml(feMsg)}</span>` : ""}</td>` +
    `<td></td><td></td><td></td><td></td><td></td></tr>`;

  /* Предупреждения уровня файла (PDF-места, нечитаемые файлы) добавляем
     в замечания первой строки таблицы, чтобы не терялись. */
  if (state.notes.length && state.rows.length) {
    const firstRow = state.rows[0];
    const fileNotes = state.notes.join("; ");
    firstRow.comment = firstRow.comment ? firstRow.comment + "; " + fileNotes : fileNotes;
    firstRow.flagged = true;
  }

  const notesEl = $("notes");
  notesEl.innerHTML = "";
  const flaggedCount = state.rows.filter((r) => r.flagged).length;
  if (flaggedCount) {
    const p = document.createElement("p");
    p.className = "n-flag";
    p.textContent = `${flaggedCount} строк(а/и) выделены жёлтым — см. колонку «Замечания заполнителя».`;
    notesEl.appendChild(p);
  }
  /* Ошибки чтения файлов (state.notes) теперь отражены в колонке замечаний,
     отдельный блок под таблицей не нужен. */
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
    { header: "№ п/п",                    key: "n",        width: 6  },
    { header: "Название файла загрузки",  key: "files",    width: 32 },
    { header: "Наименование товара",      key: "name",     width: 40 },
    { header: "Марка",                    key: "brand",    width: 14 },
    { header: "Модель",                   key: "model",    width: 14 },
    { header: "Код изделия / артикул",    key: "art",      width: 20 },
    { header: "Изготовитель",             key: "maker",    width: 16 },
    { header: "Страна происхождения",     key: "country",  width: 18 },
    { header: "Буквенный код страны",     key: "ctryA2",   width: 10 },
    { header: "Числовой код страны",      key: "ctryNum",  width: 10 },
    { header: "Торговая марка",           key: "trademark",width: 14 },
    { header: "Код ед. изм. (цифровой)", key: "unum",     width: 10 },
    { header: "Код ед. изм. (буквенный)",key: "ulet",     width: 10 },
    { header: "Количество",               key: "qty",      width: 10 },
    { header: "Цена за единицу",          key: "price",    width: 13 },
    { header: "Общая стоимость",          key: "total",    width: 14 },
    { header: "Вес нетто за единицу, кг",key: "netu",     width: 12 },
    { header: "Общий вес нетто, кг",      key: "net",      width: 12 },
    { header: "Общий вес брутто, кг",     key: "gross",    width: 12 },
    { header: "№ грузового места",        key: "place",    width: 10 },
    { header: "Замечания заполнителя",    key: "comment",  width: 42 },
    { header: "Код ТН ВЭД ЕАЭС",         key: "tnved",    width: 14 },
    { header: "Описание 31гр.",           key: "desc31",   width: 36 },
    { header: "Список РД",                key: "rd",       width: 20 },
    { header: "Комментарии ОТНИС",        key: "cotn",     width: 28 },
    { header: "Вопросы ОТНИС",            key: "qotn",     width: 28 },
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
      files:    (r.sources || []).join("; "),
      brand:    r.brand    || "",
      model:    r.model    || "",
      maker:    r.maker    || "",
      country:  r.country  || "",
      ctryA2:   r.countryA2  || "",
      ctryNum:  r.countryNum || "",
      trademark:r.brand    || "",
      place:    r.places.join(", "),
      comment:  r.comment  || "",
      tnved: "", desc31: "", rd: "", cotn: "", qotn: "",
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
      if (r.comment) {
        const noteCell = row.getCell("name");
        noteCell.note = r.comment;
      }
    }
  });

  const last = ws.rowCount + 1;
  const totalRow = ws.getRow(last);
  totalRow.getCell(1).value  = "Итого";
  totalRow.getCell(14).value = { formula: `SUM(N2:N${last - 1})` };  // Количество
  totalRow.getCell(16).value = { formula: `SUM(P2:P${last - 1})` };  // Общая стоимость
  totalRow.getCell(18).value = { formula: `SUM(R2:R${last - 1})` };  // Нетто
  totalRow.getCell(19).value = { formula: `SUM(S2:S${last - 1})` };  // Брутто
  totalRow.font = { bold: true };
  totalRow.getCell(18).numFmt = "0.000";
  totalRow.getCell(19).numFmt = "0.000";
  totalRow.getCell(16).numFmt = "#,##0.00";

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
// Вызов Claude через прокси; ключ остаётся на сервере Railway
async function askClaude(messages, opts = {}) {
  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      messages,
      max_tokens: opts.max_tokens || 4096,
      system: opts.system,
      model: opts.model,          // необязательно, по умолчанию — из server.js
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка прокси");
  return (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("");
}
