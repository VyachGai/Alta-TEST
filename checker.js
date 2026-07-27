/* ============================================================
   Проверка ограничений по постановлениям 311, 312, 313

   Перечни берутся только из консолидированных RTF, которые
   загружает пользователь. Внешних обращений нет — файлы
   разбираются в браузере и никуда не отправляются.
   ============================================================ */

(function () {
  'use strict';

  var NOMERA = ['311', '312', '313'];
  var HRANILISHCHE = 'zapolnitel.perechni.v1';

  /* ---------- Состояние ---------- */

  var spravochnik = null;
  var istochnik = '';
  var izProshlogoSeansa = false;
  var zagolovki = [];
  var rezultat = [];

  /* ---------- Коды ---------- */

  function normKod(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/\D/g, '');
  }

  function krasivyKod(k) {
    var c = normKod(k);
    if (c.length <= 4) return c;
    var out = c.slice(0, 4);
    if (c.length > 4) out += ' ' + c.slice(4, 6);
    if (c.length > 6) out += ' ' + c.slice(6, 9);
    if (c.length > 9) out += ' ' + c.slice(9);
    return out.trim();
  }

  /* ============================================================
     Разбор RTF
     ============================================================ */

  /* Группы со служебными данными пропускаются целиком:
     таблицы шрифтов, стили, картинки — это не текст. */
  var MUSORNYE_GRUPPY = {
    fonttbl: 1, colortbl: 1, stylesheet: 1, info: 1, pict: 1, object: 1,
    themedata: 1, colorschememapping: 1, latentstyles: 1, datastore: 1,
    listtable: 1, listoverridetable: 1, rsidtbl: 1, generator: 1,
    xmlnstbl: 1, wgrffmtfilter: 1, panose: 1, falt: 1, filetbl: 1,
    header: 1, footer: 1, headerl: 1, headerr: 1, headerf: 1,
    footerl: 1, footerr: 1, footerf: 1, footnote: 1, annotation: 1,
    bkmkstart: 1, bkmkend: 1, shppict: 1, nonshppict: 1, template: 1
  };

  var RE_UPR_SLOVO = /^\\([a-zA-Z]+)(-?\d+)? ?/;

  /* Таблица верхней половины cp1251 (байты 0x80–0xFF) */
  var CP1251_VERH =
    '\u0402\u0403\u201A\u0453\u201E\u2026\u2020\u2021\u20AC\u2030\u0409\u2039\u040A\u040C\u040B\u040F' +
    '\u0452\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u0098\u2122\u0459\u203A\u045A\u045C\u045B\u045F' +
    '\u00A0\u040E\u045E\u0408\u00A4\u0490\u00A6\u00A7\u0401\u00A9\u0404\u00AB\u00AC\u00AD\u00AE\u0407' +
    '\u00B0\u00B1\u0406\u0456\u0491\u00B5\u00B6\u00B7\u0451\u2116\u0454\u00BB\u0458\u0405\u0455\u0457' +
    '\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F' +
    '\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F' +
    '\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u0439\u043A\u043B\u043C\u043D\u043E\u043F' +
    '\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044A\u044B\u044C\u044D\u044E\u044F';

  function bajtCp1251(b) {
    if (b < 0x80) return String.fromCharCode(b);
    return CP1251_VERH.charAt(b - 0x80) || '';
  }

  /* RTF -> текст. Ячейки таблицы разделяются табуляцией,
     строки таблицы и абзацы — переводом строки. */
  function rtfVTekst(raw) {
    var out = [];
    var i = 0, n = raw.length;
    var propusk = [false];

    while (i < n) {
      var c = raw.charAt(i);

      if (c === '\\') {
        var sled = raw.charAt(i + 1);

        if (sled === '\\' || sled === '{' || sled === '}') {
          if (!propusk[propusk.length - 1]) out.push(sled);
          i += 2;
          continue;
        }

        if (sled === "'") {
          var b = parseInt(raw.substr(i + 2, 2), 16);
          if (!isNaN(b) && !propusk[propusk.length - 1]) out.push(bajtCp1251(b));
          i += 4;
          continue;
        }

        var m = RE_UPR_SLOVO.exec(raw.substr(i, 40));
        if (m) {
          var slovo = m[1];
          var param = m[2];

          if (MUSORNYE_GRUPPY[slovo]) {
            propusk[propusk.length - 1] = true;
          } else if (slovo === 'u' && param) {
            var kod = parseInt(param, 10);
            if (kod < 0) kod += 65536;
            if (!propusk[propusk.length - 1]) out.push(String.fromCharCode(kod));
            i += m[0].length;
            if (raw.charAt(i) === '?') i += 1;
            continue;
          } else if (slovo === 'cell' || slovo === 'tab') {
            if (!propusk[propusk.length - 1]) out.push('\t');
          } else if (slovo === 'row' || slovo === 'par' || slovo === 'line' ||
                     slovo === 'sect' || slovo === 'page') {
            if (!propusk[propusk.length - 1]) out.push('\n');
          }

          i += m[0].length;
          continue;
        }

        i += 1;
        continue;
      }

      if (c === '{') { propusk.push(propusk[propusk.length - 1]); i += 1; continue; }
      if (c === '}') { if (propusk.length > 1) propusk.pop(); i += 1; continue; }
      if (c === '\r' || c === '\n') { i += 1; continue; }

      if (!propusk[propusk.length - 1]) out.push(c);
      i += 1;
    }

    return out.join('');
  }

  /* ---------- Маркеры структуры постановления ---------- */

  var RE_PRILOZHENIE = /^Приложение\s*(?:№\s*(\d+))?\s*$/;
  var RE_SHAPKA = /^Код\s+ТН\s*ВЭД/i;

  var RE_STARAYA_PRIL = /^Стар[а-яё]+\s+редакц[а-яё]+\s+приложени/i;
  var RE_NOVAYA_PRIL = /^Нов[а-яё]+\s+редакц[а-яё]+\s+приложени/i;

  var RE_ISKLUCHENA = /^Внимание!\s*Позиц[а-яё]*\s+исключен/i;

  /* Устаревшие редакции подписываются по-разному:
       «Старая редакция позиции:»
       «Первоначальная редакция позиции:»
       «Редакция позиции действовавшая с … по:… включительно:» */
  var RE_STARAYA_POZ =
    /^(?:Стар[а-яё]+|Первоначальн[а-яё]+)\s+редакц[а-яё]+\s+позиц[а-яё]*\s*:?\s*$|^Редакц[а-яё]+\s+позиц[а-яё]+\s+действовавш/i;
  var RE_NOVAYA_POZ = /^Нов[а-яё]+\s+редакц[а-яё]+\s+позиц[а-яё]*(?:\s*\([^)]*\))?\s*:?\s*$/i;

  var RE_VNIMANIE = /^Внимание!/i;
  var RE_SNOSKA = /^\*/;
  var RE_NAZVANIE_GRAFY = /^(Нов|Стар)[а-яё]+\s+название\s+графы/i;

  function estKod(s) {
    s = (s || '').trim();
    if (!s) return false;
    return /^\d[\d\s]*\**\s*(?:\(|$|\t)/.test(s);
  }

  function vytashchitKody(s) {
    if (!s) return [];
    var t = String(s);
    t = t.replace(/постановлени[а-яё]*\s+Правительств[а-яё]*[^,;)]*/gi, ' ');
    t = t.replace(/от\s+\d{1,2}\s+[а-яё]+\s+\d{4}\s*г\.?/gi, ' ');
    t = t.replace(/\bN\s*\d+/gi, ' ');
    t = t.replace(/№\s*\d+/g, ' ');
    t = t.replace(/(пункт|абзац|стать)[а-яё]*\s+[^,;)]*/gi, ' ');

    var rez = [];
    var chasti = t.split(/[,;\n]/);
    for (var i = 0; i < chasti.length; i++) {
      var m = chasti[i].match(/\d[\d\s]*\d|\d/g);
      if (!m) continue;
      for (var j = 0; j < m.length; j++) {
        var k = normKod(m[j]);
        if (k.length >= 4 && k.length <= 10) rez.push(k);
      }
    }
    return rez;
  }

  /* Разбирает левую ячейку строки перечня. Скобка
     «(за исключением …)» может не закрываться на этой строке —
     продолжение придёт следующей. */
  function razborKodov(s) {
    s = (s || '').replace(/\*/g, ' ');

    var m = /\(\s*за\s+исключением/i.exec(s);
    if (m) {
      var telo = s.slice(m.index + m[0].length);
      return {
        kody: vytashchitKody(s.slice(0, m.index)),
        iskl: vytashchitKody(telo),
        isklText: /абзац|пункт|постановлени|товаров,\s*указанных/i.test(telo)
      };
    }

    var ch = s.trim();
    if (ch.charAt(0) === '(' || ch.charAt(ch.length - 1) === ')') {
      return { kody: [], iskl: vytashchitKody(ch.replace(/[()]/g, '')), isklText: false };
    }

    return { kody: vytashchitKody(s), iskl: [], isklText: false };
  }

  /* Текст постановления -> приложения с позициями.

     Ключевая тонкость: маркеры «Старая редакция» и «Позиция
     исключена» гасят ровно одну следующую позицию, а не всё
     до конца документа. Иначе теряются действующие позиции,
     идущие сразу за отменённой. */
  function razobratPostanovlenie(tekst, idPost) {
    var lines = tekst.split('\n');
    var prilozheniya = [];
    var tek = null;

    var vStaroyPril = false;
    var propuskaemPril = false;
    var sledIsklyuchena = false;
    var vStaroyPoz = false;
    var zhdemShapku = false;

    var nakopKody = [], nakopIskl = [], nakopText = false;

    function sbrosit(naim) {
      if (tek && nakopKody.length) {
        tek.pozicii.push({
          kody: nakopKody.slice(),
          iskl: nakopIskl.slice(),
          isklText: nakopText,
          naim: (naim || '').slice(0, 300)
        });
      }
      nakopKody = []; nakopIskl = []; nakopText = false;
    }

    for (var i = 0; i < lines.length; i++) {
      var syraya = lines[i];
      var s = syraya.replace(/[\t ]+$/, '').trim();
      if (!s) continue;

      if (RE_STARAYA_PRIL.test(s)) { sbrosit(); vStaroyPril = true; tek = null; continue; }
      if (RE_NOVAYA_PRIL.test(s)) { vStaroyPril = false; continue; }

      var mp = RE_PRILOZHENIE.exec(s);
      if (mp) {
        sbrosit();
        if (vStaroyPril) {
          vStaroyPril = false;
          propuskaemPril = true;
          tek = null; zhdemShapku = false;
          continue;
        }
        propuskaemPril = false;
        tek = { nomer: mp[1] || '?', pozicii: [], zagolovok: '' };
        zhdemShapku = true;
        continue;
      }

      if (vStaroyPril || propuskaemPril) continue;

      if (tek && s.indexOf('Перечень') === 0) {
        tek.zagolovok = s.slice(0, 140);
        // Перечень стран — не товарный
        if (/иностранн[а-яё]+ государств|территори/i.test(s) && !/товар/i.test(s)) {
          tek = null; zhdemShapku = false;
        }
        continue;
      }

      if (zhdemShapku && !RE_SHAPKA.test(s)) {
        if (s.indexOf('к постановлению') === 0 || s.indexOf('См.') === 0 ||
            RE_VNIMANIE.test(s)) continue;
      }

      if (RE_SHAPKA.test(s)) {
        if (tek) { prilozheniya.push(tek); zhdemShapku = false; }
        continue;
      }

      if (!tek || zhdemShapku) continue;

      if (RE_NAZVANIE_GRAFY.test(s) ||
          s === 'Наименование товара' || s === 'Наименование товара*') continue;

      if (RE_ISKLUCHENA.test(s)) { sbrosit(); sledIsklyuchena = true; continue; }
      if (RE_NOVAYA_POZ.test(s)) { sbrosit(); vStaroyPoz = false; continue; }
      if (RE_STARAYA_POZ.test(s)) { sbrosit(); vStaroyPoz = true; continue; }
      if (RE_VNIMANIE.test(s)) { sbrosit(); vStaroyPoz = false; continue; }
      if (RE_SNOSKA.test(s)) continue;

      var chasti = syraya.split('\t');
      var levaya = (chasti[0] || '').trim();
      var pravaya = chasti.length > 1 ? (chasti[1] || '').trim() : '';

      if (vStaroyPoz) {
        // Старая редакция кончается строкой с наименованием
        if (pravaya) vStaroyPoz = false;
        continue;
      }

      var nachalo = estKod(levaya);
      var prodolzhenie = nakopKody.length > 0 && !nachalo && levaya;
      if (!nachalo && !prodolzhenie) continue;

      if (sledIsklyuchena) {
        if (pravaya) sledIsklyuchena = false;
        continue;
      }

      var r = razborKodov(levaya);
      nakopKody = nakopKody.concat(r.kody);
      nakopIskl = nakopIskl.concat(r.iskl);
      nakopText = nakopText || r.isklText;

      if (pravaya) sbrosit(pravaya);
    }

    sbrosit();
    prilozheniya = prilozheniya.filter(function (p) { return p.pozicii.length > 0; });

    return { id: idPost, prilozheniya: prilozheniya };
  }

  /* Номер постановления берём из текста: имя файла могли изменить */
  function opredelitNomer(tekst, imyaFajla) {
    var nachalo = tekst.slice(0, 4000);

    var m = /Постановление\s+Правительства[^\n]{0,80}?№\s*(311|312|313)\b/i.exec(nachalo);
    if (m) return m[1];

    m = /к\s+постановлению\s+Правительства[^\n]{0,120}?№\s*(311|312|313)\b/i.exec(tekst);
    if (m) return m[1];

    m = /\b(311|312|313)\b/.exec(imyaFajla || '');
    if (m) return m[1];

    return null;
  }

  /* ============================================================
     Проверка товаров
     ============================================================ */

  function proverit(kodTovara, post) {
    var kt = normKod(kodTovara);
    if (!kt) return { podpadaet: '', iskluchenie: '', detali: 'код не указан' };

    if (!post || !post.prilozheniya || !post.prilozheniya.length) {
      return { podpadaet: 'нет данных', iskluchenie: '',
               detali: 'перечень этого постановления не загружен' };
    }

    var sovpadeniya = [], isklSovp = [], nadoProverit = [], estText = false;

    for (var i = 0; i < post.prilozheniya.length; i++) {
      var pril = post.prilozheniya[i];
      var podpis = 'прил. №' + pril.nomer;

      for (var j = 0; j < pril.pozicii.length; j++) {
        var poz = pril.pozicii[j];

        for (var k = 0; k < poz.kody.length; k++) {
          var pk = poz.kody[k];

          if (kt.indexOf(pk) === 0) {
            var zapis = podpis + ': ' + krasivyKod(pk);
            if (sovpadeniya.indexOf(zapis) === -1) sovpadeniya.push(zapis);

            for (var m2 = 0; m2 < poz.iskl.length; m2++) {
              if (kt.indexOf(poz.iskl[m2]) === 0) {
                var zi = krasivyKod(poz.iskl[m2]);
                if (isklSovp.indexOf(zi) === -1) isklSovp.push(zi);
              }
            }
            if (poz.isklText) estText = true;

          } else if (pk.indexOf(kt) === 0 && kt.length < pk.length) {
            var zp = podpis + ': ' + krasivyKod(pk);
            if (nadoProverit.indexOf(zp) === -1) nadoProverit.push(zp);
          }
        }
      }
    }

    var podpadaet, iskluchenie, detali;

    if (sovpadeniya.length) {
      podpadaet = 'да';
      detali = sovpadeniya.slice(0, 6).join('; ');
      if (sovpadeniya.length > 6) detali += ' и ещё ' + (sovpadeniya.length - 6);

      if (isklSovp.length) {
        iskluchenie = 'да';
        detali += ' | исключение: ' + isklSovp.join('; ');
      } else if (estText) {
        iskluchenie = 'проверить';
        detali += ' | в позиции есть текстовое исключение — проверить вручную';
      } else {
        iskluchenie = 'нет';
      }
    } else if (nadoProverit.length) {
      podpadaet = 'проверить';
      iskluchenie = '';
      detali = 'код товара короче кода перечня — ' + nadoProverit.slice(0, 4).join('; ');
    } else {
      podpadaet = 'нет';
      iskluchenie = 'нет';
      detali = '';
    }

    return { podpadaet: podpadaet, iskluchenie: iskluchenie, detali: detali };
  }

  function sformirovatItog(p311, p312, p313) {
    if (p311.podpadaet === '' && p312.podpadaet === '' && p313.podpadaet === '') {
      return 'код ТН ВЭД не указан — проверка не проводилась';
    }

    var pary = [['311', p311], ['312', p312], ['313', p313]];
    var podpadaet = [], proverit_ = [], netDannyh = [];

    pary.forEach(function (par) {
      var nomer = par[0], p = par[1];
      if (p.podpadaet === 'да') {
        if (p.iskluchenie === 'да') return;
        if (p.iskluchenie === 'проверить') proverit_.push(nomer);
        else podpadaet.push(nomer);
      } else if (p.podpadaet === 'проверить') {
        proverit_.push(nomer);
      } else if (p.podpadaet === 'нет данных') {
        netDannyh.push(nomer);
      }
    });

    var chasti = [];
    if (podpadaet.length) chasti.push('подпадает под ' + podpadaet.join(', '));
    if (proverit_.length) chasti.push('проверить вручную: ' + proverit_.join(', '));
    if (netDannyh.length) chasti.push('нет перечня по ' + netDannyh.join(', '));

    if (!chasti.length) return 'ограничений не найдено';
    return chasti.join('; ');
  }

  /* ============================================================
     Таблица товаров
     ============================================================ */

  var KLYUCHI_TNVED = [
    'тн вэд', 'тнвэд', 'тн-вэд', 'код тн', 'тн.вэд',
    'hs code', 'hs-code', 'hscode', 'hs код', 'tnved',
    'товарный код', 'код тнвед', 'commodity code'
  ];

  /* Заголовки, похожие на код, но означающие артикул.
     Перепутать артикул с кодом ТН ВЭД — значит молча
     проверить не то и выдать сплошные «нет». */
  var KLYUCHI_NE_TNVED = [
    'артикул', 'item code', 'код изделия', 'part number', 'парт номер',
    'номер детали', 'sku', 'код позиции'
  ];

  function najtiKolonkuTnved(zag) {
    for (var i = 0; i < zag.length; i++) {
      var z = String(zag[i] || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (!z) continue;

      var artikul = false;
      for (var n = 0; n < KLYUCHI_NE_TNVED.length; n++) {
        if (z.indexOf(KLYUCHI_NE_TNVED[n]) !== -1) { artikul = true; break; }
      }
      if (artikul) continue;

      for (var j = 0; j < KLYUCHI_TNVED.length; j++) {
        if (z.indexOf(KLYUCHI_TNVED[j]) !== -1) return i;
      }
    }
    return -1;
  }

  /* Ищет строку заголовков: в спецификациях таблица редко
     начинается с первой строки. */
  function najtiStrokuZagolovkov(dannye) {
    var predel = Math.min(dannye.length, 30);
    for (var i = 0; i < predel; i++) {
      var iKod = najtiKolonkuTnved(dannye[i]);
      if (iKod === -1) continue;
      for (var j = i + 1; j < dannye.length; j++) {
        if (normKod(dannye[j][iKod]).length >= 6) {
          return { strokaZagolovkov: i, kolonkaKoda: iKod };
        }
      }
    }
    return null;
  }

  /* Отрезает хвост после списка товаров: «Итого», сводные
     веса, количество мест — это не товары. */
  function otsechHvost(stroki, iKod) {
    var poslednyaya = -1;
    for (var i = 0; i < stroki.length; i++) {
      if (normKod(stroki[i][iKod]).length >= 6) poslednyaya = i;
    }
    if (poslednyaya === -1) return [];

    return stroki.slice(0, poslednyaya + 1).filter(function (str) {
      return normKod(str[iKod]).length >= 6;
    });
  }

  function ugadatKolonkuTnved(stroki) {
    if (!stroki.length) return { indeks: -1, prichina: 'нет строк' };

    var kolvo = 0;
    stroki.forEach(function (r) { if (r.length > kolvo) kolvo = r.length; });

    var kandidaty = [];
    for (var c = 0; c < kolvo; c++) {
      var podhodyat = 0, vsego = 0, desyati = 0;
      for (var r = 0; r < stroki.length; r++) {
        var v = stroki[r][c];
        if (v === null || v === undefined || String(v).trim() === '') continue;
        vsego++;
        var s = String(v).trim();
        if (/[^\d\s.]/.test(s)) continue;   // буквы — признак артикула
        var k = normKod(s);
        if (k.length >= 6 && k.length <= 10) {
          podhodyat++;
          if (k.length === 10) desyati++;
        }
      }
      if (!vsego) continue;
      var dolya = podhodyat / vsego;
      kandidaty.push({ indeks: c, ball: dolya + (desyati / vsego) * 0.3, dolya: dolya });
    }

    kandidaty.sort(function (a, b) { return b.ball - a.ball; });

    if (!kandidaty.length || kandidaty[0].dolya < 0.6) {
      return { indeks: -1, prichina: 'ни одна графа не похожа на коды ТН ВЭД' };
    }
    if (kandidaty.length > 1 && (kandidaty[0].ball - kandidaty[1].ball) < 0.15) {
      return { indeks: -1,
               prichina: 'несколько граф похожи на коды (№' + (kandidaty[0].indeks + 1) +
                         ' и №' + (kandidaty[1].indeks + 1) + ') — не берусь выбирать' };
    }
    return { indeks: kandidaty[0].indeks, prichina: '' };
  }

  function prochitatTablicu(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('не удалось прочитать файл')); };
      reader.onload = function (e) {
        try {
          var wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
          var ws = wb.Sheets[wb.SheetNames[0]];
          var dannye = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
          dannye = dannye.filter(function (r) {
            return r.some(function (c) { return String(c).trim() !== ''; });
          });
          if (dannye.length < 2) { reject(new Error('в файле меньше двух строк')); return; }
          resolve(dannye);
        } catch (err) {
          reject(new Error('файл не читается как таблица'));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function obrabotat(dannye) {
    var iKod, poZagolovku, iShapki;
    var najdeno = najtiStrokuZagolovkov(dannye);

    if (najdeno) {
      iShapki = najdeno.strokaZagolovkov;
      iKod = najdeno.kolonkaKoda;
      poZagolovku = true;
    } else {
      iShapki = 0;
      poZagolovku = false;
      var dogadka = ugadatKolonkuTnved(dannye.slice(1));
      if (dogadka.indeks === -1) {
        soobshchenie('Не нашёл графу с кодом ТН ВЭД: ' + dogadka.prichina +
                     '. Назовите её «Код ТН ВЭД» или «HS code».', 'error');
        return;
      }
      iKod = dogadka.indeks;
    }

    zagolovki = (dannye[iShapki] || []).map(function (z) {
      return String(z === undefined ? '' : z).replace(/\s+/g, ' ').trim();
    });

    var vseStroki = dannye.slice(iShapki + 1);
    var stroki = otsechHvost(vseStroki, iKod);

    if (!stroki.length) {
      soobshchenie('В таблице не найдено строк с кодами ТН ВЭД.', 'error');
      return;
    }

    rezultat = stroki.map(function (str) {
      var kod = str[iKod];
      var p311 = proverit(kod, spravochnik['311']);
      var p312 = proverit(kod, spravochnik['312']);
      var p313 = proverit(kod, spravochnik['313']);
      return {
        ishodnaya: str, kod: kod,
        p311: p311, p312: p312, p313: p313,
        itog: sformirovatItog(p311, p312, p313)
      };
    });

    var imya = (zagolovki[iKod] || ('графа №' + (iKod + 1))).slice(0, 40);
    var chasti = ['Проверено товаров: ' + rezultat.length];
    chasti.push('код взят из графы «' + imya + '»');
    if (iShapki > 0) chasti.push('шапка найдена в строке ' + (iShapki + 1));
    var otbr = vseStroki.length - stroki.length;
    if (otbr > 0) chasti.push('строк без кода отброшено: ' + otbr);
    if (!poZagolovku) chasti.push('графа определена по содержимому — проверьте');

    soobshchenie(chasti.join('; ') + '.');
    pokazatTablicu();
  }

  /* ============================================================
     Загрузка перечней
     ============================================================ */

  function prinyatFajlyPostanovlenij(files) {
    if (!files || !files.length) return Promise.resolve();

    soobshchenieOPerechnyah('Читаю ' + files.length +
      (files.length === 1 ? ' файл…' : ' файла…'));

    var zadachi = Array.prototype.slice.call(files).map(prochitatOdinRtf);

    return Promise.all(zadachi).then(function (rezultaty) {
      if (!spravochnik) spravochnik = {};
      var prinyato = [], oshibki = [];

      rezultaty.forEach(function (r) {
        if (r.oshibka) { oshibki.push(r.imya + ' — ' + r.oshibka); return; }
        spravochnik[r.nomer] = r.dannye;
        spravochnik[r.nomer].imyaFajla = r.imya;
        prinyato.push(r);
      });

      if (!prinyato.length) {
        soobshchenieOPerechnyah('Не удалось разобрать: ' + oshibki.join('; '), 'error');
        return;
      }

      istochnik = 'файлы постановлений, загружены ' + new Date().toLocaleString('ru-RU');
      izProshlogoSeansa = false;
      sohranitVHranilishche();

      var chasti = prinyato.map(function (r) {
        var n = 0;
        r.dannye.prilozheniya.forEach(function (p) { n += p.pozicii.length; });
        return 'ПП ' + r.nomer + ' — ' + n + ' позиц.';
      });
      var soobsh = 'Принято: ' + chasti.join(', ') + '.';
      if (oshibki.length) soobsh += ' Не разобрано: ' + oshibki.join('; ') + '.';

      var netu = NOMERA.filter(function (n) {
        return !spravochnik[n] || !spravochnik[n].prilozheniya ||
               !spravochnik[n].prilozheniya.length;
      });
      if (netu.length) {
        soobsh += ' Не загружены: ПП ' + netu.join(', ') +
                  ' — по ним проверка не проводится.';
      }

      soobshchenieOPerechnyah(soobsh, netu.length ? 'warn' : '');
      pokazatStatus();
      otkrytShagTovarov(true);
    });
  }

  function prochitatOdinRtf(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onerror = function () {
        resolve({ imya: file.name, oshibka: 'файл не читается' });
      };
      reader.onload = function (e) {
        try {
          // RTF однобайтовый, последовательности \'XX раскрываем сами
          var bytes = new Uint8Array(e.target.result);
          var syroy = '';
          var CHUNK = 32768;
          for (var i = 0; i < bytes.length; i += CHUNK) {
            syroy += String.fromCharCode.apply(
              null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length)));
          }

          if (syroy.slice(0, 5) !== '{\\rtf') {
            resolve({ imya: file.name, oshibka: 'это не файл RTF' });
            return;
          }

          var tekst = rtfVTekst(syroy);
          var nomer = opredelitNomer(tekst, file.name);
          if (!nomer) {
            resolve({ imya: file.name,
                      oshibka: 'не удалось определить номер постановления' });
            return;
          }

          var dannye = razobratPostanovlenie(tekst, nomer);
          if (!dannye.prilozheniya.length) {
            resolve({ imya: file.name,
                      oshibka: 'не найдено перечней с кодами ТН ВЭД' });
            return;
          }

          resolve({ imya: file.name, nomer: nomer, dannye: dannye });
        } catch (err) {
          resolve({ imya: file.name, oshibka: 'ошибка разбора: ' + err.message });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /* ---------- Сохранение между сеансами ---------- */

  function sohranitVHranilishche() {
    try {
      localStorage.setItem(HRANILISHCHE, JSON.stringify({
        data: new Date().toISOString(),
        istochnik: istochnik,
        spravochnik: spravochnik
      }));
    } catch (e) {
      // Переполнение хранилища или запрет — не критично
    }
  }

  function zagruzitIzHranilishcha() {
    try {
      var syroe = localStorage.getItem(HRANILISHCHE);
      if (!syroe) return false;
      var o = JSON.parse(syroe);
      if (!o || !o.spravochnik) return false;

      spravochnik = o.spravochnik;
      istochnik = o.istochnik || 'предыдущий сеанс';
      izProshlogoSeansa = true;

      var d = o.data ? new Date(o.data) : null;
      var kogda = d ? d.toLocaleString('ru-RU') : 'неизвестно когда';

      soobshchenieOPerechnyah(
        'Данные из предыдущего запуска (загружены ' + kogda + '). ' +
        'Постановления могли измениться — если не уверены, загрузите файлы заново.',
        'warn'
      );
      pokazatStatus();
      otkrytShagTovarov(true);
      return true;
    } catch (e) {
      return false;
    }
  }

  function zabytPerechni() {
    try { localStorage.removeItem(HRANILISHCHE); } catch (e) {}
    spravochnik = null;
    istochnik = '';
    izProshlogoSeansa = false;
    rezultat = [];

    var panel = document.getElementById('chk-result-panel');
    if (panel) panel.hidden = true;
    var st = document.getElementById('chk-status');
    if (st) st.hidden = true;
    var kn = document.getElementById('chk-zabyt');
    if (kn) kn.hidden = true;

    soobshchenieOPerechnyah('Перечни удалены. Загрузите файлы постановлений.');
    soobshchenie('');
    otkrytShagTovarov(false);
  }

  /* ============================================================
     Отрисовка
     ============================================================ */

  var NOVYE_KOLONKI = [
    { zag: 'ПП 311', klass: 'col-chk' }, { zag: 'Искл. из 311', klass: 'col-chk' },
    { zag: 'ПП 312', klass: 'col-chk' }, { zag: 'Искл. из 312', klass: 'col-chk' },
    { zag: 'ПП 313', klass: 'col-chk' }, { zag: 'Искл. из 313', klass: 'col-chk' },
    { zag: 'Итог проверки', klass: 'col-itog' }
  ];

  function klassYachejki(z) {
    if (z === 'да') return 'chk-da';
    if (z === 'нет') return 'chk-net';
    if (z === 'проверить' || z === 'нет данных') return 'chk-prov';
    return 'chk-pusto';
  }

  function klassItoga(it) {
    if (it.indexOf('проверить') !== -1 || it.indexOf('не указан') !== -1 ||
        it.indexOf('нет перечня') !== -1) return 'chk-prov';
    if (it.indexOf('подпадает') !== -1) return 'chk-da';
    return '';
  }

  function pokazatTablicu() {
    var host = document.getElementById('chk-tablica');
    var panel = document.getElementById('chk-result-panel');
    if (!host) return;

    var html = '<table><thead><tr>';
    zagolovki.forEach(function (z) { html += '<th>' + ekran(z) + '</th>'; });
    NOVYE_KOLONKI.forEach(function (k) {
      html += '<th class="' + k.klass + '">' + ekran(k.zag) + '</th>';
    });
    html += '</tr></thead><tbody>';

    rezultat.forEach(function (r) {
      html += '<tr>';
      for (var i = 0; i < zagolovki.length; i++) {
        var v = r.ishodnaya[i] === undefined ? '' : r.ishodnaya[i];
        html += '<td class="cell-sm">' + ekran(v) + '</td>';
      }
      [r.p311, r.p312, r.p313].forEach(function (p) {
        html += '<td class="' + klassYachejki(p.podpadaet) + '"' +
                (p.detali ? ' title="' + ekran(p.detali) + '"' : '') + '>' +
                ekran(p.podpadaet || '—') + '</td>';
        html += '<td class="' + klassYachejki(p.iskluchenie) + '">' +
                ekran(p.iskluchenie || '—') + '</td>';
      });
      html += '<td class="cell-itog ' + klassItoga(r.itog) + '">' + ekran(r.itog) + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    host.innerHTML = html;
    if (panel) panel.hidden = false;
  }

  function ekran(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- Выгрузка ---------- */

  function vygruzit() {
    if (!rezultat.length) return;

    var wb = new ExcelJS.Workbook();
    var ws = wb.addWorksheet('Проверка 311-312-313');

    var vse = zagolovki.concat(NOVYE_KOLONKI.map(function (k) { return k.zag; }));
    ws.addRow(vse);

    var hdr = ws.getRow(1);
    hdr.font = { bold: true, size: 10 };
    hdr.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    hdr.height = 30;
    hdr.eachCell(function (cell, n) {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' },
                      bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.fill = { type: 'pattern', pattern: 'solid',
        fgColor: { argb: n > zagolovki.length ? 'FFE6E4F6' : 'FFF2F4F1' } };
    });

    rezultat.forEach(function (r) {
      var stroka = [];
      for (var i = 0; i < zagolovki.length; i++) {
        stroka.push(r.ishodnaya[i] === undefined ? '' : r.ishodnaya[i]);
      }
      stroka.push(r.p311.podpadaet, r.p311.iskluchenie);
      stroka.push(r.p312.podpadaet, r.p312.iskluchenie);
      stroka.push(r.p313.podpadaet, r.p313.iskluchenie);
      stroka.push(r.itog);

      var row = ws.addRow(stroka);
      row.alignment = { vertical: 'top' };
      var baza = zagolovki.length;

      [r.p311, r.p312, r.p313].forEach(function (p, idx) {
        var cPod = row.getCell(baza + idx * 2 + 1);
        var cIsk = row.getCell(baza + idx * 2 + 2);
        zalit(cPod, p.podpadaet);
        zalit(cIsk, p.iskluchenie);
        cPod.alignment = { horizontal: 'center' };
        cIsk.alignment = { horizontal: 'center' };
        if (p.detali) cPod.note = { texts: [{ text: p.detali }] };
      });

      var cItog = row.getCell(baza + 7);
      cItog.alignment = { vertical: 'top', wrapText: true };
      var ki = klassItoga(r.itog);
      if (ki === 'chk-prov') {
        cItog.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE45C' } };
      } else if (ki === 'chk-da') {
        cItog.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } };
      }
    });

    ws.columns.forEach(function (col, i) {
      col.width = i < zagolovki.length ? 20 : 13;
    });
    ws.getColumn(vse.length).width = 38;
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    var info = wb.addWorksheet('Источник данных');
    info.addRow(['Источник перечней', istochnik]);
    info.addRow(['Дата проверки', new Date().toLocaleString('ru-RU')]);
    NOMERA.forEach(function (n) {
      var s = spravochnik && spravochnik[n];
      if (s && s.prilozheniya && s.prilozheniya.length) {
        var kolvo = 0;
        s.prilozheniya.forEach(function (p) { kolvo += p.pozicii.length; });
        info.addRow(['ПП ' + n, (s.imyaFajla || '') + ' — ' + kolvo + ' позиций в ' +
                     s.prilozheniya.length + ' прил.']);
      } else {
        info.addRow(['ПП ' + n, 'НЕ ЗАГРУЖЕН — проверка не проводилась']);
      }
    });
    info.addRow([]);
    info.addRow(['ВНИМАНИЕ']);
    info.addRow(['Предварительная проверка, а не замена работе с первоисточником.']);
    info.addRow(['Перед подачей ДТ сверяйте позиции с действующей редакцией постановлений.']);
    info.addRow([]);
    info.addRow(['Проверяется только код ТН ВЭД. Исключения по происхождению товара,']);
    info.addRow(['направлению вывоза, таможенной процедуре и статусу отправителя']);
    info.addRow(['приложению неизвестны. «Нет» означает отсутствие совпадения по коду,']);
    info.addRow(['а не отсутствие ограничений.']);
    info.addRow([]);
    info.addRow(['Как читать']);
    info.addRow(['ПП = да, Искл. = нет', 'товар подпадает под ограничение']);
    info.addRow(['ПП = да, Искл. = да', 'позиция выведена из-под ограничения, НЕ подпадает']);
    info.addRow(['ПП = нет', 'совпадений в перечне не найдено']);
    info.addRow(['ПП = нет данных', 'перечень не загружен, проверка не проводилась']);
    info.addRow(['проверить', 'автоматика решить не может, нужен ручной разбор']);
    info.getColumn(1).width = 30;
    info.getColumn(2).width = 62;
    info.getRow(6).font = { bold: true };
    info.getRow(15).font = { bold: true };

    wb.xlsx.writeBuffer().then(function (buf) {
      var blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'proverka_311_312_313.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }).catch(function (e) {
      soobshchenie('Не удалось сформировать файл: ' + e.message, 'error');
    });
  }

  function zalit(cell, z) {
    if (z === 'да') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } };
      cell.font = { bold: true };
    } else if (z === 'проверить' || z === 'нет данных') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE45C' } };
      cell.font = { bold: true };
    }
  }

  /* ---------- Сообщения ---------- */

  function soobshchenie(tekst, tip) {
    var el = document.getElementById('chk-soobshchenie');
    if (!el) return;
    el.textContent = tekst;
    el.className = 'status' + (tip === 'error' ? ' is-error' :
                               (tip === 'warn' ? ' is-warn' : ''));
  }

  function soobshchenieOPerechnyah(tekst, tip) {
    var el = document.getElementById('chk-perechni-soobshchenie');
    if (!el) return;
    el.textContent = tekst;
    el.className = 'status' + (tip === 'error' ? ' is-error' :
                               (tip === 'warn' ? ' is-warn' : ''));
  }

  function pokazatStatus() {
    var el = document.getElementById('chk-status');
    if (!el || !spravochnik) return;

    var stroki = NOMERA.map(function (n) {
      var s = spravochnik[n];
      if (!s || !s.prilozheniya || !s.prilozheniya.length) {
        return '<span class="chk-net-dannyh">ПП ' + n + ' — не загружено</span>';
      }
      var kolvo = 0;
      s.prilozheniya.forEach(function (p) { kolvo += p.pozicii.length; });
      var nomera = s.prilozheniya.map(function (p) { return '№' + p.nomer; }).join(', ');
      return 'ПП ' + n + ' — ' + kolvo + ' позиц. (прил. ' + nomera + ')';
    });

    el.innerHTML = (izProshlogoSeansa
        ? '<b>Данные из предыдущего запуска.</b><br>'
        : '<b>Источник:</b> ' + ekran(istochnik) + '<br>') +
      stroki.join('<br>');
    el.hidden = false;
    el.classList.toggle('is-stale', izProshlogoSeansa);

    var knopka = document.getElementById('chk-zabyt');
    if (knopka) knopka.hidden = false;
  }

  function otkrytShagTovarov(dostupno) {
    var shag = document.getElementById('chk-shag-tovary');
    if (!shag) return;
    shag.classList.toggle('is-locked', !dostupno);
    var zona = document.getElementById('chk-drop');
    if (zona) {
      zona.setAttribute('aria-disabled', dostupno ? 'false' : 'true');
      zona.tabIndex = dostupno ? 0 : -1;
    }
  }

  /* ---------- Инициализация ---------- */

  function podklyuchitZonu(zona, vhod, obrabotchik, mnogo) {
    if (!zona || !vhod) return;

    zona.addEventListener('click', function () {
      if (zona.getAttribute('aria-disabled') === 'true') return;
      vhod.click();
    });
    zona.addEventListener('keydown', function (e) {
      if (zona.getAttribute('aria-disabled') === 'true') return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vhod.click(); }
    });
    ['dragenter', 'dragover'].forEach(function (t) {
      zona.addEventListener(t, function (e) {
        e.preventDefault(); e.stopPropagation();
        if (zona.getAttribute('aria-disabled') !== 'true') zona.classList.add('is-over');
      });
    });
    ['dragleave', 'drop'].forEach(function (t) {
      zona.addEventListener(t, function (e) {
        e.preventDefault(); e.stopPropagation();
        zona.classList.remove('is-over');
      });
    });
    zona.addEventListener('drop', function (e) {
      if (zona.getAttribute('aria-disabled') === 'true') return;
      var f = e.dataTransfer && e.dataTransfer.files;
      if (f && f.length) obrabotchik(mnogo ? f : f[0]);
    });
    vhod.addEventListener('change', function (e) {
      if (e.target.files.length) {
        obrabotchik(mnogo ? e.target.files : e.target.files[0]);
      }
      e.target.value = '';
    });
  }

  function init() {
    var vhodTovary = document.getElementById('chk-fajl');
    if (!vhodTovary) return;

    podklyuchitZonu(
      document.getElementById('chk-perechni-drop'),
      document.getElementById('chk-perechni-fajl'),
      function (files) { prinyatFajlyPostanovlenij(files).catch(function () {}); },
      true
    );

    podklyuchitZonu(
      document.getElementById('chk-drop'),
      vhodTovary,
      function (file) {
        if (!spravochnik) {
          soobshchenie('Сначала загрузите файлы постановлений.', 'error');
          return;
        }
        soobshchenie('Читаю таблицу…');
        prochitatTablicu(file).then(obrabotat).catch(function (err) {
          soobshchenie('Ошибка: ' + err.message, 'error');
        });
      },
      false
    );

    var knSkachat = document.getElementById('chk-skachat');
    if (knSkachat) knSkachat.addEventListener('click', vygruzit);

    var knZabyt = document.getElementById('chk-zabyt');
    if (knZabyt) knZabyt.addEventListener('click', zabytPerechni);

    if (!zagruzitIzHranilishcha()) {
      otkrytShagTovarov(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ProverkaOgranicheniy = {
    rtfVTekst: rtfVTekst,
    razobratPostanovlenie: razobratPostanovlenie,
    opredelitNomer: opredelitNomer,
    proverit: proverit,
    normKod: normKod,
    najtiStrokuZagolovkov: najtiStrokuZagolovkov,
    otsechHvost: otsechHvost,
    poluchitSpravochnik: function () { return spravochnik; }
  };

})();
