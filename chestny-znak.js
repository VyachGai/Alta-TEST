/* ============================================================
   Маркировка «Честный знак»

   Перечень берётся только из сводного RTF («Сводный перечень
   товаров, подлежащих маркировке средствами идентификации»),
   который загружает пользователь. Внешних обращений нет —
   файлы разбираются в браузере и никуда не отправляются.

   Итог работы: копия загруженной таблицы товаров с одной
   добавленной графой «Честный знак» — исходные данные,
   строки и оформление не трогаются.
   ============================================================ */

(function () {
  'use strict';

  var HRANILISHCHE = 'zapolnitel.chestnyznak.v1';
  var IMYA_GRAFY = 'Честный знак';

  /* ---------- Состояние ---------- */

  var perechen = null;        // { pozicii: [], imyaFajla: '', vsego: 0 }
  var istochnik = '';
  var izProshlogoSeansa = false;

  var tablica = null;         // { stroki, iShapki, iKoda, iTovara, imyaFajla, bufer, tip }
  var rezultat = [];          // по одному элементу на строку таблицы (включая нетоварные)

  /* ============================================================
     Коды
     ============================================================ */

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
     RTF -> строки таблицы

     Сводный перечень — одна большая таблица, и позиция читается
     только по ячейкам: коды ТН ВЭД в одной графе, коды ОКПД 2
     (внешне такие же цифры) — в соседней. Поэтому здесь нужен
     разбор с сохранением границ ячеек (\cell) и строк (\row),
     а не сплошной текст, которым обходится checker.js.
     ============================================================ */

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
    'ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏ' +
    'ђ‘’“”•–—™љ›њќћџ' +
    ' ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї' +
    '°±Ііґµ¶·ё№є»јЅѕї' +
    'АБВГДЕЖЗИЙКЛМНОП' +
    'РСТУФХЦЧШЩЪЫЬЭЮЯ' +
    'абвгдежзийклмноп' +
    'рстуфхцчшщъыьэюя';

  function bajtCp1251(b) {
    if (b < 0x80) return String.fromCharCode(b);
    return CP1251_VERH.charAt(b - 0x80) || '';
  }

  function rtfVStroki(raw) {
    var stroki = [];
    var stroka = [];
    var buf = [];
    var i = 0, n = raw.length;
    var propusk = [false];

    function konecYachejki() {
      stroka.push(buf.join('').replace(/[ \t ]+\n/g, '\n').trim());
      buf = [];
    }
    function konecStroki() {
      if (buf.length) konecYachejki();
      if (stroka.length) stroki.push(stroka);
      stroka = [];
    }

    while (i < n) {
      var c = raw.charAt(i);

      if (c === '\\') {
        var sled = raw.charAt(i + 1);

        if (sled === '\\' || sled === '{' || sled === '}') {
          if (!propusk[propusk.length - 1]) buf.push(sled);
          i += 2;
          continue;
        }

        if (sled === "'") {
          var b = parseInt(raw.substr(i + 2, 2), 16);
          if (!isNaN(b) && !propusk[propusk.length - 1]) buf.push(bajtCp1251(b));
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
            if (!propusk[propusk.length - 1]) buf.push(String.fromCharCode(kod));
            i += m[0].length;
            if (raw.charAt(i) === '?') i += 1;
            continue;
          } else if (slovo === 'cell') {
            if (!propusk[propusk.length - 1]) konecYachejki();
          } else if (slovo === 'row') {
            if (!propusk[propusk.length - 1]) konecStroki();
          } else if (slovo === 'par' || slovo === 'line') {
            if (!propusk[propusk.length - 1]) buf.push('\n');
          } else if (slovo === 'tab') {
            if (!propusk[propusk.length - 1]) buf.push(' ');
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

      if (!propusk[propusk.length - 1]) buf.push(c);
      i += 1;
    }

    konecStroki();
    return stroki;
  }

  /* ============================================================
     Разбор графы с кодами ТН ВЭД
     ============================================================ */

  /* «2206 00 590 9 - код исключен с 04.02.2025 согласно…» —
     позиция такой код больше не охватывает. */
  var RE_KOD_ISKLUCHEN = /код[аы]?\s+исключ[её]н/i;
  var RE_ZAGOLOVOK_KODOV = /^\(?\s*код[аы]?\s+(включен|исключ)/i;
  var RE_IZ = /(^|\s)из\s+\d/i;

  /* Текстовое исключение: словами, а не кодом — автоматика
     решить не может. */
  var RE_ISKL_TEKSTOM = /абзац|пункт|постановлени|указанн|соответствии|для дет|в части|содержащ/i;

  function ochistitOtSsylok(t) {
    t = String(t || '');
    t = t.replace(/постановлени[а-яё]*\s+Правительств[а-яё]*[^,;)]*/gi, ' ');
    t = t.replace(/от\s+\d{1,2}[.\s][^,;)]{0,20}\d{4}\s*г?\.?/gi, ' ');
    t = t.replace(/\bN\s*\d+/gi, ' ');
    t = t.replace(/№\s*\d+/g, ' ');
    t = t.replace(/\d{2}\.\d{2}\.\d{4}/g, ' ');
    return t;
  }

  function vytashchitKody(s) {
    var t = ochistitOtSsylok(s);
    var rez = [];
    var chasti = t.split(/[,;\n]/);
    for (var i = 0; i < chasti.length; i++) {
      var m = chasti[i].match(/\d[\d\s]*\d|\d/g);
      if (!m) continue;
      for (var j = 0; j < m.length; j++) {
        var k = normKod(m[j]);
        if (k.length >= 4 && k.length <= 10 && rez.indexOf(k) === -1) rez.push(k);
      }
    }
    return rez;
  }

  /* Графа кодов бывает не только списком кодов:
       «2009\n(кроме 2009 11)»          — исключение кодом
       «из 2309»                        — часть товарной позиции
       «1806 (за исключением товаров…)» — исключение словами
       «упакованные в банки…»           — условие по упаковке
     Скобка может открыться на одной строке, а закрыться на
     следующей — поэтому глубина считается сквозь переносы. */
  function razborGrafyKodov(yachejka) {
    var stroki = String(yachejka || '').split('\n');
    var osnovnoy = [], vIskl = [], uslovie = [];
    var glubina = 0, etoIskl = false;
    var isklText = false, chast = false;

    for (var i = 0; i < stroki.length; i++) {
      var s = stroki[i];
      if (!s.trim()) continue;
      if (RE_KOD_ISKLUCHEN.test(s)) continue;
      if (RE_ZAGOLOVOK_KODOV.test(s.trim())) continue;
      if (RE_IZ.test(s)) chast = true;

      var buf = '';
      for (var j = 0; j < s.length; j++) {
        var c = s.charAt(j);
        if (c === '(') {
          (glubina > 0 ? (etoIskl ? vIskl : uslovie) : osnovnoy).push(buf);
          buf = '';
          if (glubina === 0) {
            var hvost = s.slice(j + 1) + ' ' + (stroki[i + 1] || '');
            etoIskl = /^\s*(кроме|за\s+исключением|искл)/i.test(hvost);
          }
          glubina++;
          continue;
        }
        if (c === ')') {
          (glubina > 0 ? (etoIskl ? vIskl : uslovie) : osnovnoy).push(buf);
          buf = '';
          if (glubina > 0) glubina--;
          if (glubina === 0) etoIskl = false;
          continue;
        }
        buf += c;
      }
      (glubina > 0 ? (etoIskl ? vIskl : uslovie) : osnovnoy).push(buf + '\n');
    }

    var tekstIskl = vIskl.join(' ');
    if (RE_ISKL_TEKSTOM.test(tekstIskl)) isklText = true;

    var tekstUslovie = uslovie.join(' ').replace(/\s+/g, ' ').trim();
    if (tekstUslovie && /[а-яё]{4}/i.test(tekstUslovie)) chast = true;

    return {
      kody: vytashchitKody(osnovnoy.join('\n')),
      iskl: vytashchitKody(tekstIskl),
      isklText: isklText,
      chast: chast,
      uslovie: tekstUslovie.slice(0, 200)
    };
  }

  /* ============================================================
     Разбор графы со сроком
     ============================================================ */

  var MESYACY = ['январ', 'феврал', 'март', 'апрел', 'мая', 'июн',
                 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр'];

  var RE_DATA = /(\d{1,2})\s+([а-яё]+)\s+(\d{4})/gi;

  function nomerMesyaca(slovo) {
    var s = String(slovo || '').toLowerCase();
    for (var i = 0; i < MESYACY.length; i++) {
      if (s.indexOf(MESYACY[i]) === 0) return i;
    }
    return -1;
  }

  /* Возвращает дату начала обязательной маркировки. У позиции
     часто две даты — подача заявления о регистрации и собственно
     маркировка; берём вторую, если она подписана. */
  function razborSroka(yachejka) {
    var t = String(yachejka || '');
    if (!t.trim()) return { data: null, tekst: '', zavershen: false, do_: null };

    var vse = [];
    RE_DATA.lastIndex = 0;
    var m;
    while ((m = RE_DATA.exec(t)) !== null) {
      var mes = nomerMesyaca(m[2]);
      if (mes === -1) continue;
      var d = new Date(parseInt(m[3], 10), mes, parseInt(m[1], 10));
      var hvost = t.slice(m.index + m[0].length, m.index + m[0].length + 90);
      vse.push({
        data: d,
        obyaz: /начал[оа]\s+обязательной\s+маркировки/i.test(hvost),
        tekst: m[0]
      });
    }
    if (!vse.length) return { data: null, tekst: t.slice(0, 80), zavershen: false, do_: null };

    var obyaz = vse.filter(function (v) { return v.obyaz; });
    var vybor = obyaz.length ? obyaz[0] : vse[0];

    // «с … по …» — период эксперимента: конец берём последней датой.
    // Без \b: в JS граница слова кириллицу не видит
    var period = /(^|\s)по\s+\d{1,2}\s+[а-яё]+\s+\d{4}/i.test(t);
    var do_ = period ? vse[vse.length - 1] : null;
    var zavershen = /\(\s*завершен/i.test(t);

    var tekst = period
      ? 'с ' + vse[0].tekst + ' г. по ' + do_.tekst + ' г.' + (zavershen ? ' (завершён)' : '')
      : vybor.tekst + ' г.' + (vybor.obyaz ? ' (обязательная маркировка)' : '');

    return {
      data: vybor.data,
      tekst: tekst,
      zavershen: zavershen,
      do_: do_ ? do_.data : null
    };
  }

  /* ============================================================
     Разбор перечня
     ============================================================ */

  var RE_NOMER = /^\d+(\.\d+)*\.?$/;
  var RE_EKSPERIMENTY = /^Эксперимент[а-яё]*\s*,?\s*проводим/i;
  var RE_SHAPKA_PERECHNYA = /^Наименование\s+товара/i;

  /* Строки таблицы -> позиции перечня.

     Строка с номером открывает позицию; строка без номера, но
     с кодами — её продолжение. Продолжение обычно называет свой
     товар («смартфоны» внутри позиции 81 «Радиоэлектронная
     продукция»), а вот срок, примечание и НПА в нём чаще пусты
     и берутся от родительской строки — иначе у смартфонов не
     оказалось бы срока вовсе. Раздел «Эксперименты, проводимые
     по маркировке отдельных товаров» отделяет добровольную
     маркировку от обязательной — всё после него обязанности
     не создаёт. */
  function razobratPerechen(stroki) {
    var pozicii = [];
    var eksperimenty = false;
    var rodit = null;
    var nachalos = false;

    for (var i = 0; i < stroki.length; i++) {
      var yach = stroki[i];

      if (yach.length <= 1) {
        var zag = (yach[0] || '').replace(/\s+/g, ' ').trim();
        if (RE_EKSPERIMENTY.test(zag)) { eksperimenty = true; rodit = null; }
        continue;
      }

      if (!nachalos) {
        if (RE_SHAPKA_PERECHNYA.test((yach[0] || '').trim())) nachalos = true;
        continue;
      }

      // Разметка таблицы: № · наименование · ТН ВЭД · ОКПД 2 · срок · примечание · НПА
      var nomer = (yach[0] || '').replace(/\s+/g, ' ').trim();
      var naim = (yach[1] || '').replace(/\s+/g, ' ').trim();
      var grafaKodov = yach[2] || '';
      var srokTekst = (yach[4] || '').replace(/\s+/g, ' ').trim();
      var prim = (yach[5] || '').replace(/[ \t]+/g, ' ').trim();
      var npa = (yach[6] || '').replace(/\s+/g, ' ').trim();

      var r = razborGrafyKodov(grafaKodov);
      var novaya = RE_NOMER.test(nomer);

      if (novaya) {
        rodit = { nomer: nomer.replace(/\.$/, ''), naim: naim,
                  srokTekst: srokTekst, prim: prim, npa: npa };
      }
      if (!r.kody.length) continue;
      if (!rodit) rodit = { nomer: '', naim: naim, srokTekst: '', prim: '', npa: '' };

      var mojSrok = srokTekst || rodit.srokTekst;
      var srok = razborSroka(mojSrok);

      pozicii.push({
        nomer: rodit.nomer,
        naim: naim || rodit.naim,
        kody: r.kody,
        iskl: r.iskl,
        isklText: r.isklText,
        chast: r.chast,
        uslovie: r.uslovie,
        srokTekst: srok.tekst.slice(0, 90),
        srok: srok.data ? srok.data.getTime() : null,
        srokDo: srok.do_ ? srok.do_.getTime() : null,
        zavershen: srok.zavershen,
        prim: (prim || rodit.prim).slice(0, 1500),
        npa: (npa || rodit.npa).slice(0, 200),
        eksperiment: eksperimenty
      });
    }

    return pozicii;
  }

  /* ============================================================
     Проверка товара
     ============================================================ */

  function segodnya() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  var MESYACY_RODIT = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
                       'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function datojPoRusski(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.getDate() + ' ' + MESYACY_RODIT[d.getMonth()] + ' ' + d.getFullYear() + ' г.';
  }

  function podpisPozicii(p, sSrokom) {
    var s = 'поз. ' + (p.nomer || '?') + ' «' + (p.naim || '').slice(0, 90) + '»';
    if (sSrokom && p.srokTekst) s += ', срок: ' + p.srokTekst;
    return s;
  }

  /* Один товар против всего перечня. Решение принимается по коду
     ТН ВЭД; наименование позиции идёт в пояснение, чтобы
     оператор мог свериться. */
  function proveritTovar(kodTovara) {
    var kt = normKod(kodTovara);
    if (!kt) {
      return { vyvod: '', tekst: '', detali: 'код ТН ВЭД не указан — проверка не проводилась' };
    }
    if (!perechen || !perechen.pozicii.length) {
      return { vyvod: 'проверьте вручную', tekst: 'проверьте вручную — перечень не загружен',
               detali: '' };
    }

    var seychas = segodnya();
    var tochnye = [];      // обязательная маркировка, срок наступил
    var somnitelnye = [];  // совпало, но есть оговорка
    var korotkie = [];     // код товара короче кода перечня
    var opyty = [];        // эксперименты
    var primechaniya = [];

    for (var i = 0; i < perechen.pozicii.length; i++) {
      var p = perechen.pozicii[i];
      var sovpalo = null, korotkiy = null;

      for (var k = 0; k < p.kody.length; k++) {
        var pk = p.kody[k];
        if (kt.indexOf(pk) === 0) {
          if (!sovpalo || pk.length > sovpalo.length) sovpalo = pk;
        } else if (pk.indexOf(kt) === 0 && kt.length < pk.length) {
          if (!korotkiy) korotkiy = pk;
        }
      }

      if (sovpalo) {
        // Код выведен из позиции отдельной оговоркой «(кроме …)»
        var vyveden = false;
        for (var e = 0; e < p.iskl.length; e++) {
          if (kt.indexOf(p.iskl[e]) === 0) { vyveden = true; break; }
        }
        if (vyveden) continue;

        var zapis = { poz: p, kod: sovpalo };

        if (p.eksperiment) {
          opyty.push(zapis);
        } else if (p.srok && p.srok > seychas) {
          zapis.prichina = 'маркировка вводится с ' + datojPoRusski(p.srok);
          somnitelnye.push(zapis);
        } else if (p.isklText) {
          zapis.prichina = 'в позиции есть исключение, заданное словами';
          somnitelnye.push(zapis);
        } else if (p.chast) {
          zapis.prichina = 'позиция охватывает не весь код' +
                           (p.uslovie ? ' (' + p.uslovie + ')' : '');
          somnitelnye.push(zapis);
        } else {
          tochnye.push(zapis);
          if (p.prim) primechaniya.push(p.prim);
        }
      } else if (korotkiy && !p.eksperiment) {
        korotkie.push({ poz: p, kod: korotkiy });
      }
    }

    var detali = [];
    function opisat(spisok, zagolovok) {
      if (!spisok.length) return;
      var vidy = spisok.slice(0, 5).map(function (z) {
        return krasivyKod(z.kod) + ' — ' + podpisPozicii(z.poz, true) +
               (z.prichina ? ' [' + z.prichina + ']' : '');
      });
      if (spisok.length > 5) vidy.push('и ещё ' + (spisok.length - 5));
      detali.push(zagolovok + ': ' + vidy.join('; '));
    }
    opisat(tochnye, 'Подлежит маркировке');
    opisat(somnitelnye, 'Требует проверки');
    opisat(korotkie, 'Код товара короче кода перечня');
    opisat(opyty, 'Эксперимент по маркировке');

    var vyvod, tekst;

    if (tochnye.length) {
      vyvod = 'требуется';
      tekst = 'требуется';
      var prim = [];
      primechaniya.forEach(function (p) {
        if (prim.indexOf(p) === -1) prim.push(p);
      });
      if (prim.length) tekst += ' — ' + prim.join(' | ');
    } else if (somnitelnye.length || korotkie.length) {
      vyvod = 'проверьте вручную';
      // Одна и та же оговорка часто повторяется в подпозициях
      // («корма» — сухие, влажные, лакомства): причина пишется
      // один раз, позиции перечисляются за ней
      var poPrichine = [], indeks = {};
      somnitelnye.forEach(function (z) {
        if (indeks[z.prichina] === undefined) {
          indeks[z.prichina] = poPrichine.length;
          poPrichine.push({ prichina: z.prichina, pozicii: [] });
        }
        var gr = poPrichine[indeks[z.prichina]];
        var podpis = podpisPozicii(z.poz);
        if (gr.pozicii.indexOf(podpis) === -1) gr.pozicii.push(podpis);
      });
      var prichiny = poPrichine.map(function (gr) {
        var spisok = gr.pozicii.slice(0, 2).join(', ');
        if (gr.pozicii.length > 2) spisok += ' и ещё ' + (gr.pozicii.length - 2);
        return gr.prichina + ' (' + spisok + ')';
      });
      if (korotkie.length) {
        prichiny.push('код товара короче кода перечня — ' +
          korotkie.slice(0, 3).map(function (z) {
            return krasivyKod(z.kod) + ' (' + podpisPozicii(z.poz) + ')';
          }).join('; '));
      }
      tekst = 'проверьте вручную — ' + prichiny.slice(0, 3).join('; ');
    } else {
      vyvod = 'не требуется';
      tekst = 'не требуется';
      if (opyty.length) {
        var o = opyty[0];
        tekst += ' (по коду ' + (o.poz.zavershen ? 'проводился' : 'идёт') +
                 ' эксперимент по маркировке: ' + podpisPozicii(o.poz, true) + ')';
      }
    }

    return { vyvod: vyvod, tekst: tekst, detali: detali.join(' | ') };
  }

  /* ============================================================
     Таблица товаров
     ============================================================ */

  var KLYUCHI_TNVED = [
    'тн вэд', 'тнвэд', 'тн-вэд', 'код тн', 'тн.вэд',
    'hs code', 'hs-code', 'hscode', 'hs код', 'tnved',
    'товарный код', 'код тнвед', 'commodity code'
  ];

  /* Заголовки, похожие на код, но означающие артикул. */
  var KLYUCHI_NE_TNVED = [
    'артикул', 'item code', 'код изделия', 'part number', 'парт номер',
    'номер детали', 'sku', 'код позиции'
  ];

  var KLYUCHI_TOVAR = [
    'товар', 'наименование', 'название', 'описание',
    'goods', 'description', 'наим.'
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

  function najtiKolonkuTovara(zag) {
    for (var i = 0; i < zag.length; i++) {
      var z = String(zag[i] || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (!z) continue;
      for (var j = 0; j < KLYUCHI_TOVAR.length; j++) {
        if (z.indexOf(KLYUCHI_TOVAR[j]) !== -1) return i;
      }
    }
    return -1;
  }

  function najtiStrokuZagolovkov(dannye) {
    var predel = Math.min(dannye.length, 30);
    for (var i = 0; i < predel; i++) {
      var iKod = najtiKolonkuTnved(dannye[i] || []);
      if (iKod === -1) continue;
      for (var j = i + 1; j < dannye.length; j++) {
        if (normKod((dannye[j] || [])[iKod]).length >= 4) {
          return { strokaZagolovkov: i, kolonkaKoda: iKod };
        }
      }
    }
    return null;
  }

  function ugadatKolonkuTnved(stroki) {
    if (!stroki.length) return { indeks: -1, prichina: 'нет строк' };

    var kolvo = 0;
    stroki.forEach(function (r) { if (r && r.length > kolvo) kolvo = r.length; });

    var kandidaty = [];
    for (var c = 0; c < kolvo; c++) {
      var podhodyat = 0, vsego = 0, desyati = 0;
      for (var r = 0; r < stroki.length; r++) {
        var v = (stroki[r] || [])[c];
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
          var bufer = e.target.result;
          var wb = XLSX.read(new Uint8Array(bufer), { type: 'array' });
          var ws = wb.Sheets[wb.SheetNames[0]];
          // blankrows: строки исходника сохраняются как есть — выгрузка
          // должна повторять файл строка в строку
          var dannye = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
          if (!dannye.length) { reject(new Error('лист пустой')); return; }
          resolve({ dannye: dannye, bufer: bufer, imya: file.name, list: wb.SheetNames[0] });
        } catch (err) {
          reject(new Error('файл не читается как таблица'));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function obrabotat(prochitano) {
    var dannye = prochitano.dannye;
    var iKod, poZagolovku, iShapki;
    var najdeno = najtiStrokuZagolovkov(dannye);

    if (najdeno) {
      iShapki = najdeno.strokaZagolovkov;
      iKod = najdeno.kolonkaKoda;
      poZagolovku = true;
    } else {
      // Графа с нужным названием может быть на месте, но пустой —
      // это не «не нашёл графу», а «нечего проверять»
      for (var s = 0; s < Math.min(dannye.length, 30); s++) {
        var iPusto = najtiKolonkuTnved(dannye[s] || []);
        if (iPusto !== -1) {
          soobshchenie('Графа «' + String(dannye[s][iPusto]).slice(0, 40) +
                       '» найдена, но кодов ТН ВЭД в ней нет — проверять нечего.', 'error');
          return;
        }
      }

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

    var zagolovki = (dannye[iShapki] || []).map(function (z) {
      return String(z === undefined ? '' : z).replace(/\s+/g, ' ').trim();
    });
    var iTovar = najtiKolonkuTovara(zagolovki);

    var proverennyh = 0;
    rezultat = dannye.map(function (str, i) {
      if (i <= iShapki) return { stroka: str, tovarnaya: false };
      var kod = (str || [])[iKod];
      if (normKod(kod).length < 4) return { stroka: str, tovarnaya: false };
      proverennyh++;
      var p = proveritTovar(kod);
      return {
        stroka: str, tovarnaya: true, kod: kod,
        tovar: iTovar === -1 ? '' : (str[iTovar] || ''),
        vyvod: p.vyvod, tekst: p.tekst, detali: p.detali
      };
    });

    if (!proverennyh) {
      soobshchenie('В таблице не найдено строк с кодами ТН ВЭД.', 'error');
      return;
    }

    tablica = {
      dannye: dannye, iShapki: iShapki, iKod: iKod, iTovar: iTovar,
      zagolovki: zagolovki, imya: prochitano.imya, bufer: prochitano.bufer,
      list: prochitano.list
    };

    var imyaGrafy = (zagolovki[iKod] || ('графа №' + (iKod + 1))).slice(0, 40);
    var chasti = ['Проверено товаров: ' + proverennyh];
    chasti.push('код взят из графы «' + imyaGrafy + '»');
    if (iShapki > 0) chasti.push('шапка найдена в строке ' + (iShapki + 1));
    if (iTovar === -1) chasti.push('графа с наименованием товара не найдена');
    if (!poZagolovku) chasti.push('графа определена по содержимому — проверьте');

    soobshchenie(chasti.join('; ') + '.');
    pokazatTablicu();
  }

  /* ============================================================
     Загрузка перечня
     ============================================================ */

  function prinyatFajlPerechnya(file) {
    soobshchenieOPerechne('Читаю файл…');

    return prochitatRtf(file).then(function (r) {
      if (r.oshibka) {
        soobshchenieOPerechne('Не удалось разобрать: ' + r.oshibka, 'error');
        return;
      }

      perechen = { pozicii: r.pozicii, imyaFajla: r.imya };
      istochnik = r.imya + ', загружен ' + new Date().toLocaleString('ru-RU');
      izProshlogoSeansa = false;
      sohranitVHranilishche();

      var obyaz = r.pozicii.filter(function (p) { return !p.eksperiment; }).length;
      soobshchenieOPerechne('Принято позиций: ' + obyaz + ' обязательных, ' +
        (r.pozicii.length - obyaz) + ' экспериментальных.');
      pokazatStatus();
      otkrytShagTovarov(true);
    });
  }

  function prochitatRtf(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onerror = function () { resolve({ oshibka: 'файл не читается' }); };
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
            resolve({ oshibka: 'это не файл RTF' });
            return;
          }

          var stroki = rtfVStroki(syroy);
          var pozicii = razobratPerechen(stroki);
          if (!pozicii.length) {
            resolve({ oshibka: 'в файле не найдено позиций с кодами ТН ВЭД' });
            return;
          }

          resolve({ imya: file.name, pozicii: pozicii });
        } catch (err) {
          resolve({ oshibka: 'ошибка разбора: ' + err.message });
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
        perechen: perechen
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
      if (!o || !o.perechen || !o.perechen.pozicii) return false;

      perechen = o.perechen;
      istochnik = o.istochnik || 'предыдущий сеанс';
      izProshlogoSeansa = true;

      var d = o.data ? new Date(o.data) : null;
      var kogda = d ? d.toLocaleString('ru-RU') : 'неизвестно когда';

      soobshchenieOPerechne(
        'Перечень из предыдущего запуска (загружен ' + kogda + '). ' +
        'Перечень маркируемых товаров меняется часто — если не уверены, ' +
        'загрузите файл заново.',
        'warn'
      );
      pokazatStatus();
      otkrytShagTovarov(true);
      return true;
    } catch (e) {
      return false;
    }
  }

  function zabytPerechen() {
    try { localStorage.removeItem(HRANILISHCHE); } catch (e) {}
    perechen = null;
    istochnik = '';
    izProshlogoSeansa = false;
    rezultat = [];
    tablica = null;

    var panel = document.getElementById('chz-result-panel');
    if (panel) panel.hidden = true;
    var st = document.getElementById('chz-status');
    if (st) st.hidden = true;
    var kn = document.getElementById('chz-zabyt');
    if (kn) kn.hidden = true;

    soobshchenieOPerechne('Перечень удалён. Загрузите файл перечня.');
    soobshchenie('');
    otkrytShagTovarov(false);
  }

  /* ============================================================
     Отрисовка
     ============================================================ */

  function pustaya(stroka) {
    if (!stroka) return true;
    for (var i = 0; i < stroka.length; i++) {
      if (String(stroka[i] === undefined ? '' : stroka[i]).trim() !== '') return false;
    }
    return true;
  }

  function klassVyvoda(v) {
    if (v === 'требуется') return 'chk-da';
    if (v === 'проверьте вручную') return 'chk-prov';
    if (v === 'не требуется') return 'chk-net';
    return 'chk-pusto';
  }

  function pokazatTablicu() {
    var host = document.getElementById('chz-tablica');
    var panel = document.getElementById('chz-result-panel');
    if (!host || !tablica) return;

    var zagolovki = tablica.zagolovki;
    var shirina = zagolovki.length;
    rezultat.forEach(function (r) {
      if (r.stroka && r.stroka.length > shirina) shirina = r.stroka.length;
    });

    var html = '<table><thead><tr>';
    for (var i = 0; i < shirina; i++) {
      html += '<th>' + ekran(zagolovki[i] || ('графа №' + (i + 1))) + '</th>';
    }
    html += '<th class="col-chz">' + ekran(IMYA_GRAFY) + '</th></tr></thead><tbody>';

    rezultat.forEach(function (r, n) {
      if (n <= tablica.iShapki) return;   // шапку и преамбулу показывать незачем
      if (!r.tovarnaya && pustaya(r.stroka)) return;
      html += '<tr>';
      for (var i = 0; i < shirina; i++) {
        var v = (r.stroka || [])[i];
        html += '<td class="cell-sm">' + ekran(v === undefined ? '' : v) + '</td>';
      }
      if (r.tovarnaya) {
        html += '<td class="cell-itog ' + klassVyvoda(r.vyvod) + '"' +
                (r.detali ? ' title="' + ekran(r.detali) + '"' : '') + '>' +
                ekran(r.tekst) + '</td>';
      } else {
        html += '<td class="chk-pusto">—</td>';
      }
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

  /* ============================================================
     Выгрузка

     Загруженный файл возвращается как есть — с теми же листами,
     строками и оформлением, — и к нему дописывается одна графа.
     Для XLSX это буквально исходная книга (ExcelJS открывает её
     и дописывает ячейки); XLS и CSV ExcelJS открыть не может,
     поэтому для них книга собирается заново из прочитанных
     значений.
     ============================================================ */

  function vygruzit() {
    if (!tablica || !rezultat.length) return;

    var xlsx = /\.xlsx$/i.test(tablica.imya);
    var rabota = xlsx ? dopisatVIshodnyj() : sobratZanovo();

    rabota.then(function (buf) {
      var blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = imyaVygruzki();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }).catch(function (e) {
      soobshchenie('Не удалось сформировать файл: ' + e.message, 'error');
    });
  }

  function imyaVygruzki() {
    var bez = String(tablica.imya || 'tovary').replace(/\.[^.]+$/, '');
    return bez + ' — честный знак.xlsx';
  }

  /* Номер графы, в которую пишем вывод: сразу за последней
     занятой графой листа. */
  function nomerGrafy(shirinaLista) {
    var shirina = shirinaLista;
    rezultat.forEach(function (r) {
      if (r.stroka && r.stroka.length > shirina) shirina = r.stroka.length;
    });
    return shirina + 1;
  }

  function dopisatVIshodnyj() {
    var wb = new ExcelJS.Workbook();
    return wb.xlsx.load(tablica.bufer).then(function () {
      var ws = wb.getWorksheet(tablica.list) || wb.worksheets[0];
      if (!ws) throw new Error('в книге нет листов');

      var graf = nomerGrafy(ws.columnCount || 0);

      var shapka = ws.getRow(tablica.iShapki + 1);
      var cShapki = shapka.getCell(graf);
      cShapki.value = IMYA_GRAFY;
      cShapki.font = { bold: true };
      cShapki.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cShapki.border = { top: { style: 'thin' }, left: { style: 'thin' },
                         bottom: { style: 'thin' }, right: { style: 'thin' } };
      cShapki.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E4F6' } };
      shapka.commit && shapka.commit();

      rezultat.forEach(function (r, i) {
        if (!r.tovarnaya) return;
        zapisatYachejku(ws.getRow(i + 1).getCell(graf), r);
      });

      ws.getColumn(graf).width = 46;
      return wb.xlsx.writeBuffer();
    });
  }

  function sobratZanovo() {
    var wb = new ExcelJS.Workbook();
    var ws = wb.addWorksheet(tablica.list || 'Товары');
    var graf = nomerGrafy(tablica.zagolovki.length);

    rezultat.forEach(function (r, i) {
      var stroka = (r.stroka || []).slice();
      while (stroka.length < graf - 1) stroka.push('');
      var row = ws.addRow(stroka);
      if (i === tablica.iShapki) {
        var c = row.getCell(graf);
        c.value = IMYA_GRAFY;
        c.font = { bold: true };
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E4F6' } };
      } else if (r.tovarnaya) {
        zapisatYachejku(row.getCell(graf), r);
      }
    });

    ws.getColumn(graf).width = 46;
    return wb.xlsx.writeBuffer();
  }

  function zapisatYachejku(cell, r) {
    cell.value = r.tekst;
    cell.alignment = { vertical: 'top', wrapText: true };
    if (r.vyvod === 'требуется') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0E0' } };
      cell.font = { bold: true };
    } else if (r.vyvod === 'проверьте вручную') {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE45C' } };
      cell.font = { bold: true };
    }
    if (r.detali) cell.note = { texts: [{ text: r.detali }] };
  }

  /* ---------- Сообщения ---------- */

  function soobshchenie(tekst, tip) {
    var el = document.getElementById('chz-soobshchenie');
    if (!el) return;
    el.textContent = tekst;
    el.className = 'status' + (tip === 'error' ? ' is-error' :
                               (tip === 'warn' ? ' is-warn' : ''));
  }

  function soobshchenieOPerechne(tekst, tip) {
    var el = document.getElementById('chz-perechen-soobshchenie');
    if (!el) return;
    el.textContent = tekst;
    el.className = 'status' + (tip === 'error' ? ' is-error' :
                               (tip === 'warn' ? ' is-warn' : ''));
  }

  function pokazatStatus() {
    var el = document.getElementById('chz-status');
    if (!el || !perechen) return;

    var obyaz = 0, opyty = 0, poslednyaya = null;
    perechen.pozicii.forEach(function (p) {
      if (p.eksperiment) opyty++; else obyaz++;
      if (p.srok && (!poslednyaya || p.srok > poslednyaya)) poslednyaya = p.srok;
    });

    var stroki = [
      'Позиций обязательной маркировки — ' + obyaz,
      'Позиций экспериментов — ' + opyty
    ];
    if (poslednyaya) {
      stroki.push('Самый поздний срок в перечне — ' +
        new Date(poslednyaya).toLocaleDateString('ru-RU'));
    }

    el.innerHTML = (izProshlogoSeansa
        ? '<b>Перечень из предыдущего запуска.</b><br>'
        : '<b>Источник:</b> ' + ekran(istochnik) + '<br>') +
      stroki.join('<br>');
    el.hidden = false;
    el.classList.toggle('is-stale', izProshlogoSeansa);

    var knopka = document.getElementById('chz-zabyt');
    if (knopka) knopka.hidden = false;
  }

  function otkrytShagTovarov(dostupno) {
    var shag = document.getElementById('chz-shag-tovary');
    if (!shag) return;
    shag.classList.toggle('is-locked', !dostupno);
    var zona = document.getElementById('chz-drop');
    if (zona) {
      zona.setAttribute('aria-disabled', dostupno ? 'false' : 'true');
      zona.tabIndex = dostupno ? 0 : -1;
    }
  }

  /* ---------- Инициализация ---------- */

  function podklyuchitZonu(zona, vhod, obrabotchik) {
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
      if (f && f.length) obrabotchik(f[0]);
    });
    vhod.addEventListener('change', function (e) {
      if (e.target.files.length) obrabotchik(e.target.files[0]);
      e.target.value = '';
    });
  }

  function init() {
    var vhodTovary = document.getElementById('chz-fajl');
    if (!vhodTovary) return;

    podklyuchitZonu(
      document.getElementById('chz-perechen-drop'),
      document.getElementById('chz-perechen-fajl'),
      function (file) { prinyatFajlPerechnya(file).catch(function () {}); }
    );

    podklyuchitZonu(
      document.getElementById('chz-drop'),
      vhodTovary,
      function (file) {
        if (!perechen) {
          soobshchenie('Сначала загрузите файл перечня.', 'error');
          return;
        }
        soobshchenie('Читаю таблицу…');
        prochitatTablicu(file).then(obrabotat).catch(function (err) {
          soobshchenie('Ошибка: ' + err.message, 'error');
        });
      }
    );

    var knSkachat = document.getElementById('chz-skachat');
    if (knSkachat) knSkachat.addEventListener('click', vygruzit);

    var knZabyt = document.getElementById('chz-zabyt');
    if (knZabyt) knZabyt.addEventListener('click', zabytPerechen);

    if (!zagruzitIzHranilishcha()) {
      otkrytShagTovarov(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MarkirovkaChestnyZnak = {
    rtfVStroki: rtfVStroki,
    razobratPerechen: razobratPerechen,
    razborGrafyKodov: razborGrafyKodov,
    razborSroka: razborSroka,
    proveritTovar: proveritTovar,
    normKod: normKod,
    najtiStrokuZagolovkov: najtiStrokuZagolovkov,
    poluchitPerechen: function () { return perechen; },
    zadatPerechen: function (p) { perechen = p; }
  };

})();
