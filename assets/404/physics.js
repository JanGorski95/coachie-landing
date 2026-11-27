/* Ramvo 404 scene: Physics digits. The digits 4-0-4 fall like weights; drag
   and throw them (or tilt the phone) and stand them upright in order to solve.
   Kettlebells carry links: drop one in the glowing zone to go there.
   Physics: matter-js 0.19.0 (MIT) from cdnjs, loaded only by this scene. */
(function () {
  'use strict';
  var MATTER = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
  var CSS = '' +
    '.ph-stage{touch-action:none}.ph-stage canvas{display:block;width:100%;cursor:grab}.ph-stage canvas:active{cursor:grabbing}' +
    '.ph-bar{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center}' +
    '.ph-hint{position:absolute;left:16px;top:14px;pointer-events:none}' +
    '.ph-zone{position:absolute;right:16px;top:14px;pointer-events:none}';
  var KETTLES = [
    { href: '/trainers/', pl: 'Trenerzy', en: 'Trainers', c: '#FF4D8D' },
    { href: '/pricing/', pl: 'Cennik', en: 'Pricing', c: '#35D483' },
    { href: '/pricing/premium/', pl: 'Premium', en: 'Premium', c: '#FFC83D' },
  ];
  var state = null;

  function loadMatter() {
    return new Promise(function (res, rej) {
      if (window.Matter) return res(window.Matter);
      var s = document.createElement('script'); s.src = MATTER; s.crossOrigin = 'anonymous';
      s.onload = function () { res(window.Matter); }; s.onerror = rej; document.head.appendChild(s);
    });
  }

  function mount(el, api) {
    if (!document.getElementById('ph-css')) { var st = document.createElement('style'); st.id = 'ph-css'; st.textContent = CSS; document.head.appendChild(st); }
    el.innerHTML =
      '<div class="scene-head"><b><span data-l="pl">Ułóż 404</span><span data-l="en">Stack the 404</span></b>' +
      '<span><span data-l="pl">Przeciągaj i rzucaj. Postaw cyfry prosto w kolejności 4-0-4.</span><span data-l="en">Drag and throw. Stand the digits upright in order 4-0-4.</span></span></div>' +
      '<div class="stage ph-stage" id="phStage"><canvas id="phCanvas"></canvas>' +
      '<span class="chip ph-hint" id="phHint"><span data-l="pl">Złap cyfrę</span><span data-l="en">Grab a digit</span></span>' +
      '<span class="chip ph-zone"><span data-l="pl">Kettla w strefę = przejście</span><span data-l="en">Kettlebell in the zone = go</span></span></div>' +
      '<div class="ph-bar"><button type="button" class="btn ghost" id="phShake">↯ <span data-l="pl">Potrząśnij</span><span data-l="en">Shake</span></button>' +
      '<button type="button" class="btn ghost" id="phTilt" hidden><span data-l="pl">Włącz przechylanie</span><span data-l="en">Enable tilt</span></button></div>';
    var my = { api: api, el: el, raf: 0, off: [], alive: true };
    state = my;
    loadMatter().then(function (M) { if (my.alive) start(M, my); }).catch(function () {
      if (!my.alive) return;
      document.getElementById('phStage').innerHTML = '<div class="scene-fail">' + api.t('Nie udało się załadować fizyki. Spróbuj innej wersji.', 'Physics did not load. Try another version.') + '</div>';
    });
  }

  function start(M, my) {
    var api = my.api, Engine = M.Engine, Bodies = M.Bodies, Composite = M.Composite, Body = M.Body;
    var stage = document.getElementById('phStage'), cv = document.getElementById('phCanvas'), ctx = cv.getContext('2d');
    var DPR = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0;
    var engine = Engine.create({ enableSleeping: false }); engine.gravity.y = 1;
    var digits = [], kettles = [], walls = [], mouseC = null, mouse = null, solvedOnce = false, stillT = 0, zoneT = {}, leaving = false;

    function on(t, type, fn, opt) { t.addEventListener(type, fn, opt); my.off.push(function () { t.removeEventListener(type, fn, opt); }); }

    function build() {
      W = stage.clientWidth; H = W < 560 ? 360 : 420;
      cv.width = W * DPR; cv.height = H * DPR; cv.style.height = H + 'px';
      Composite.clear(engine.world, false);
      var t = 60;
      walls = [
        Bodies.rectangle(W / 2, H + t / 2, W * 2, t, { isStatic: true, label: 'floor' }),
        Bodies.rectangle(-t / 2, H / 2, t, H * 4, { isStatic: true }),
        Bodies.rectangle(W + t / 2, H / 2, t, H * 4, { isStatic: true }),
        Bodies.rectangle(W / 2, -H * 1.5, W * 2, t, { isStatic: true }),
      ];
      var dh = Math.min(150, Math.max(96, W * 0.17)), dw = dh * 0.66;
      digits = ['4', '0', '4'].map(function (ch, i) {
        var b = Bodies.rectangle(W * (0.22 + i * 0.17) + (Math.random() - 0.5) * 40, -dh - i * 70, dw, dh, { chamfer: { radius: 16 }, restitution: 0.35, friction: 0.6, density: 0.004, label: 'digit' });
        Body.setAngle(b, (Math.random() - 0.5) * 1.2); Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.2);
        b.ch = ch; b.w = dw; b.h = dh; return b;
      });
      var kr = Math.max(22, Math.min(32, W * 0.045));
      kettles = KETTLES.map(function (k, i) {
        var b = Bodies.circle(W * (0.72 + i * 0.07), -200 - i * 90, kr, { restitution: 0.5, friction: 0.4, density: 0.003, label: 'kettle' });
        b.k = k; b.r = kr; return b;
      });
      Composite.add(engine.world, walls.concat(digits, kettles));
      if (mouseC) Composite.add(engine.world, mouseC);
    }

    function zone() { var w = Math.min(150, W * 0.22); return { x: W - w - 14, y: H - 130, w: w, h: 116 }; }
    function slots() { var dh = digits[0] ? digits[0].h : 120, dw = dh * 0.66, gap = dw * 0.25, total = dw * 3 + gap * 2, x0 = Math.max(16, W * 0.38 - total / 2); return [0, 1, 2].map(function (i) { return { x: x0 + i * (dw + gap), y: H - dh, w: dw, h: dh }; }); }

    build();
    mouse = M.Mouse.create(cv); mouse.pixelRatio = DPR;
    // let the page scroll with the wheel: matter grabs wheel events by default
    ['mousewheel', 'DOMMouseScroll', 'wheel'].forEach(function (ev) { cv.removeEventListener(ev, mouse.mousewheel); });
    mouseC = M.MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.22, damping: 0.08, render: { visible: false } } });
    Composite.add(engine.world, mouseC);
    M.Events.on(mouseC, 'startdrag', function (e) { api.busy(true); api.beep(440, 0.08); document.getElementById('phHint').style.opacity = '0'; if (e.body && e.body.label === 'kettle') api.vibrate(10); });
    M.Events.on(mouseC, 'enddrag', function () { api.busy(false); });
    M.Events.on(engine, 'collisionStart', function (e) {
      e.pairs.forEach(function (p) {
        var s = Math.abs(p.bodyA.speed - p.bodyB.speed) + Math.max(p.bodyA.speed, p.bodyB.speed);
        if (s > 9) { api.beep(160 + Math.random() * 60, 0.09, 'square'); if (s > 14) api.vibrate(8); }
      });
    });

    var rt = 0;
    on(window, 'resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (Math.abs(stage.clientWidth - W) > 40) build(); }, 200); });
    on(document.getElementById('phShake'), 'click', function () {
      digits.concat(kettles).forEach(function (b) { Body.setVelocity(b, { x: (Math.random() - 0.5) * 18, y: -12 - Math.random() * 10 }); Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.5); });
      api.vibrate([20, 30, 20]); api.beep(300, 0.15, 'sawtooth');
    });
    // tilt
    var tiltBtn = document.getElementById('phTilt');
    function onTilt(e) {
      if (e.gamma == null) return;
      engine.gravity.x = Math.max(-1, Math.min(1, e.gamma / 40));
      engine.gravity.y = Math.max(-0.6, Math.min(1.4, (e.beta == null ? 45 : e.beta) / 45));
    }
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (coarse && window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        tiltBtn.hidden = false;
        on(tiltBtn, 'click', function () { DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') { on(window, 'deviceorientation', onTilt); tiltBtn.hidden = true; api.toast(api.t('Przechyl telefon', 'Tilt your phone')); } }).catch(function () {}); });
      } else on(window, 'deviceorientation', onTilt);
    }

    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    function checkGoal(dt) {
      if (solvedOnce) return;
      var sorted = digits.slice().sort(function (a, b) { return a.position.x - b.position.x; });
      var ok = sorted.map(function (b) { return b.ch; }).join('') === '404' && sorted.every(function (b) {
        var a = ((b.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); var dev = Math.min(a, 2 * Math.PI - a);
        return dev < 0.21 && b.position.y > H - b.h * 0.62 && b.speed < 0.6 && Math.abs(b.angularVelocity) < 0.02;
      });
      stillT = ok ? stillT + dt : 0;
      if (stillT > 0.6) { solvedOnce = true; api.solved('Brawo! <em>404 stoi</em>', 'Nice! <em>404 is standing</em>'); }
    }
    function checkZone(dt) {
      if (leaving) return;
      var z = zone();
      kettles.forEach(function (b, i) {
        var inside = b.position.x > z.x && b.position.x < z.x + z.w && b.position.y > z.y && b.position.y < z.y + z.h && b.speed < 1.2 && !(mouseC.body === b);
        zoneT[i] = inside ? (zoneT[i] || 0) + dt : 0;
        if (zoneT[i] > 0.45) {
          leaving = true;
          api.toast(api.t('Lecimy do: ', 'Heading to: ') + (api.lang() === 'en' ? b.k.en : b.k.pl), 900);
          api.vibrate(30); api.beep(740, 0.2);
          setTimeout(function () { api.go(b.k.href); }, 650);
        }
      });
    }

    var last = performance.now(), paused = false;
    function frame(now) {
      var dt = Math.min(1 / 30, (now - last) / 1000); last = now;
      if (!paused) {
        Engine.update(engine, dt * 1000);
        checkGoal(dt); checkZone(dt);
        draw(now);
      }
      my.raf = requestAnimationFrame(frame);
    }
    function draw(now) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
      // floor line and slots
      ctx.strokeStyle = '#242a31'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, H - 1); ctx.lineTo(W, H - 1); ctx.stroke();
      ctx.setLineDash([6, 8]);
      slots().forEach(function (s, i) {
        ctx.strokeStyle = solvedOnce ? 'rgba(53,212,131,.55)' : 'rgba(142,151,163,.22)'; rr(s.x, s.y, s.w, s.h, 16); ctx.stroke();
        ctx.fillStyle = 'rgba(142,151,163,.18)'; ctx.font = '900 ' + (s.h * 0.5) + 'px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(['4', '0', '4'][i], s.x + s.w / 2, s.y + s.h / 2 + 4);
      });
      // drop zone
      var z = zone(), pulse = 0.5 + 0.5 * Math.sin(now / 400);
      ctx.strokeStyle = 'rgba(62,198,255,' + (0.35 + pulse * 0.35) + ')'; rr(z.x, z.y, z.w, z.h, 18); ctx.stroke(); ctx.setLineDash([]);
      var g = ctx.createLinearGradient(0, z.y, 0, z.y + z.h); g.addColorStop(0, 'rgba(62,198,255,0)'); g.addColorStop(1, 'rgba(62,198,255,' + (0.08 + pulse * 0.08) + ')');
      ctx.fillStyle = g; rr(z.x, z.y, z.w, z.h, 18); ctx.fill();
      ctx.fillStyle = 'rgba(62,198,255,.85)'; ctx.font = '800 11px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(api.t('STREFA', 'ZONE'), z.x + z.w / 2, z.y + 16);
      // digits
      digits.forEach(function (b) {
        ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
        ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
        var gr = ctx.createLinearGradient(0, -b.h / 2, 0, b.h / 2); gr.addColorStop(0, b.ch === '0' ? '#ff7aa8' : '#5fd6ff'); gr.addColorStop(1, b.ch === '0' ? '#d1316a' : '#1f9ccc');
        ctx.fillStyle = gr; rr(-b.w / 2, -b.h / 2, b.w, b.h, 16); ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = 'rgba(255,255,255,.22)'; rr(-b.w / 2 + 6, -b.h / 2 + 6, b.w - 12, b.h * 0.18, 10); ctx.fill();
        ctx.fillStyle = '#0B0D10'; ctx.font = '900 ' + (b.h * 0.72) + 'px Archivo, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.ch, 0, b.h * 0.05);
        ctx.restore();
      });
      // kettlebells
      kettles.forEach(function (b) {
        var r = b.r;
        ctx.save(); ctx.translate(b.position.x, b.position.y); ctx.rotate(b.angle);
        ctx.strokeStyle = '#9aa4ae'; ctx.lineWidth = r * 0.28; ctx.beginPath(); ctx.arc(0, -r * 0.95, r * 0.55, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        var gk = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); gk.addColorStop(0, '#3a434d'); gk.addColorStop(1, '#15181c');
        ctx.fillStyle = gk; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill();
        ctx.strokeStyle = b.k.c; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
        ctx.fillStyle = b.k.c; ctx.font = '800 ' + Math.max(10, r * 0.42) + 'px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(api.lang() === 'en' ? b.k.en : b.k.pl, b.position.x, b.position.y + 1);
      });
    }
    my.raf = requestAnimationFrame(frame);
    my.visibility = function (vis) { paused = !vis; last = performance.now(); };
    my.stop = function () { cancelAnimationFrame(my.raf); try { M.Mouse.clearSourceEvents && M.Mouse.clearSourceEvents(mouse); } catch (e) {} Composite.clear(engine.world, false); Engine.clear(engine); };
  }

  function unmount() {
    if (!state) return;
    state.alive = false;
    cancelAnimationFrame(state.raf);
    if (state.stop) state.stop();
    state.off.forEach(function (f) { f(); });
    state = null;
  }

  window.Ramvo404.register('physics', {
    mount: mount, unmount: unmount, setLang: function () {},
    visibility: function (v) { if (state && state.visibility) state.visibility(v); },
  });
})();
