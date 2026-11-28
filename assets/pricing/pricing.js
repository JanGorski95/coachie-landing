/* Shared price-list logic for /pricing/trainers/ and /pricing/premium/.
 *
 * Plans, prices, bullets and features come live from the admin panel
 * (public_app_plans RPC: plans marked "active" or "show on price list"), so
 * editing a plan in the panel changes every page. The page language decides
 * the currency: PL -> PLN, EN -> GBP; switching language re-renders prices.
 *
 * Usage: RamvoPricing.start({ audience: 'trainer' | 'client', dict: { pl: {...}, en: {...} } })
 * Elements the page may provide (all optional):
 *   #iv            monthly / yearly segmented control (buttons with data-v)
 *   #save-badge    "-17%" badge inside the yearly button
 *   #plan-grid     plan cards
 *   #fit, #fit-range, #fit-out, #fit-hint   client-count slider (trainers)
 *   #compare       feature comparison table (trainers)
 *   [data-price="cheapest"]   "from X / mo" text
 *   [data-price="month"], [data-price="year"]  the single client plan's prices
 */
(function () {
  var SUPABASE_URL = 'https://grqzbmrxfllywmyugqlb.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_xMJNZcyh0Cv1kP9SDPpJuw_6fIjy_Y3';

  var COMMON = {
    pl: {
      perMonth: '/ mies.', billedMonthly: 'płatne co miesiąc', billedYearly: 'płatne {price} rocznie', youSave: 'oszczędzasz {price}',
      upTo: 'do {n} klientów', unlimited: 'bez limitu', save: '−{n}%', from: 'od {price}',
      ribbonPopular: 'Najczęściej wybierany', ribbonMatch: 'Dla Ciebie', small: 'Za mały plan',
      fitHint: 'Polecamy plan <b>{plan}</b>.', fitNone: 'Żaden plan nie mieści tylu klientów. Napisz do nas: info@ramvo.app.',
      soonTitle: 'Cennik ogłosimy wkrótce', clients: 'Aktywni klienci', limitless: 'bez limitu',
      feat: { ai: 'Generator planów AI i pomoc AI przy profilu', budget: 'Budżet: płatności i należności klientów', branding: 'Własna marka w aplikacji klienta (logo, kolory)', priority_support: 'Priorytetowe wsparcie' },
      base: ['Plany treningowe i żywieniowe, biblioteka ćwiczeń, Twoje filmy', 'Kalendarz, rezerwacje i Google Meet', 'Czat z klientami i powiadomienia', 'Profil w wyszukiwarce Ramvo z opiniami'],
      soon: 'wkrótce'
    },
    en: {
      perMonth: '/ mo', billedMonthly: 'billed monthly', billedYearly: 'billed {price} yearly', youSave: 'you save {price}',
      upTo: 'up to {n} clients', unlimited: 'unlimited', save: '−{n}%', from: 'from {price}',
      ribbonPopular: 'Most popular', ribbonMatch: 'Best for you', small: 'Plan too small',
      fitHint: 'We recommend <b>{plan}</b>.', fitNone: 'No plan fits that many clients. Write to us: info@ramvo.app.',
      soonTitle: 'Pricing coming soon', clients: 'Active clients', limitless: 'unlimited',
      feat: { ai: 'AI plan generator and AI profile help', budget: 'Budget: client payments and dues', branding: 'Your own brand in the client app (logo, colours)', priority_support: 'Priority support' },
      base: ['Training and meal plans, exercise library, your own videos', 'Calendar, bookings and Google Meet', 'Chat with clients and notifications', 'A profile in Ramvo search with reviews'],
      soon: 'soon'
    }
  };
  var ICON_YES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
  var ICON_NO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 12h12"/></svg>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function start(cfg) {
    var L = 'pl';
    var state = { iv: 'month', clients: 10 };
    var plans = null;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function c(key, vars) {
      var s = COMMON[L][key];
      if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
      return s;
    }
    function cur() { return L === 'en' ? 'GBP' : 'PLN'; }
    function money(minor) {
      var v = minor / 100;
      return new Intl.NumberFormat(L === 'en' ? 'en-GB' : 'pl-PL', { style: 'currency', currency: cur(), minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(v);
    }
    function priceOf(p, iv) { return (p.prices || []).filter(function (x) { return x.currency === cur() && x.interval === iv; })[0]; }
    function nameOf(p) { return L === 'en' ? p.name_en : p.name_pl; }
    function list() {
      return (plans || []).filter(function (p) { return p.audience === cfg.audience; }).sort(function (a, b) {
        return cfg.audience === 'trainer' ? (a.client_limit == null ? 1e9 : a.client_limit) - (b.client_limit == null ? 1e9 : b.client_limit) : a.sort - b.sort;
      });
    }
    function saving() {
      var best = 0;
      list().forEach(function (p) {
        var m = priceOf(p, 'month'), y = priceOf(p, 'year');
        if (m && y && m.amount_minor > 0) best = Math.max(best, Math.round((1 - y.amount_minor / (m.amount_minor * 12)) * 100));
      });
      return best;
    }
    function $(id) { return document.getElementById(id); }

    function card(p, match) {
      var price = priceOf(p, state.iv) || priceOf(p, 'month');
      var iv = price ? price.interval : state.iv;
      var mprice = priceOf(p, 'month');
      var perMonth = price ? (iv === 'year' ? Math.round(price.amount_minor / 12) : price.amount_minor) : null;
      var isMatch = match && match.slug === p.slug;
      var small = cfg.audience === 'trainer' && p.client_limit != null && p.client_limit < state.clients;
      var cls = 'plan' + (isMatch ? ' match' : p.is_featured ? ' featured' : '') + (small ? ' small' : '');
      var ribbon = isMatch ? '<span class="ribbon">' + c('ribbonMatch') + '</span>' : p.is_featured ? '<span class="ribbon">' + c('ribbonPopular') + '</span>' : '';
      var billed = '';
      if (price && iv === 'year') {
        var saved = mprice ? mprice.amount_minor * 12 - price.amount_minor : 0;
        billed = c('billedYearly', { price: money(price.amount_minor) }) + (saved > 0 ? '<span class="ok">' + c('youSave', { price: money(saved) }) + '</span>' : '');
      } else if (price) billed = c('billedMonthly');
      var chip = cfg.audience === 'trainer' ? '<span class="chip">' + (p.client_limit ? c('upTo', { n: p.client_limit }) : c('unlimited')) + '</span>' : '';
      var hl = ((p.highlights && p.highlights[L]) || []).slice(0, 5).map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('');
      var desc = L === 'en' ? p.description_en : p.description_pl;
      var href = cfg.ctaHref || '#';
      var cta = small ? c('small') : cfg.dict[L].cta;
      return '<article class="' + cls + '">' + ribbon +
        '<div class="plan-top"><h3>' + esc(nameOf(p)) + '</h3>' + chip + '</div>' +
        '<div class="price"><b>' + (perMonth != null ? money(perMonth) : '—') + '</b><span>' + c('perMonth') + '</span></div>' +
        '<div class="billed">' + billed + '</div>' +
        (desc ? '<p class="desc">' + esc(desc) + '</p>' : '') +
        '<ul class="checks">' + hl + '</ul>' +
        '<a class="pill pill-primary" href="' + href + '"' + (small ? ' aria-disabled="true" tabindex="-1" style="pointer-events:none"' : '') + '>' + cta + '</a>' +
        '</article>';
    }

    function compare(items) {
      var el = $('compare'); if (!el) return;
      if (!items.length) { el.hidden = true; return; }
      el.hidden = false;
      var head = '<tr><th></th>' + items.map(function (p) {
        var pr = priceOf(p, 'month');
        return '<th>' + esc(nameOf(p)) + '<small>' + (pr ? money(pr.amount_minor) + ' ' + c('perMonth') : '') + '</small></th>';
      }).join('') + '</tr>';
      var rows = '<tr><td>' + c('clients') + '</td>' + items.map(function (p) { return '<td class="yes">' + (p.client_limit ? p.client_limit : c('limitless')) + '</td>'; }).join('') + '</tr>';
      COMMON[L].base.forEach(function (b) { rows += '<tr><td>' + b + '</td>' + items.map(function () { return '<td class="yes">' + ICON_YES + '</td>'; }).join('') + '</tr>'; });
      ['ai', 'budget', 'branding', 'priority_support'].forEach(function (k) {
        rows += '<tr><td>' + COMMON[L].feat[k] + '</td>' + items.map(function (p) {
          var on = p.plan_features && p.plan_features[k];
          return '<td class="' + (on ? 'yes' : 'no') + '">' + (on ? ICON_YES : ICON_NO) + '</td>';
        }).join('') + '</tr>';
      });
      el.innerHTML = '<table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>';
    }

    function render() {
      document.querySelectorAll('#iv button').forEach(function (b) {
        var on = b.getAttribute('data-v') === state.iv;
        b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
      });
      if (plans === null) return;
      var items = list();
      var sv = saving();
      var badge = $('save-badge');
      if (badge) { badge.hidden = !sv; badge.textContent = c('save', { n: sv }); }

      var cheapest = null;
      items.forEach(function (p) { var m = priceOf(p, 'month'); if (m && (cheapest == null || m.amount_minor < cheapest)) cheapest = m.amount_minor; });
      document.querySelectorAll('[data-price="cheapest"]').forEach(function (el) { el.textContent = cheapest != null ? c('from', { price: money(cheapest) }) + ' ' + c('perMonth') : c('soon'); });
      var one = items[0];
      document.querySelectorAll('[data-price="month"],[data-price="year"]').forEach(function (el) {
        var pr = one && priceOf(one, el.getAttribute('data-price'));
        el.textContent = pr ? money(pr.amount_minor) : '—';
      });

      var grid = $('plan-grid'); if (!grid) return;
      if (!items.length) {
        grid.className = 'plans one';
        grid.innerHTML = '<div class="soon"><h3>' + c('soonTitle') + '</h3><p>' + cfg.dict[L].soonText + '</p><a class="pill pill-primary" href="' + cfg.ctaHref + '">' + cfg.dict[L].cta + '</a></div>';
        if ($('fit')) $('fit').hidden = true;
        compare([]);
        return;
      }
      var match = null;
      if (cfg.audience === 'trainer' && $('fit')) {
        $('fit').hidden = false;
        for (var i = 0; i < items.length; i++) { if (items[i].client_limit == null || items[i].client_limit >= state.clients) { match = items[i]; break; } }
        $('fit-out').textContent = state.clients >= 60 ? '60+' : state.clients;
        $('fit-hint').innerHTML = match ? c('fitHint', { plan: esc(nameOf(match)) }) : c('fitNone');
      }
      grid.className = 'plans' + (items.length === 1 ? ' one' : '');
      grid.innerHTML = items.map(function (p) { return card(p, match); }).join('');
      compare(items);
    }

    function applyLanguage(lang) {
      L = cfg.dict[lang] ? lang : 'pl';
      document.documentElement.lang = L;
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        var v = cfg.dict[L][el.getAttribute('data-i18n')];
        if (v !== undefined) el.innerHTML = v;
      });
      document.querySelectorAll('.lang-switch button').forEach(function (b) {
        var on = b.getAttribute('data-lang') === L;
        b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
      });
      if (cfg.dict[L]['meta.title']) document.title = cfg.dict[L]['meta.title'];
      try { localStorage.setItem('ramvo-lang', L); } catch (e) {}
      render();
    }
    function detect() {
      try { var q = new URLSearchParams(location.search).get('lang'); if (q === 'pl' || q === 'en') return q; } catch (e) {}
      try { var s = localStorage.getItem('ramvo-lang'); if (s === 'pl' || s === 'en') return s; } catch (e) {}
      return (navigator.language || '').toLowerCase().indexOf('pl') === 0 ? 'pl' : 'en';
    }

    var iv = $('iv');
    if (iv) iv.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; state.iv = b.getAttribute('data-v'); render(); });
    var fr = $('fit-range');
    if (fr) fr.addEventListener('input', function (e) { state.clients = Number(e.target.value); render(); });
    document.querySelectorAll('.lang-switch button').forEach(function (b) { b.addEventListener('click', function () { applyLanguage(b.getAttribute('data-lang')); }); });
    applyLanguage(detect());

    fetch(SUPABASE_URL + '/rest/v1/rpc/public_app_plans', {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: '{}'
    }).then(function (r) { return r.ok ? r.json() : []; })
      .then(function (d) { plans = Array.isArray(d) ? d : []; render(); })
      .catch(function () { plans = []; render(); });

    var nav = $('nav');
    if (nav) window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 8); }, { passive: true });
    var targets = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
      targets.forEach(function (el) { io.observe(el); });
    } else targets.forEach(function (el) { el.classList.add('is-in'); });
    var faq = $('faq-list');
    if (faq) faq.addEventListener('toggle', function (e) {
      if (e.target.tagName !== 'DETAILS' || !e.target.open) return;
      document.querySelectorAll('#faq-list details[open]').forEach(function (d) { if (d !== e.target) d.open = false; });
    }, true);
  }

  window.RamvoPricing = { start: start };
})();
