/* Ramvo 404 scene: Barbell. Hold (mouse, finger, Space or Enter) to press a
   404 barbell; spring physics, plate wobble, fatigue tremor, 4 reps = solved. */
(function () {
  'use strict';
  var CSS = '' +
    '.bb-stage{cursor:grab;touch-action:none}.bb-stage.holding{cursor:grabbing}' +
    '.bb-stage svg{display:block;width:100%;height:auto}' +
    '.bb-lbl{font:800 11px Manrope,sans-serif;letter-spacing:.14em;text-transform:uppercase;fill:#35d483;opacity:.75}' +
    '.bb-num{font:900 92px Archivo,sans-serif;fill:#0B0D10}' +
    '.bb-cnt{font:900 46px Archivo,sans-serif;fill:#F4F6F8}.bb-sub{font:800 10px Manrope,sans-serif;letter-spacing:.16em;fill:#8E97A3}' +
    '.bb-pop{animation:bbpop .38s cubic-bezier(.2,1.6,.4,1);transform-origin:center;transform-box:fill-box}' +
    '@keyframes bbpop{40%{transform:scale(1.22)}}' +
    '.bb-gold .bb-face{fill:url(#bbGold)!important}' +
    '.bb-hud{position:absolute;left:16px;right:16px;top:14px;display:flex;justify-content:space-between;gap:10px;pointer-events:none}' +
    '.bb-pr{color:#FFC83D!important;border-color:#5a4a10!important;opacity:0;transform:translateY(-6px);transition:opacity .3s,transform .3s}.bb-pr.show{opacity:1;transform:none}' +
    '.bb-cue{position:absolute;left:0;right:0;bottom:14px;text-align:center;font:800 .95rem Manrope,sans-serif;pointer-events:none;text-shadow:0 2px 12px #000}' +
    '.bb-controls{margin-top:14px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:center}' +
    '@media(max-width:640px){.bb-controls{grid-template-columns:minmax(0,1fr)}}' +
    '.bb-press{padding:15px 26px;font-size:1rem;touch-action:none;user-select:none;-webkit-user-select:none;transition:transform .12s}.bb-press.holding{transform:scale(.97)}' +
    '.bb-press kbd{font:800 .72rem Manrope,sans-serif;background:rgba(4,22,31,.18);border-radius:6px;padding:2px 7px}' +
    '.bb-fat{height:6px;border-radius:99px;background:#1F242B;margin-top:8px;overflow:hidden}.bb-fat i{display:block;height:100%;width:0;background:linear-gradient(90deg,#35d483,#ffc83d,#ff4d8d);transition:width .25s}';

  var LINES = {
    pl: ['Jeszcze jedno!', 'Czysta technika', 'Kto to dźwiga?', 'Rekord blisko', 'Trener byłby dumny', 'Bestia', 'Oddychaj i pchaj'],
    en: ['One more!', 'Clean technique', 'Who lifts this?', 'PR is close', 'Your coach would be proud', 'Beast mode', 'Breathe and push'],
  };
  var raf = 0, cleanup = [];

  function mount(el, api) {
    if (!document.getElementById('bb-css')) { var st = document.createElement('style'); st.id = 'bb-css'; st.textContent = CSS; document.head.appendChild(st); }
    el.innerHTML =
      '<div class="scene-head"><b><span data-l="pl">Wyciśnij 404</span><span data-l="en">Press the 404</span></b>' +
      '<span><span data-l="pl">Przytrzymaj, żeby wycisnąć. 4 powtórzenia i wracasz.</span><span data-l="en">Hold to press. 4 reps and you are back.</span></span></div>' +
      '<div class="stage bb-stage" id="bbStage" role="img" aria-label="Barbell 404">' +
      '<svg viewBox="0 0 800 380" aria-hidden="true"><defs>' +
      '<linearGradient id="bbP1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd6ff"/><stop offset="1" stop-color="#1f9ccc"/></linearGradient>' +
      '<linearGradient id="bbP2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7aa8"/><stop offset="1" stop-color="#d1316a"/></linearGradient>' +
      '<linearGradient id="bbGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#d9a21b"/></linearGradient>' +
      '<linearGradient id="bbBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8edf2"/><stop offset=".5" stop-color="#9aa4ae"/><stop offset="1" stop-color="#5d6670"/></linearGradient>' +
      '<radialGradient id="bbRing" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#1c2b35"/><stop offset="1" stop-color="#0e1216"/></radialGradient></defs>' +
      '<line x1="40" x2="760" y1="78" y2="78" stroke="#35d483" stroke-opacity=".35" stroke-width="2" stroke-dasharray="6 8"/><text class="bb-lbl" x="44" y="68">LOCKOUT</text>' +
      '<line x1="40" x2="760" y1="300" y2="300" stroke="#2a323b" stroke-width="2" stroke-dasharray="6 8"/>' +
      '<rect x="196" y="282" width="10" height="70" rx="3" fill="#20262d"/><rect x="594" y="282" width="10" height="70" rx="3" fill="#20262d"/>' +
      '<ellipse id="bbShadow" cx="400" cy="362" rx="300" ry="10" fill="#000" opacity=".45"/>' +
      '<g id="bbBarG" transform="translate(0 300)"><g id="bbShake">' +
      '<rect x="40" y="-7" width="720" height="14" rx="7" fill="url(#bbBar)"/>' +
      '<rect x="230" y="-8" width="60" height="16" rx="3" fill="#7b858f" opacity=".6"/><rect x="510" y="-8" width="60" height="16" rx="3" fill="#7b858f" opacity=".6"/>' +
      '<g id="bbL"><rect x="92" y="-104" width="58" height="208" rx="12" class="bb-face" fill="url(#bbP1)"/><rect x="150" y="-74" width="24" height="148" rx="8" class="bb-face" fill="url(#bbP2)"/><rect x="174" y="-16" width="16" height="32" rx="4" fill="#cfd6dd"/><text class="bb-num" x="121" y="33" text-anchor="middle">4</text></g>' +
      '<g id="bbR"><rect x="650" y="-104" width="58" height="208" rx="12" class="bb-face" fill="url(#bbP1)"/><rect x="626" y="-74" width="24" height="148" rx="8" class="bb-face" fill="url(#bbP2)"/><rect x="610" y="-16" width="16" height="32" rx="4" fill="#cfd6dd"/><text class="bb-num" x="679" y="33" text-anchor="middle">4</text></g>' +
      '<g id="bbCounter"><circle cx="400" cy="0" r="58" fill="url(#bbRing)" stroke="#24313a" stroke-width="2"/><circle cx="400" cy="0" r="50" fill="none" stroke="#1f2a31" stroke-width="8"/>' +
      '<circle id="bbProg" cx="400" cy="0" r="50" fill="none" stroke="#3ec6ff" stroke-width="8" stroke-linecap="round" stroke-dasharray="0 315" transform="rotate(-90 400 0)"/>' +
      '<text id="bbCnt" class="bb-cnt" x="400" y="14" text-anchor="middle">0</text><text id="bbSub" class="bb-sub" x="400" y="34" text-anchor="middle">/ 4</text></g>' +
      '</g></g></svg>' +
      '<div class="bb-hud"><span class="chip"><span data-l="pl">Ciężar</span><span data-l="en">Load</span> <b>404</b> kg</span><span class="chip bb-pr" id="bbPr">★ <span data-l="pl">Nowy rekord!</span><span data-l="en">New PR!</span></span></div>' +
      '<div class="bb-cue" id="bbCue"></div></div>' +
      '<div class="bb-controls"><button type="button" class="btn bb-press" id="bbPress">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/></svg>' +
      '<span data-l="pl">Przytrzymaj i wyciskaj</span><span data-l="en">Hold and press</span> <kbd>Space</kbd></button>' +
      '<div class="meters"><div class="meter"><span data-l="pl">Powtórzenia</span><span data-l="en">Reps</span><b id="bbReps">0</b></div>' +
      '<div class="meter"><span data-l="pl">Rekord</span><span data-l="en">Record</span><b id="bbBest">0</b></div>' +
      '<div class="meter"><span data-l="pl">Zmęczenie</span><span data-l="en">Fatigue</span><b id="bbFatT">0%</b><div class="bb-fat"><i id="bbFat"></i></div></div></div></div>';

    var $ = function (id) { return document.getElementById(id); };
    var stage = $('bbStage'), press = $('bbPress'), bar = $('bbBarG'), shake = $('bbShake'), plL = $('bbL'), plR = $('bbR');
    var cnt = $('bbCnt'), sub = $('bbSub'), prog = $('bbProg'), counter = $('bbCounter'), shadow = $('bbShadow');
    var TOP = 78, BOTTOM = 300, CIRC = 2 * Math.PI * 50, GOAL = 4;
    var y = 0, v = 0, holding = false, locked = false, reps = 0, fatigue = 0, wob = 0, wobV = 0, done = false, lineIdx = 0, failing = 0, cueKey = '';
    var best = parseInt(api.store.get('ramvo404-best') || '0', 10) || 0;
    $('bbBest').textContent = best;

    function cue(key, txt) {
      if (cueKey === key && key !== 'line') return;
      cueKey = key;
      $('bbCue').textContent = txt != null ? txt : ({
        idle: api.t('Przytrzymaj, żeby wycisnąć', 'Hold to press'), lift: api.t('Pchaj!', 'Push!'), lower: api.t('Puść i opuść', 'Release to lower'),
        fail: api.t('Ciężko… odpocznij chwilę', 'Heavy… rest a moment'), done: api.t('Brawo! Bij rekord dalej', 'Nice! Keep going for a PR'),
      })[key] || '';
    }
    cue('idle');

    function hold(on) {
      if (holding === on) return;
      holding = on; api.busy(on);
      stage.classList.toggle('holding', on); press.classList.toggle('holding', on);
      if (on && api.reduce) reducedRep();
    }
    function on(target, type, fn, opt) { target.addEventListener(type, fn, opt); cleanup.push(function () { target.removeEventListener(type, fn, opt); }); }
    [stage, press].forEach(function (t) {
      on(t, 'pointerdown', function (e) { e.preventDefault(); try { t.setPointerCapture(e.pointerId); } catch (x) {} hold(true); });
      on(t, 'pointerup', function () { hold(false); });
      on(t, 'pointercancel', function () { hold(false); });
      on(t, 'lostpointercapture', function () { hold(false); });
    });
    on(press, 'keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); hold(true); } });
    on(press, 'keyup', function (e) { if (e.key === 'Enter') hold(false); });
    var buf = '';
    on(window, 'keydown', function (e) {
      if (e.code === 'Space' && !e.repeat && !/input|textarea|select/i.test((e.target && e.target.tagName) || '')) { e.preventDefault(); hold(true); }
      if (e.key && e.key.length === 1) { buf = (buf + e.key.toLowerCase()).slice(-5); if (buf === 'ramvo') { stage.classList.toggle('bb-gold'); api.beep(1046); } }
    });
    on(window, 'keyup', function (e) { if (e.code === 'Space') hold(false); });
    on(window, 'blur', function () { hold(false); });

    function countRep() {
      reps++;
      fatigue = Math.min(0.92, fatigue + 0.075);
      $('bbReps').textContent = reps;
      var shown = Math.min(reps, GOAL);
      cnt.textContent = reps >= GOAL ? '✓' : String(reps);
      sub.textContent = reps >= GOAL ? api.t('POWT. ', 'REPS ') + reps : '/ ' + GOAL;
      prog.setAttribute('stroke-dasharray', (CIRC * shown / GOAL).toFixed(1) + ' ' + CIRC.toFixed(1));
      prog.setAttribute('stroke', reps >= GOAL ? '#35d483' : '#3ec6ff');
      counter.classList.remove('bb-pop'); void counter.getBBox(); counter.classList.add('bb-pop');
      api.announce(api.t('Powtórzenie ', 'Rep ') + reps);
      api.vibrate(25); api.beep(520 + reps * 18);
      if (reps > best) {
        best = reps; api.store.set('ramvo404-best', String(best)); $('bbBest').textContent = best;
        if (reps > GOAL) { var pr = $('bbPr'); pr.classList.add('show'); clearTimeout(pr._t); pr._t = setTimeout(function () { pr.classList.remove('show'); }, 1600); }
      }
      if (reps === GOAL && !done) { done = true; api.solved('Brawo! <em>Wracamy do formy</em>', 'Nice! <em>Back in shape</em>'); cue('done'); }
      else { var L = LINES[api.lang()]; cue('line', L[lineIdx++ % L.length]); }
    }
    function reducedRep() {
      bar.setAttribute('transform', 'translate(0 ' + TOP + ')');
      setTimeout(function () { bar.setAttribute('transform', 'translate(0 ' + BOTTOM + ')'); countRep(); }, 260);
    }

    var last = performance.now();
    function step(now) {
      var dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (!api.reduce) {
        var strength = Math.max(0.28, 1 - fatigue * 0.78);
        var a = holding ? 9.5 * strength - 3.2 : -7.5;
        v += a * dt; v *= Math.pow(0.18, dt); y += v * dt;
        if (y >= 1) { y = 1; if (v > 0) { wobV += v * 9; v = -v * 0.18; } }
        if (y <= 0) { y = 0; if (v < 0) { wobV += v * 6; v = 0; } }
        if (!holding) fatigue = Math.max(0, fatigue - 0.05 * dt);
        if (!locked && y > 0.965) { locked = true; cue('lower'); }
        if (locked && y < 0.06) { locked = false; countRep(); }
        failing = holding && !locked && y > 0.1 && v < 0.05 ? failing + dt : 0;
        if (failing > 1.6) { cue('fail'); failing = -2; }
        if (holding && !locked && y > 0.04 && y < 0.9 && failing >= 0 && cueKey !== 'fail') cue('lift');
        wobV += (-wob * 60 - wobV * 7 + v * 6) * dt; wob += wobV * dt;
        var ty = BOTTOM - (BOTTOM - TOP) * y;
        var trem = holding && y > 0.05 && y < 0.97 ? Math.pow(fatigue, 1.6) * 3.2 : 0;
        bar.setAttribute('transform', 'translate(0 ' + ty.toFixed(2) + ')');
        shake.setAttribute('transform', trem ? 'translate(' + ((Math.random() - 0.5) * trem).toFixed(2) + ' ' + ((Math.random() - 0.5) * trem * 0.6).toFixed(2) + ') rotate(' + ((Math.random() - 0.5) * trem * 0.25).toFixed(2) + ' 400 0)' : '');
        plL.setAttribute('transform', 'rotate(' + (wob * 1.4).toFixed(2) + ' 140 0)');
        plR.setAttribute('transform', 'rotate(' + (-wob * 1.4).toFixed(2) + ' 660 0)');
        shadow.setAttribute('rx', (300 - y * 70).toFixed(1)); shadow.setAttribute('opacity', (0.45 - y * 0.22).toFixed(2));
      }
      var fp = Math.round(fatigue * 100);
      $('bbFatT').textContent = fp + '%'; $('bbFat').style.width = fp + '%';
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

  function unmount() {
    cancelAnimationFrame(raf);
    cleanup.forEach(function (f) { f(); }); cleanup = [];
  }

  window.Ramvo404.register('barbell', { mount: mount, unmount: unmount, setLang: function () {} });
})();
