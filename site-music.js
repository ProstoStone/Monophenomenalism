(function () {
  'use strict';
  // Temporarily hidden at the site owner's request; keep the player for later.
  var musicEnabled = false;
  if (!musicEnabled) return;
  if (document.querySelector('.site-music')) return;
  var ru = document.documentElement.lang !== 'en';
  var labels = ru ? {
    music: '♫ Музыка', pause: 'Ⅱ Музыка', load: '… Музыка', playTitle: 'Включить музыку', pauseTitle: 'Приостановить музыку',
    menu: 'Выбрать музыку и громкость', track: 'Фоновая музыка', volume: 'Громкость',
    ready: 'Без слов · повтор трека', loading: 'Загрузка музыки…', error: 'Не удалось загрузить трек. Попробуйте ещё раз или выберите другой.',
    resume: 'Нажмите «♫ Музыка», чтобы продолжить.', credits: 'Источники и лицензия'
  } : {
    music: '♫ Music', pause: 'Ⅱ Music', load: '… Music', playTitle: 'Play music', pauseTitle: 'Pause music',
    menu: 'Choose music and volume', track: 'Background music', volume: 'Volume',
    ready: 'Instrumental · repeats', loading: 'Loading music…', error: 'Unable to load this track. Try again or choose another.',
    resume: 'Press “♫ Music” to resume.', credits: 'Sources and license'
  };
  var tracks = [
    { id: 'cosmic', title: 'Cosmic Waves', duration: '33:04', seconds: 1984.56, src: 'https://archive.org/download/holizna-cc-0-cosmic-waves/HoliznaCC0%20-%20Cosmic%20Waves.mp3' },
    { id: 'dream', title: 'DreamScape', duration: '21:59', seconds: 1319.98, src: 'https://archive.org/download/holizna-cc-0-cosmic-waves/HoliznaCC0%20-%20DreamScape.mp3' },
    { id: 'meditation', title: '20 Minute Meditation 2', duration: '20:02', seconds: 1202.98, src: 'https://archive.org/download/holizna-cc-0-20-minute-meditation-2/HoliznaCC0%20-%2020%20Minute%20Meditation%202.mp3' }
  ];
  var key = 'monophenomenalism-music-v1', sessionKey = key + '-session';
  var saved = {}, session = {};
  try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch (e) {}
  try { session = JSON.parse(sessionStorage.getItem(sessionKey)) || {}; } catch (e) {}
  var selected = tracks.findIndex(function (t) { return t.id === saved.track; });
  if (selected < 0) selected = 0;
  var volume = typeof saved.volume === 'number' && Number.isFinite(saved.volume) ? Math.max(0, Math.min(1, saved.volume)) : 0.2;
  var position = session.track === tracks[selected].id && Number.isFinite(session.position) ? Math.max(0, Math.min(session.position, tracks[selected].seconds - 1)) : 0;
  var host = document.createElement('div');
  host.className = 'site-music';
  host.innerHTML = '<button type="button" class="music-play" aria-pressed="false"></button><button type="button" class="music-menu" aria-expanded="false" aria-controls="music-panel">⌄</button>' +
    '<div class="music-panel" id="music-panel" hidden><label for="music-track"></label><select id="music-track"></select>' +
    '<label for="music-volume"></label><input id="music-volume" type="range" min="0" max="100" step="1">' +
    '<p class="music-status" role="status" aria-live="polite"></p><div class="music-credit">HoliznaCC0 · CC0<br><a href="music-credits.html"></a></div></div>';
  var toolbar = document.querySelector('.reading-toolbar');
  if (toolbar) toolbar.appendChild(host);
  else {
    var row = document.createElement('div');
    row.className = 'site-music-row' + (document.querySelector('.card') ? ' music-home' : '');
    row.appendChild(host);
    document.body.insertBefore(row, document.body.firstChild);
  }
  var play = host.querySelector('.music-play'), menu = host.querySelector('.music-menu'), panel = host.querySelector('.music-panel');
  var select = host.querySelector('select'), slider = host.querySelector('input'), status = host.querySelector('.music-status');
  menu.setAttribute('aria-label', labels.menu); menu.title = labels.menu;
  host.querySelector('label[for="music-track"]').textContent = labels.track;
  host.querySelector('label[for="music-volume"]').textContent = labels.volume;
  host.querySelector('a').textContent = labels.credits;
  tracks.forEach(function (track, i) { var option = document.createElement('option'); option.value = String(i); option.textContent = track.title + ' · ' + track.duration; select.appendChild(option); });
  select.value = String(selected); slider.value = String(Math.round(volume * 100));
  var audio = document.createElement('audio');
  audio.preload = 'none'; audio.loop = true; audio.volume = volume;
  host.appendChild(audio);
  var wanted = false, loading = false, request = 0, loadedTrack = -1, lastSave = 0, timeout;
  function persist() {
    try { localStorage.setItem(key, JSON.stringify({ track: tracks[selected].id, volume: volume })); } catch (e) {}
    try { sessionStorage.setItem(sessionKey, JSON.stringify({ track: tracks[selected].id, position: loadedTrack === selected && audio.readyState > 0 ? audio.currentTime : position, playing: wanted, at: Date.now() })); } catch (e) {}
  }
  function render() {
    play.textContent = loading && wanted ? labels.load : wanted && !audio.paused ? labels.pause : labels.music;
    play.setAttribute('aria-pressed', String(wanted));
    play.setAttribute('aria-label', wanted ? labels.pauseTitle : labels.playTitle);
    play.title = wanted ? labels.pauseTitle : labels.playTitle;
  }
  function openPanel(open) { panel.hidden = !open; menu.setAttribute('aria-expanded', String(open)); }
  function stop() { ++request; wanted = false; loading = false; clearTimeout(timeout); audio.pause(); persist(); render(); }
  function fail(message) { stop(); status.textContent = message; openPanel(true); }
  function start() {
    wanted = true; loading = true; var token = ++request; status.textContent = labels.loading; render();
    if (loadedTrack !== selected || audio.error) {
      loadedTrack = selected; audio.src = tracks[selected].src; audio.load();
    }
    clearTimeout(timeout);
    timeout = setTimeout(function () { if (token === request && loading) fail(labels.error); }, 30000);
    var result = audio.play();
    if (result && result.catch) result.catch(function (error) {
      if (token !== request) return;
      fail(error.name === 'NotAllowedError' ? labels.resume : labels.error);
    });
    persist();
  }
  audio.addEventListener('loadedmetadata', function () {
    if (position > 0 && Number.isFinite(audio.duration)) {
      try { audio.currentTime = Math.min(position, audio.duration - 1); } catch (e) {}
      position = 0;
    }
  });
  audio.addEventListener('playing', function () {
    if (!wanted) { audio.pause(); return; }
    clearTimeout(timeout); loading = false; status.textContent = labels.ready; render(); persist();
  });
  audio.addEventListener('waiting', function () { if (wanted) { loading = true; status.textContent = labels.loading; render(); } });
  audio.addEventListener('error', function () { if (wanted) fail(labels.error); });
  audio.addEventListener('timeupdate', function () { if (Date.now() - lastSave > 5000) { lastSave = Date.now(); persist(); } });
  play.addEventListener('click', function () { if (wanted) { stop(); status.textContent = labels.ready; } else start(); });
  menu.addEventListener('click', function () { openPanel(panel.hidden); });
  select.addEventListener('change', function () {
    var restart = wanted; stop(); selected = Number(select.value); position = 0; loadedTrack = -1;
    audio.removeAttribute('src'); audio.load(); status.textContent = labels.ready; persist(); if (restart) start();
  });
  slider.addEventListener('input', function () { volume = Number(slider.value) / 100; audio.volume = volume; persist(); });
  document.addEventListener('click', function (event) { if (!host.contains(event.target)) openPanel(false); });
  host.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !panel.hidden) { openPanel(false); menu.focus(); } });
  // Keep a position across ordinary page navigation; no music on a first visit.
  window.addEventListener('pagehide', function () { persist(); audio.pause(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) persist(); });
  window.addEventListener('pageshow', function (event) { if (event.persisted && wanted) start(); });
  status.textContent = labels.ready; render();
  if (session.playing === true && session.track === tracks[selected].id && Date.now() - session.at < 30000) start();
}());
