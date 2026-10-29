(function () {
  'use strict';
  var key = 'monophenomenalism-reading-theme';
  var root = document.documentElement;
  // Apply the saved choice before the article is painted. Light is the default.
  try {
    if (localStorage.getItem(key) === 'dark') root.dataset.theme = 'dark';
  } catch (error) { /* Reading still works when storage is unavailable. */ }

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;
    var ru = root.lang === 'ru';
    function update() {
      var dark = root.dataset.theme === 'dark';
      button.textContent = dark ? (ru ? 'Светлая тема' : 'Light theme') : (ru ? 'Тёмная тема' : 'Dark theme');
      button.setAttribute('aria-label', ru ? 'Тёмная тема' : 'Dark theme');
      button.setAttribute('aria-pressed', String(dark));
    }
    update();
    button.hidden = false;
    button.addEventListener('click', function () {
      var theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = theme;
      try { localStorage.setItem(key, theme); } catch (error) { /* Session-only choice. */ }
      update();
    });
    window.addEventListener('storage', function (event) {
      if (event.key === key || event.key === null) {
        root.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
        update();
      }
    });
  });
}());
