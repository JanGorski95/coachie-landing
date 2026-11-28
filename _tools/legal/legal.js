(function () {
  // Old single-page links (/legal/#terms, /legal/#privacy) keep working.
  var OLD = { '#terms': '/legal/terms/', '#privacy': '/legal/privacy/', '#regulamin': '/legal/terms/', '#polityka': '/legal/privacy/' };
  if (/^\/legal\/?$/.test(location.pathname) && OLD[location.hash]) { location.replace(OLD[location.hash]); return; }

  // Same language key as the rest of the landing ('ramvo-lang').
  function detect() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'pl' || q === 'en') return q;
    try { var s = localStorage.getItem('ramvo-lang'); if (s === 'pl' || s === 'en') return s; } catch (e) {}
    return (navigator.language || '').toLowerCase().indexOf('pl') === 0 ? 'pl' : 'en';
  }
  function apply(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.lang = lang;
    var t = document.querySelector('.lang-block[data-l="' + lang + '"] h1');
    if (t) document.title = t.textContent + ' · Ramvo';
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on);
    });
    try { localStorage.setItem('ramvo-lang', lang); } catch (e) {}
  }
  apply(detect());
  document.querySelectorAll('.lang-switch button').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });
  // Section ids carry a language prefix (pl-/en-); a plain #id link
  // (e.g. /legal/subscriptions/#withdrawal) scrolls to the visible one.
  function jump() {
    var h = location.hash.slice(1);
    if (!h || /^(pl|en)-/.test(h)) return;
    var el = document.getElementById(document.documentElement.getAttribute('data-lang') + '-' + h);
    if (el) el.scrollIntoView();
  }
  setTimeout(jump, 0);
  window.addEventListener('hashchange', jump);
})();
