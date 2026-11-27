/* Ramvo 404 scene: Gym map. A top-down gym plan whose zones are the site's
   sections. Click (or use the arrow keys / WASD) to walk there along an A*
   path; a lost "404" page is hidden somewhere: find it to solve. */
(function () {
  'use strict';
  var COLS = 16, ROWS = 9, C = 50;
  var CSS = '' +
    '.gm-stage{outline:none}.gm-stage svg{display:block;width:100%;height:auto;cursor:pointer}' +
    '.gm-stage:focus-visible{box-shadow:0 0 0 2px #3ec6ff}' +
    '.gm-zl{font:800 13px Manrope,sans-serif;fill:#F4F6F8}.gm-zs{font:700 10px Manrope,sans-serif;fill:#8E97A3;letter-spacing:.08em;text-transform:uppercase}' +
    '.gm-card{position:absolute;left:50%;bottom:14px;transform:translate(-50%,16px);opacity:0;transition:opacity .25s,transform .25s;display:flex;gap:10px;align-items:center;background:rgba(21,24,28,.94);border:1px solid #2a323b;border-radius:16px;padding:8px 8px 8px 14px;pointer-events:none;white-space:nowrap;max-width:calc(100% - 28px)}' +
    '.gm-card.show{opacity:1;transform:translate(-50%,0);pointer-events:auto}.gm-card b{font-weight:800}' +
    '.gm-card .btn{padding:9px 14px;font-size:.85rem}' +
    '.gm-hud{display:inline-flex;margin:0 0 10px}' +
    '@keyframes gmPulse{0%{r:6;opacity:.8}100%{r:40;opacity:0}}.gm-pulse{animation:gmPulse 1.4s ease-out infinite}';
  var ZONES = [
    { id: 'trainers', x: 0, y: 0, w: 5, h: 3, href: '/trainers/', pl: 'Strefa trenerów', en: 'Trainer zone', spl: 'dla trenerów', sen: 'for trainers', c: '#FF4D8D', icon: 'M-7 -3h14v9h-14z M-3 -3v-3h6v3' },
    { id: 'cardio', x: 11, y: 0, w: 5, h: 3, href: '/pricing/premium/', pl: 'Strefa Ramvo AI', en: 'Ramvo AI zone', spl: 'premium', sen: 'premium', c: '#FFC83D', icon: 'M0 -8l2.5 5.5 6 .8-4.4 4 1.1 6-5.2-3-5.2 3 1.1-6-4.4-4 6-.8z' },
    { id: 'demo', x: 13, y: 4, w: 3, h: 2, href: '/demo/', pl: 'Sala demo', en: 'Demo room', spl: 'panel na żywo', sen: 'live panel', c: '#A78BFA', icon: 'M-8 -6h16v10h-16z M-3 7h6' },
    { id: 'reception', x: 0, y: 6, w: 4, h: 3, href: '/', pl: 'Recepcja', en: 'Reception', spl: 'strona główna', sen: 'home', c: '#3EC6FF', icon: 'M-8 2l8-7 8 7v6h-16z' },
    { id: 'pricing', x: 6, y: 7, w: 3, h: 2, href: '/pricing/', pl: 'Kasa', en: 'Front desk', spl: 'cennik', sen: 'pricing', c: '#35D483', icon: 'M-7 -5h14v10h-14z M-7 -1h14' },
    { id: 'legal', x: 12, y: 7, w: 4, h: 2, href: '/legal/', pl: 'Szatnia', en: 'Locker room', spl: 'regulamin', sen: 'legal', c: '#8E97A3', icon: 'M-6 -7h12v14h-12z M2 0h2' },
  ];
  // furniture: blocked cells [x, y, kind]
  var BLOCK = [[6, 3, 'rack'], [7, 3, 'rack'], [8, 3, 'rack'], [9, 3, 'rack'], [3, 4, 'bench'], [11, 5, 'bench'], [6, 5, 'plate'], [9, 5, 'plate'], [12, 2, 'tread'], [13, 2, 'tread'], [14, 2, 'tread'], [0, 1, 'mat'], [4, 1, 'mat']];
  var S = null;

  function mount(el, api) {
    if (!document.getElementById('gm-css')) { var st = document.createElement('style'); st.id = 'gm-css'; st.textContent = CSS; document.head.appendChild(st); }
    el.innerHTML =
      '<div class="scene-head"><b><span data-l="pl">Znajdź zgubioną stronę</span><span data-l="en">Find the lost page</span></b>' +
      '<span><span data-l="pl">Klikaj, żeby chodzić (albo strzałki / WASD). Strefy prowadzą do stron Ramvo.</span><span data-l="en">Click to walk (or arrows / WASD). Zones lead to Ramvo pages.</span></span></div>' +
      '<span class="chip gm-hud" id="gmHud" aria-live="polite"></span>' +
      '<div class="stage gm-stage" id="gmStage" tabindex="0" aria-label="Gym map"><svg id="gmSvg" viewBox="0 0 ' + COLS * C + ' ' + ROWS * C + '"></svg>' +
      '<div class="gm-card" id="gmCard"><span id="gmCardTxt"></span><button type="button" class="btn" id="gmGo"></button></div></div>';
    var my = { raf: 0, off: [] }; S = my;
    var svg = document.getElementById('gmSvg'), stage = document.getElementById('gmStage');
    var NS = 'http://www.w3.org/2000/svg';
    function mk(tag, attrs, parent) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); (parent || svg).appendChild(n); return n; }
    function on(t, type, fn, opt) { t.addEventListener(type, fn, opt); my.off.push(function () { t.removeEventListener(type, fn, opt); }); }

    var blocked = {}; BLOCK.forEach(function (b) { blocked[b[0] + ',' + b[1]] = b[2]; });
    function zoneAt(x, y) { for (var i = 0; i < ZONES.length; i++) { var z = ZONES[i]; if (x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) return z; } return null; }
    function free(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS && !blocked[x + ',' + y]; }

    // ---- static plan
    var defs = mk('defs', {});
    defs.innerHTML = '<pattern id="gmFloor" width="' + C + '" height="' + C + '" patternUnits="userSpaceOnUse"><rect width="' + C + '" height="' + C + '" fill="#0f1215"/><path d="M' + C + ' 0H0V' + C + '" fill="none" stroke="#1a1f25" stroke-width="1"/></pattern>' +
      '<radialGradient id="gmAv"><stop offset="0" stop-color="#7fdcff"/><stop offset="1" stop-color="#1f9ccc"/></radialGradient>';
    mk('rect', { x: 0, y: 0, width: COLS * C, height: ROWS * C, fill: 'url(#gmFloor)' });
    mk('rect', { x: 2, y: 2, width: COLS * C - 4, height: ROWS * C - 4, fill: 'none', stroke: '#2a323b', 'stroke-width': 4, rx: 16 });
    var zoneG = mk('g', {});
    ZONES.forEach(function (z) {
      var g = mk('g', { 'data-zone': z.id }, zoneG);
      mk('rect', { x: z.x * C + 4, y: z.y * C + 4, width: z.w * C - 8, height: z.h * C - 8, rx: 14, fill: z.c, 'fill-opacity': 0.08, stroke: z.c, 'stroke-opacity': 0.45, 'stroke-width': 2, 'stroke-dasharray': '7 6' }, g);
      var cx = (z.x + z.w / 2) * C, cy = (z.y + z.h / 2) * C;
      var ic = mk('g', { transform: 'translate(' + cx + ' ' + (cy - 16) + ')' }, g);
      mk('circle', { r: 15, fill: z.c, 'fill-opacity': 0.16 }, ic);
      mk('path', { d: z.icon, fill: 'none', stroke: z.c, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ic);
      z.lbl = mk('text', { x: cx, y: cy + 14, 'text-anchor': 'middle', class: 'gm-zl' }, g);
      z.sub = mk('text', { x: cx, y: cy + 28, 'text-anchor': 'middle', class: 'gm-zs' }, g);
    });
    BLOCK.forEach(function (b) {
      var x = b[0] * C, y = b[1] * C, k = b[2];
      if (k === 'rack') { mk('rect', { x: x + 6, y: y + 14, width: C - 12, height: 22, rx: 6, fill: '#1c232a', stroke: '#2f3943' }); for (var i = 0; i < 3; i++) mk('circle', { cx: x + 14 + i * 11, cy: y + 25, r: 4.5, fill: '#3ec6ff', 'fill-opacity': 0.7 }); }
      else if (k === 'bench') mk('rect', { x: x + 8, y: y + 18, width: C - 16, height: 14, rx: 7, fill: '#2a323b' });
      else if (k === 'plate') { mk('circle', { cx: x + C / 2, cy: y + C / 2, r: 16, fill: '#1c232a', stroke: '#ff4d8d', 'stroke-opacity': 0.6, 'stroke-width': 3 }); mk('circle', { cx: x + C / 2, cy: y + C / 2, r: 4, fill: '#0b0d10' }); }
      else if (k === 'tread') { mk('rect', { x: x + 10, y: y + 6, width: C - 20, height: C - 12, rx: 6, fill: '#1c232a', stroke: '#2f3943' }); mk('rect', { x: x + 15, y: y + 12, width: C - 30, height: C - 24, rx: 3, fill: '#11161b' }); }
      else mk('rect', { x: x + 6, y: y + 8, width: C - 12, height: C - 16, rx: 5, fill: '#1b2430' });
    });
    svg.appendChild(zoneG); // zone icons and labels stay above the furniture
    var stepsG = mk('g', {}), lostG = mk('g', { opacity: 0 }), pathG = mk('g', {});
    // the lost page: a random free cell outside zones, far from the start
    var start = { x: 2, y: 7 }, lost;
    do { lost = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
    while (!free(lost.x, lost.y) || zoneAt(lost.x, lost.y) || Math.abs(lost.x - start.x) + Math.abs(lost.y - start.y) < 7);
    var lx = lost.x * C + C / 2, ly = lost.y * C + C / 2;
    mk('circle', { cx: lx, cy: ly, r: 6, fill: 'none', stroke: '#ffc83d', 'stroke-width': 2, class: 'gm-pulse' }, lostG);
    mk('path', { d: 'M' + (lx - 11) + ' ' + (ly - 13) + 'h15l7 7v19h-22z', fill: '#f4f6f8', transform: 'rotate(-12 ' + lx + ' ' + ly + ')' }, lostG);
    mk('text', { x: lx - 0.5, y: ly + 5, 'text-anchor': 'middle', style: 'font:900 9px Archivo,sans-serif', fill: '#0b0d10', transform: 'rotate(-12 ' + lx + ' ' + ly + ')' }, lostG).textContent = '404';
    // avatar
    var av = mk('g', {});
    var cone = mk('path', { d: 'M0 0 L34 -14 A36 36 0 0 1 34 14 Z', fill: '#3ec6ff', 'fill-opacity': 0.14 }, av);
    mk('circle', { r: 14, fill: 'url(#gmAv)', stroke: '#0b0d10', 'stroke-width': 3 }, av);
    mk('circle', { cx: 5, cy: -4, r: 3, fill: '#0b0d10' }, av);

    var pos = { x: start.x, y: start.y }, draw = { x: start.x * C + C / 2, y: start.y * C + C / 2 }, dir = 0, route = [], found = false, lastZone = null, revealed = false;

    function labels() {
      ZONES.forEach(function (z) { z.lbl.textContent = api.t(z.pl, z.en); z.sub.textContent = api.t(z.spl, z.sen); });
      document.getElementById('gmHud').textContent = found ? api.t('★ Znalezione!', '★ Found!') : (revealed ? api.t('Coś leży obok…', 'Something is nearby…') : api.t('Szukaj kartki z napisem 404', 'Look for a sheet saying 404'));
      if (lastZone) showCard(lastZone);
    }
    function showCard(z) {
      lastZone = z;
      document.getElementById('gmCardTxt').innerHTML = '<b>' + api.t(z.pl, z.en) + '</b> · ' + api.t(z.spl, z.sen);
      var go = document.getElementById('gmGo'); go.textContent = api.t('Wejdź →', 'Enter →'); go.onclick = function () { api.go(z.href); };
      document.getElementById('gmCard').classList.add('show');
    }
    function hideCard() { lastZone = null; document.getElementById('gmCard').classList.remove('show'); }

    // A* on the grid (4-way)
    function astar(a, b) {
      if (!free(b.x, b.y)) return null;
      var key = function (p) { return p.x + ',' + p.y; }, open = [a], came = {}, gs = {}, fs = {};
      gs[key(a)] = 0; fs[key(a)] = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      while (open.length) {
        open.sort(function (p, q) { return fs[key(p)] - fs[key(q)]; });
        var cur = open.shift(), ck = key(cur);
        if (cur.x === b.x && cur.y === b.y) { var out = [cur]; while (came[ck]) { cur = came[ck]; ck = key(cur); out.unshift(cur); } return out.slice(1); }
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var n = { x: cur.x + d[0], y: cur.y + d[1] }, nk = key(n);
          if (!free(n.x, n.y)) return;
          var t = gs[ck] + 1;
          if (gs[nk] == null || t < gs[nk]) { came[nk] = cur; gs[nk] = t; fs[nk] = t + Math.abs(n.x - b.x) + Math.abs(n.y - b.y); if (!open.some(function (o) { return o.x === n.x && o.y === n.y; })) open.push(n); }
        });
      }
      return null;
    }
    function nearestFree(x, y) {
      if (free(x, y)) return { x: x, y: y };
      for (var r = 1; r < 4; r++) for (var dx = -r; dx <= r; dx++) for (var dy = -r; dy <= r; dy++) if (free(x + dx, y + dy)) return { x: x + dx, y: y + dy };
      return null;
    }
    function walkTo(cell) {
      var t = nearestFree(cell.x, cell.y); if (!t) return;
      var p = astar({ x: pos.x, y: pos.y }, t); if (!p || !p.length) { arrive(); return; }
      route = p; hideCard(); api.busy(true); api.beep(500, 0.05);
      pathG.innerHTML = '';
      var d = 'M' + (pos.x * C + C / 2) + ' ' + (pos.y * C + C / 2) + p.map(function (q) { return 'L' + (q.x * C + C / 2) + ' ' + (q.y * C + C / 2); }).join('');
      mk('path', { d: d, fill: 'none', stroke: '#3ec6ff', 'stroke-opacity': 0.35, 'stroke-width': 3, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round' }, pathG);
      if (api.reduce) { var lastC = p[p.length - 1]; pos = { x: lastC.x, y: lastC.y }; draw = { x: pos.x * C + C / 2, y: pos.y * C + C / 2 }; route = []; arrive(); }
    }
    function arrive() {
      api.busy(false); pathG.innerHTML = '';
      var z = zoneAt(pos.x, pos.y);
      if (z) { showCard(z); api.vibrate(15); } else hideCard();
    }
    function stepCheck() {
      var dist = Math.abs(pos.x - lost.x) + Math.abs(pos.y - lost.y);
      if (!revealed && dist <= 2) { revealed = true; lostG.setAttribute('opacity', 1); api.beep(880, 0.1); labels(); }
      if (!found && dist === 0) { found = true; lostG.setAttribute('opacity', 0); api.solved('Brawo! <em>Strona znaleziona</em>', 'Nice! <em>Page found</em>'); labels(); }
      // footstep
      var fs = mk('circle', { cx: draw.x + (Math.random() - 0.5) * 8, cy: draw.y + (Math.random() - 0.5) * 8, r: 3, fill: '#3ec6ff', 'fill-opacity': 0.35 }, stepsG);
      setTimeout(function () { if (fs.parentNode) fs.parentNode.removeChild(fs); }, 1400);
    }

    on(svg, 'pointerdown', function (e) {
      stage.focus({ preventScroll: true });
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse());
      walkTo({ x: Math.max(0, Math.min(COLS - 1, Math.floor(p.x / C))), y: Math.max(0, Math.min(ROWS - 1, Math.floor(p.y / C))) });
    });
    on(stage, 'keydown', function (e) {
      var d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] }[e.key];
      if (!d) { if (e.key === 'Enter' && lastZone) api.go(lastZone.href); return; }
      e.preventDefault();
      if (route.length) return;
      var n = { x: pos.x + d[0], y: pos.y + d[1] };
      if (free(n.x, n.y)) { route = [n]; hideCard(); }
    });

    var SPEED = 6.5, last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (route.length && !document.hidden) {
        var tgt = route[0], tx = tgt.x * C + C / 2, ty = tgt.y * C + C / 2, dx = tx - draw.x, dy = ty - draw.y, dd = Math.hypot(dx, dy), stepLen = SPEED * C * dt;
        if (dd > 0.01) dir = Math.atan2(dy, dx);
        if (dd <= stepLen) { draw.x = tx; draw.y = ty; pos = { x: tgt.x, y: tgt.y }; route.shift(); stepCheck(); if (!route.length) arrive(); }
        else { draw.x += dx / dd * stepLen; draw.y += dy / dd * stepLen; }
      }
      var bob = route.length ? Math.sin(now / 70) * 1.5 : 0;
      av.setAttribute('transform', 'translate(' + draw.x.toFixed(1) + ' ' + (draw.y + bob).toFixed(1) + ')');
      cone.setAttribute('transform', 'rotate(' + (dir * 180 / Math.PI).toFixed(1) + ')');
      my.raf = requestAnimationFrame(frame);
    }
    labels();
    my.raf = requestAnimationFrame(frame);
    my.labels = labels;
  }

  function unmount() { if (!S) return; cancelAnimationFrame(S.raf); S.off.forEach(function (f) { f(); }); S = null; }

  window.Ramvo404.register('gym', { mount: mount, unmount: unmount, setLang: function () { if (S && S.labels) S.labels(); } });
})();
