/* Ramvo 404 scene: Calorie run. An original side-scroller through a gym:
   jump over dumbbells and hurdles, collect food until you have 404 kcal.
   Tap / Space / Up to jump (hold = higher, second jump in the air). */
(function () {
  'use strict';
  var CSS = '' +
    '.rn-stage{touch-action:none;cursor:pointer}.rn-stage canvas{display:block;width:100%}' +
    '.rn-hud{position:absolute;left:14px;right:14px;top:12px;display:flex;justify-content:space-between;gap:8px;pointer-events:none;flex-wrap:wrap}' +
    '.rn-kcal{min-width:150px}.rn-kcal .rn-track{width:90px;height:6px;border-radius:99px;background:#1F242B;overflow:hidden;display:inline-block;vertical-align:middle;margin-left:6px}' +
    '.rn-kcal .rn-track i{display:block;height:100%;width:0;background:linear-gradient(90deg,#35d483,#ffc83d);transition:width .2s}' +
    '.rn-msg{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;pointer-events:none;padding:20px}' +
    '.rn-msg b{font:900 clamp(1.3rem,3.4vw,1.9rem) Archivo,sans-serif;text-shadow:0 4px 20px #000}.rn-msg span{color:#c9ced5;font-weight:700;text-shadow:0 2px 12px #000}' +
    '.rn-msg .btn{pointer-events:auto}';
  var FOOD = [
    { id: 'apple', kcal: 52, pl: 'jabłko', en: 'apple' },
    { id: 'banana', kcal: 89, pl: 'banan', en: 'banana' },
    { id: 'avocado', kcal: 160, pl: 'awokado', en: 'avocado' },
    { id: 'chicken', kcal: 165, pl: 'kurczak', en: 'chicken' },
    { id: 'oats', kcal: 68, pl: 'owsianka', en: 'oats' },
  ];
  var GOAL = 404;
  var S = null;

  function mount(el, api) {
    if (!document.getElementById('rn-css')) { var st = document.createElement('style'); st.id = 'rn-css'; st.textContent = CSS; document.head.appendChild(st); }
    el.innerHTML =
      '<div class="scene-head"><b><span data-l="pl">Bieg po 404 kcal</span><span data-l="en">Run for 404 kcal</span></b>' +
      '<span><span data-l="pl">Skacz nad hantlami, zbieraj jedzenie. Tap, spacja albo ↑. Przytrzymaj = wyżej.</span><span data-l="en">Jump the dumbbells, grab the food. Tap, Space or ↑. Hold = higher.</span></span></div>' +
      '<div class="stage rn-stage" id="rnStage"><canvas id="rnCanvas"></canvas>' +
      '<div class="rn-hud"><span class="chip rn-kcal"><b id="rnKcal">0</b> / 404 kcal<span class="rn-track"><i id="rnBar"></i></span></span>' +
      '<span class="chip"><span data-l="pl">Dystans</span><span data-l="en">Distance</span> <b id="rnDist">0</b> m · <span data-l="pl">rekord</span><span data-l="en">best</span> <b id="rnBest">0</b></span></div>' +
      '<div class="rn-msg" id="rnMsg"></div></div>';
    var my = { raf: 0, off: [], paused: false };
    S = my;
    var stage = document.getElementById('rnStage'), cv = document.getElementById('rnCanvas'), ctx = cv.getContext('2d');
    var DPR = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0, GY = 0;
    var best = parseInt(api.store.get('ramvo404-run-best') || '0', 10) || 0;
    document.getElementById('rnBest').textContent = best;
    var g = null, solvedOnce = false;

    function on(t, type, fn, opt) { t.addEventListener(type, fn, opt); my.off.push(function () { t.removeEventListener(type, fn, opt); }); }
    function size() { W = stage.clientWidth; H = W < 560 ? 270 : 320; GY = H - 46; cv.width = W * DPR; cv.height = H * DPR; cv.style.height = H + 'px'; }
    size();
    on(window, 'resize', size);

    function reset() {
      g = { state: 'ready', t: 0, speed: 340, dist: 0, kcal: 0, y: 0, vy: 0, jumps: 0, holding: false, holdT: 0, obs: [], food: [], pops: [], nextObs: 1.4, nextFood: 0.8, shake: 0, scroll: 0 };
      paintHud(); message('ready');
    }
    function message(kind) {
      var m = document.getElementById('rnMsg');
      if (kind === 'none') { m.innerHTML = ''; return; }
      if (kind === 'ready') m.innerHTML = '<b>' + api.t('Tapnij, żeby biec', 'Tap to run') + '</b><span>' + api.t('Cel: 404 kcal', 'Goal: 404 kcal') + '</span>';
      if (kind === 'dead') m.innerHTML = '<b>' + api.t('Auć! Hantla wygrała', 'Ouch! The dumbbell won') + '</b><span>' + api.t('Tapnij, żeby spróbować jeszcze raz', 'Tap to try again') + '</span>';
    }
    function paintHud() {
      document.getElementById('rnKcal').textContent = Math.round(g.kcal);
      document.getElementById('rnBar').style.width = Math.min(100, g.kcal / GOAL * 100) + '%';
      document.getElementById('rnDist').textContent = Math.round(g.dist / 40);
    }
    function press() {
      if (g.state === 'ready') { g.state = 'run'; message('none'); }
      else if (g.state === 'dead') { if (g.t > 0.5) { reset(); g.state = 'run'; message('none'); } return; }
      if (!g.holding) api.busy(true);
      g.holding = true;
      if (g.y >= 0 && g.vy === 0 && g.jumps === 0) { g.vy = -760; g.jumps = 1; g.holdT = 0; api.beep(420, 0.08); }
      else if (g.jumps === 1) { g.vy = -680; g.jumps = 2; g.holdT = 0; api.beep(560, 0.08); }
    }
    function release() { if (g.holding) api.busy(false); g.holding = false; }
    on(stage, 'pointerdown', function (e) { e.preventDefault(); press(); });
    on(stage, 'pointerup', release); on(stage, 'pointercancel', release);
    on(window, 'keydown', function (e) {
      if ((e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && !e.repeat) {
        var r = stage.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
        e.preventDefault(); press();
      }
    });
    on(window, 'keyup', function (e) { if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') release(); });
    on(window, 'blur', release);
    // pause when the scene scrolls out of view
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) { my.paused = !en[0].isIntersecting; }, { threshold: 0.2 }) : null;
    if (io) { io.observe(stage); my.off.push(function () { io.disconnect(); }); }

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function spawn(dt) {
      g.nextObs -= dt; g.nextFood -= dt;
      if (g.nextObs <= 0) {
        var kind = Math.random() < 0.65 ? 'db' : 'hurdle';
        g.obs.push(kind === 'db' ? { k: 'db', x: W + 40, w: 54, h: 26 } : { k: 'hurdle', x: W + 40, w: 22, h: 50 });
        g.nextObs = rnd(0.95, 1.75) * (340 / g.speed) + 0.25;
      }
      if (g.nextFood <= 0) {
        var f = FOOD[Math.floor(Math.random() * FOOD.length)];
        var near = g.obs.some(function (o) { return o.x > W - 60; });
        g.food.push({ f: f, x: W + 30 + (near ? 90 : 0), y: rnd(46, 160), r: 15, bob: Math.random() * 6 });
        g.nextFood = rnd(0.55, 1.2);
      }
    }
    function hit(ax, ay, aw, ah, bx, by, bw, bh) { return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by; }

    function update(dt) {
      g.t += dt;
      if (g.state !== 'run') { g.shake = Math.max(0, g.shake - dt * 3); return; }
      g.speed = Math.min(720, g.speed + 9 * dt);
      var dx = g.speed * dt; g.dist += dx; g.scroll += dx;
      // jump physics: holding while rising = lighter gravity for up to 0.22 s
      var grav = 2300;
      if (g.holding && g.vy < 0 && g.holdT < 0.22) { grav = 1050; g.holdT += dt; }
      if (g.jumps > 0 || g.y < 0) { g.vy += grav * dt; g.y += g.vy * dt; }
      if (g.y >= 0) { g.y = 0; g.vy = 0; g.jumps = 0; }
      spawn(dt);
      var px = W * 0.18, pw = 30, ph = 54, py = GY - ph + g.y;
      g.obs.forEach(function (o) { o.x -= dx; });
      g.obs = g.obs.filter(function (o) { return o.x > -80; });
      for (var i = 0; i < g.obs.length; i++) {
        var o = g.obs[i], oy = GY - o.h;
        if (hit(px + 6, py + 6, pw - 12, ph - 8, o.x + 4, oy + 4, o.w - 8, o.h - 4)) { die(); return; }
      }
      g.food.forEach(function (f) { f.x -= dx; });
      g.food = g.food.filter(function (f) {
        if (f.x < -40) return false;
        var fy = GY - f.y;
        if (hit(px, py, pw, ph, f.x - f.r, fy - f.r, f.r * 2, f.r * 2)) {
          g.kcal += f.f.kcal; g.pops.push({ x: f.x, y: fy, t: 0, txt: '+' + f.f.kcal });
          api.beep(660 + Math.min(400, g.kcal), 0.07); api.vibrate(12);
          if (!solvedOnce && g.kcal >= GOAL) { solvedOnce = true; api.solved('Brawo! <em>Masz kondycję</em>', 'Nice! <em>You have the stamina</em>'); }
          paintHud(); return false;
        }
        return true;
      });
      g.pops.forEach(function (p) { p.t += dt; }); g.pops = g.pops.filter(function (p) { return p.t < 0.8; });
      paintHud();
    }
    function die() {
      g.state = 'dead'; g.t = 0; g.shake = 1; api.vibrate([30, 40, 30]); api.beep(140, 0.25, 'sawtooth');
      var m = Math.round(g.dist / 40);
      if (m > best) { best = m; api.store.set('ramvo404-run-best', String(best)); document.getElementById('rnBest').textContent = best; }
      message('dead');
    }

    // ---------------------------------------------------------------- drawing
    function drawBg() {
      var grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#101820'); grd.addColorStop(1, '#0b0d10');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      // far: windows with lights
      var off = (g.scroll * 0.15) % 160;
      for (var x = -off; x < W + 160; x += 160) {
        ctx.fillStyle = '#132430'; ctx.fillRect(x + 20, 26, 110, 70);
        ctx.fillStyle = 'rgba(62,198,255,.08)'; ctx.fillRect(x + 26, 32, 46, 58); ctx.fillRect(x + 78, 32, 46, 58);
        ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x + 20, 100, 110, 4);
      }
      // mid: wall bars and mirror strip
      var off2 = (g.scroll * 0.4) % 220;
      ctx.fillStyle = 'rgba(167,139,250,.05)'; ctx.fillRect(0, GY - 120, W, 70);
      for (var x2 = -off2; x2 < W + 220; x2 += 220) {
        ctx.strokeStyle = '#2a323b'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x2 + 30, GY - 130); ctx.lineTo(x2 + 30, GY); ctx.moveTo(x2 + 80, GY - 130); ctx.lineTo(x2 + 80, GY); ctx.stroke();
        ctx.lineWidth = 2; for (var r = 0; r < 6; r++) { ctx.beginPath(); ctx.moveTo(x2 + 30, GY - 120 + r * 20); ctx.lineTo(x2 + 80, GY - 120 + r * 20); ctx.stroke(); }
        ctx.fillStyle = 'rgba(62,198,255,.06)'; ctx.fillRect(x2 + 120, GY - 110, 70, 90);
      }
      // track
      ctx.fillStyle = '#15181c'; ctx.fillRect(0, GY, W, H - GY);
      ctx.fillStyle = '#ff4d8d'; ctx.globalAlpha = 0.25; ctx.fillRect(0, GY, W, 3); ctx.globalAlpha = 1;
      var off3 = g.scroll % 60; ctx.fillStyle = '#242a31';
      for (var x3 = -off3; x3 < W; x3 += 60) ctx.fillRect(x3, GY + 22, 30, 3);
    }
    function drawRunner() {
      var px = W * 0.18, ph = 54, base = GY + g.y, phase = g.state === 'run' ? g.dist * 0.045 : 0, air = g.y < 0;
      ctx.save(); ctx.translate(px + 15, base);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(0, -g.y + 2, 18 + g.y * 0.05, 4, 0, 0, 6.283); ctx.fill();
      ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#c9d3dc';
      var l1 = air ? 0.7 : Math.sin(phase) * 0.9, l2 = air ? -0.4 : -Math.sin(phase) * 0.9;
      // legs
      [l1, l2].forEach(function (a) { ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(Math.sin(a) * 14, -12 + Math.abs(Math.cos(a)) * 0); ctx.lineTo(Math.sin(a) * 14 + Math.sin(a + 0.6) * 10, 0); ctx.stroke(); });
      // torso
      ctx.fillStyle = '#3ec6ff'; ctx.beginPath(); ctx.ellipse(0, -36, 11, 16, 0.12, 0, 6.283); ctx.fill();
      // arms
      ctx.strokeStyle = '#c9d3dc'; ctx.lineWidth = 5;
      [-l1, -l2].forEach(function (a) { ctx.beginPath(); ctx.moveTo(2, -44); ctx.lineTo(2 + Math.sin(a) * 12, -32); ctx.stroke(); });
      // head and headband
      ctx.fillStyle = '#f1d3b8'; ctx.beginPath(); ctx.arc(4, -ph - 2, 9, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ff4d8d'; ctx.fillRect(-5, -ph - 6, 18, 4);
      ctx.fillStyle = '#ff4d8d'; ctx.beginPath(); ctx.moveTo(-5, -ph - 5); ctx.lineTo(-14 - Math.sin(phase * 2) * 3, -ph - 9); ctx.lineTo(-13, -ph - 2); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    function drawObs(o) {
      var y = GY - o.h;
      if (o.k === 'db') {
        ctx.fillStyle = '#9aa4ae'; ctx.fillRect(o.x + 10, y + 10, o.w - 20, 6);
        ctx.fillStyle = '#3ec6ff'; roundRect(o.x, y, 14, o.h, 4); ctx.fill(); roundRect(o.x + o.w - 14, y, 14, o.h, 4); ctx.fill();
        ctx.fillStyle = '#1f9ccc'; roundRect(o.x + 3, y + 3, 8, o.h - 6, 3); ctx.fill(); roundRect(o.x + o.w - 11, y + 3, 8, o.h - 6, 3); ctx.fill();
      } else {
        ctx.fillStyle = '#ffc83d'; ctx.fillRect(o.x, y, o.w, 7);
        ctx.fillStyle = '#8e97a3'; ctx.fillRect(o.x + 2, y + 7, 4, o.h - 7); ctx.fillRect(o.x + o.w - 6, y + 7, 4, o.h - 7);
        ctx.fillStyle = '#0B0D10'; ctx.fillRect(o.x + 6, y, 4, 7); ctx.fillRect(o.x + 14, y, 4, 7);
      }
    }
    function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function drawFood(f, now) {
      var x = f.x, y = GY - f.y + Math.sin(now / 300 + f.bob) * 3, r = f.r;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.arc(0, 0, r + 7, 0, 6.283); ctx.fill();
      var id = f.f.id;
      if (id === 'apple') { ctx.fillStyle = '#ff5c5c'; ctx.beginPath(); ctx.arc(-4, 2, r * 0.7, 0, 6.283); ctx.arc(4, 2, r * 0.7, 0, 6.283); ctx.fill(); ctx.fillStyle = '#35d483'; ctx.beginPath(); ctx.ellipse(4, -r * 0.75, 5, 2.5, -0.6, 0, 6.283); ctx.fill(); }
      else if (id === 'banana') { ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, -6, r * 0.9, 0.35, Math.PI - 0.35); ctx.stroke(); }
      else if (id === 'avocado') { ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.ellipse(0, 1, r * 0.72, r * 0.95, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#c5e1a5'; ctx.beginPath(); ctx.ellipse(0, 2, r * 0.55, r * 0.75, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#8d5524'; ctx.beginPath(); ctx.arc(0, 4, r * 0.32, 0, 6.283); ctx.fill(); }
      else if (id === 'chicken') { ctx.fillStyle = '#d98a3d'; ctx.beginPath(); ctx.ellipse(-2, -2, r * 0.75, r * 0.6, -0.6, 0, 6.283); ctx.fill(); ctx.fillStyle = '#f4f6f8'; ctx.fillRect(4, 4, 9, 4); ctx.beginPath(); ctx.arc(14, 4, 3, 0, 6.283); ctx.arc(14, 8, 3, 0, 6.283); ctx.fill(); }
      else { ctx.fillStyle = '#e8d7b0'; ctx.beginPath(); ctx.arc(0, -1, r * 0.75, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#3ec6ff'; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.lineTo(r * 0.6, r * 0.8); ctx.lineTo(-r * 0.6, r * 0.8); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = 'rgba(244,246,248,.75)'; ctx.font = '800 10px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f.f.kcal, x, y + r + 16);
    }
    function draw(now) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var sx = g.shake ? (Math.random() - 0.5) * 10 * g.shake : 0;
      ctx.save(); ctx.translate(sx, 0);
      drawBg();
      g.food.forEach(function (f) { drawFood(f, now); });
      g.obs.forEach(drawObs);
      drawRunner();
      g.pops.forEach(function (p) { ctx.globalAlpha = 1 - p.t / 0.8; ctx.fillStyle = '#35d483'; ctx.font = '900 16px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.txt + ' kcal', p.x, p.y - 20 - p.t * 40); ctx.globalAlpha = 1; });
      ctx.restore();
    }

    reset();
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(1 / 30, (now - last) / 1000); last = now;
      if (!my.paused && !document.hidden) { update(dt); draw(now); }
      my.raf = requestAnimationFrame(frame);
    }
    my.raf = requestAnimationFrame(frame);
    my.setLang = function () { if (g.state !== 'run') message(g.state); };
  }

  function unmount() {
    if (!S) return;
    cancelAnimationFrame(S.raf); S.off.forEach(function (f) { f(); }); S = null;
  }

  window.Ramvo404.register('runner', {
    mount: mount, unmount: unmount,
    setLang: function () { if (S && S.setLang) S.setLang(); },
    visibility: function (v) { if (S) S.paused = !v; },
  });
})();
