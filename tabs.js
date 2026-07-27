/* Переключение разделов приложения.
   Отдельный файл: app.js и checker.js друг о друге не знают. */

(function () {
  'use strict';

  function init() {
    var knopki = document.querySelectorAll('.tab');
    var paneli = document.querySelectorAll('.tab-panel');
    if (!knopki.length) return;

    function pokazat(idPaneli) {
      knopki.forEach(function (k) {
        var aktivna = k.dataset.tab === idPaneli;
        k.classList.toggle('is-active', aktivna);
        k.setAttribute('aria-selected', aktivna ? 'true' : 'false');
      });
      paneli.forEach(function (p) {
        var aktivna = p.id === idPaneli;
        p.classList.toggle('is-active', aktivna);
        p.hidden = !aktivna;
      });
      // Запоминаем выбор на время сессии
      try { sessionStorage.setItem('aktivnyRazdel', idPaneli); } catch (e) {}
    }

    knopki.forEach(function (k) {
      k.addEventListener('click', function () { pokazat(k.dataset.tab); });

      // Стрелками между вкладками
      k.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        var spisok = Array.prototype.slice.call(knopki);
        var i = spisok.indexOf(k);
        var sled = e.key === 'ArrowRight'
          ? (i + 1) % spisok.length
          : (i - 1 + spisok.length) % spisok.length;
        spisok[sled].focus();
        pokazat(spisok[sled].dataset.tab);
      });
    });

    // Восстанавливаем раздел после перезагрузки
    var sohranen = null;
    try { sohranen = sessionStorage.getItem('aktivnyRazdel'); } catch (e) {}
    if (sohranen && document.getElementById(sohranen)) {
      pokazat(sohranen);
    } else {
      pokazat('tab-tablica');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
