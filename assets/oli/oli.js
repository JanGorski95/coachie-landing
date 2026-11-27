/* Ramvo: Oli Edition. A joke page for Oli, from Jan (Janet).
   Flow: fake SSO login -> "are you the real Oli" quiz -> the app with
   12 secrets. Answers live in this file on purpose: it's a joke, not a vault. */
(function () {
  'use strict';

  // ------------------------------------------------------------------ state
  var KEY = 'ramvo-oli';
  var S = load();
  function load() {
    var d = { stage: 'login', found: [], tab: 'home', mute: false, attempts: 0, quiz: 0, score: 0, janet: false, under: false, renewed: false, carpool: false, simmer: false, clock: -1 };
    try { var x = JSON.parse(localStorage.getItem(KEY) || '{}'); for (var k in x) d[k] = x[k]; } catch (e) {}
    return d;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  var $ = function (id) { return document.getElementById(id); };
  var screen = $('screen');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function J() { return S.janet ? 'Janet' : 'Jan'; }

  // ------------------------------------------------------------------ effects
  var ac = null;
  function beep(f, d) {
    if (S.mute) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = f || 660; o.type = 'triangle';
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.15, ac.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (d || 0.15));
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + (d || 0.15) + 0.02);
    } catch (e) {}
  }
  function buzz(p) { if (!S.mute && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} }
  var toastT;
  function toast(msg, ms) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 2600);
  }
  function confetti(n) {
    var cols = ['#3EC6FF', '#FF4D8D', '#35D483', '#FFC83D', '#FF9F43'];
    for (var i = 0; i < (n || 60); i++) {
      var c = document.createElement('i'); c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = cols[i % cols.length];
      c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
      c.style.animationDelay = Math.random() * 0.4 + 's';
      document.body.appendChild(c);
      setTimeout(function (el) { el.remove(); }.bind(null, c), 3600);
    }
  }
  function bubbles(on) {
    var b = document.querySelector('.bubbles'); b.innerHTML = '';
    document.body.classList.toggle('under', on);
    if (!on) return;
    for (var i = 0; i < 26; i++) {
      var x = document.createElement('i'), s = 6 + Math.random() * 22;
      x.style.width = x.style.height = s + 'px';
      x.style.left = Math.random() * 100 + 'vw';
      x.style.animationDuration = (5 + Math.random() * 8) + 's';
      x.style.animationDelay = (-Math.random() * 10) + 's';
      b.appendChild(x);
    }
  }

  // ------------------------------------------------------------------ secrets
  var SECRETS = [
    { id: 'janet', name: 'Janet mode', hint: 'Type what you call your recruiter. Anywhere. Just type it.' },
    { id: 'thai', name: 'Thailand mode', hint: 'Up, up, down, down, left, right, left, right, B, A. Or swipe it on the screen.' },
    { id: 'dev', name: "Oli's question log", hint: 'Developers tap logos. A lot. Seven times, to be precise.' },
    { id: 'simmer', name: 'Simmer cancelled', hint: 'Some subscriptions do not want to be cancelled. Be persistent.' },
    { id: 'coys', name: 'Trophy cabinet', hint: 'Type what Spurs fans shout. Four letters.' },
    { id: 'contract', name: 'Contract renewed', hint: 'Tuesday. The contract. Tap it like your job depends on it.' },
    { id: 'traffic', name: 'Traffic report', hint: 'Type your favourite excuse.' },
    { id: 'clause', name: 'Clause 12', hint: 'Always read the fine print in the handbook.' },
    { id: 'birthday', name: 'Birthday (probably)', hint: 'Your profile is not sure when your birthday is. Ask it.' },
    { id: 'friday', name: 'Weekend mode', hint: 'Time flies when you tap the clock. Aim for Friday after five.' },
    { id: 'carpool', name: 'Five-star ride', hint: 'Somebody needs a lift home. Offer one.' },
    { id: 'poem', name: 'The poem', hint: 'You wrote Janet a poem. Ask Coach Janet for one back and read it to the end.' },
  ];
  function has(id) { return S.found.indexOf(id) >= 0; }
  function found(id) {
    if (has(id) || S.stage !== 'app') return false;
    S.found.push(id); save();
    var s = SECRETS.filter(function (x) { return x.id === id; })[0];
    toast('Secret found: ' + s.name + ' (' + S.found.length + '/' + SECRETS.length + ')', 3200);
    beep(880, 0.12); setTimeout(function () { beep(1320, 0.18); }, 120); buzz([30, 40, 60]);
    confetti(S.found.length === SECRETS.length ? 160 : 50);
    side();
    if (S.found.length === SECRETS.length) setTimeout(finale, 1400);
    return true;
  }
  function side() {
    $('side').hidden = S.stage !== 'app';
    $('count').textContent = S.found.length + '/' + SECRETS.length;
    $('meter').style.width = (S.found.length / SECRETS.length * 100) + '%';
    $('finaleBtn').hidden = S.found.length < SECRETS.length;
    $('mute').textContent = 'Sound: ' + (S.mute ? 'off' : 'on');
  }

  // ------------------------------------------------------------------ login
  var WRONG = [
    'Incorrect. Have you tried turning your brain off and on again?',
    "Wrong again. This attempt has been added to Tuesday's contract review.",
    'Hint: rhymes with planet. Starts with J.',
    'Still no. IT has been notified. IT is also Janet.',
    'Account locked until you buy Jan a coffee. Kidding. It is Janet.',
  ];
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z]/g, ''); }
  function checkPassword(v) {
    var n = norm(v);
    if (n === 'janet') return { ok: true };
    if (n === 'jan') return { ok: false, msg: 'Too formal. That is not what you call him.' };
    if (n === 'traffic' || n === 'thetraffic') return { ok: false, msg: 'That is your excuse, not your password.' };
    if (n.indexOf('mealdeal') >= 0 || n === 'tesco') return { ok: false, msg: 'Close. That is what he paid for, not who he is.' };
    if (n === 'oli' || n === 'oliver') return { ok: false, msg: 'That is you. We asked about him.' };
    if (!n) return { ok: false, msg: 'Type something, Oli. Anything. Ideally the right thing.' };
    return { ok: false, msg: null };
  }
  function renderLogin() {
    screen.innerHTML =
      '<div class="login fade-in">' +
      '<div class="brand"><span class="logo">r</span><div><h2>Ramvo for Enterprise</h2><div class="sso">MeetingSnore SSO · a 20th Century AV company</div></div></div>' +
      '<div class="card"><div class="eyebrow">Oli Edition</div><p style="margin:6px 0 0">Authorised personnel only. That is one person. Hi, Oli.</p></div>' +
      '<form id="lf" class="login" style="padding:0" autocomplete="off">' +
      '<label class="field">Username<input value="oli@meetingsnore.co.uk" readonly></label>' +
      '<label class="field">Security question: What do you call your recruiter, the person who made it possible for you to pay for your Meal Deals?<input id="pw" type="text" autocapitalize="off" spellcheck="false" placeholder="Answer"></label>' +
      '<div class="err" id="err"></div>' +
      '<button class="pill block" type="submit">Sign in</button>' +
      '</form>' +
      '<button type="button" class="link" id="forgot" style="align-self:center">Forgot password?</button>' +
      '<p class="muted small" style="text-align:center;margin-top:14px">By signing in you agree to the MeetingSnore Employee Handbook, including Section 4.2 (Questions).</p>' +
      '</div>';
    $('lf').onsubmit = function (e) {
      e.preventDefault();
      var r = checkPassword($('pw').value);
      if (r.ok) { beep(990, 0.2); S.stage = 'quiz'; S.quiz = 0; S.score = 0; save(); render(); return; }
      S.attempts++; save();
      var msg = r.msg || WRONG[Math.min(S.attempts - 1, WRONG.length - 1)];
      if (!r.msg && S.attempts >= 3 && S.attempts < 5) msg += ' (Hint: rhymes with planet.)';
      $('err').textContent = msg;
      var f = $('lf'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
      beep(180, 0.2); buzz(80);
    };
    $('forgot').onclick = function () {
      sheet('<h3>Password reset</h3><p>We have sent a reset link to your Simmer account.</p><p class="muted">You are still paying for it, by the way.</p><button class="pill block" data-close>Fine</button>');
    };
  }

  // ------------------------------------------------------------------ quiz
  var QUIZ = [
    { q: 'How do you take your coffee?', opts: [
      ['Black, like my calendar', 0, 'Your calendar is empty, not black. Next.'],
      ['Milk and two sweeteners', 1, 'Close. It only tastes right when Jan makes it. We will allow it.'],
      ['Milk, two sweeteners, made by Jan', 1, 'Correct. The only acceptable answer.'],
      ['Whatever is in the Meal Deal', 0, 'The Meal Deal does not include coffee. We checked.'] ] },
    { q: 'Why were you late today?', opts: [
      ['Traffic', 1, 'Correct. It is always the traffic.'],
      ['Traffic', 1, 'Also correct. Consistent, at least.'],
      ['Traffic', 1, 'Correct again. Three for three.'],
      ['I was early', 0, 'Nice try. We have the CCTV.'] ] },
    { q: 'What is your diet?', opts: [
      ['Tesco Meal Deal', 1, 'Correct. Breakfast, lunch and dinner.'],
      ['Simmer, which I forgot to cancel', 1, 'Also correct. You are still paying for it.'],
      ['A balanced diet with vegetables', 0, 'We both know that is a lie.'],
      ['Protein shakes and discipline', 0, 'Security has escorted this answer out of the building.'] ] },
    { q: 'Where did you teach people to dive?', opts: [
      ['Thailand', 1, 'Correct. Qualified to teach others to breathe underwater. Not yet qualified to arrive on time.'],
      ['The office water cooler', 0, 'Please stop teaching diving at the water cooler.'],
      ['Tottenham Hotspur Stadium', 0, 'That is where hope goes to drown, not where people dive.'],
      ['Khop khun krap', 0, 'That means thank you. Lovely manners, wrong answer.'] ] },
    // forced question: only one answer moves you on, the rest are locked one by one
    { q: 'Which club do you support?', force: true, opts: [
      ['Tottenham Hotspur', 0, 'Incorrect. Ramvo: Oli Edition only supports clubs that have won something this century. Try again.'],
      ['Arsenal', 0, 'Security has been notified. Try again.'],
      ['Whoever wins this weekend', 0, 'Then it is definitely not Spurs. Try again.'],
      ['I prefer meetings', 0, 'MeetingSnore approves. HR is concerned. Try again.'],
      ['Manchester United', 1, 'Correct. Welcome to the right side of history, Oli. We will tell nobody at the office.'] ] },
    // forced question: the only accepted answer is the one about Tuesday
    { q: 'How long will you be at MeetingSnore?', force: true, opts: [
      ['Exactly 3 months so far, and counting', 0, 'Counting what? The days until Tuesday? Try again.'],
      ['Until retirement', 0, 'HR laughed so hard they had to take the afternoon off. Try again.'],
      ['Since the traffic started', 0, 'Wrong tense, Oli. We asked how long you WILL be here. Try again.'],
      ['What is MeetingSnore?', 0, 'Another question. You are on brand, but not for much longer. Try again.'],
      ['Until Tuesday', 1, 'Correct. Please clear your desk by Tuesday 1 December. Leave the stapler. Janet will hold the door.'] ] },
  ];
  function renderQuiz() {
    var i = S.quiz, it = QUIZ[i];
    if (!it) {
      screen.innerHTML = '<div class="fade-in" style="padding-top:30px;text-align:center"><div class="eyebrow">Identity verified</div>' +
        '<div class="big" style="margin:14px 0;color:var(--accent)">Oli Score<br>' + (S.score * 2) + '/10</div>' +
        '<p>' + (S.score >= 5 ? 'Suspiciously Oli. Welcome in.' : 'Not very Oli, but nobody else would try this hard. Welcome in.') + '</p>' +
        '<button class="pill block" id="enter">Open Ramvo: Oli Edition</button></div>';
      $('enter').onclick = function () { S.stage = 'app'; S.tab = 'home'; save(); confetti(70); beep(1200, 0.2); render(); };
      return;
    }
    var bars = QUIZ.map(function (_, k) { return '<i class="' + (k <= i ? 'on' : '') + '"></i>'; }).join('');
    screen.innerHTML = '<div class="fade-in"><div class="eyebrow">Verify you are the real Oli · ' + (i + 1) + '/' + QUIZ.length + '</div>' +
      '<div class="progress">' + bars + '</div><h2>' + esc(it.q) + '</h2><div class="opts" id="opts">' +
      it.opts.map(function (o, k) { return '<button class="opt" data-k="' + k + '">' + esc(o[0]) + '</button>'; }).join('') +
      '</div><div class="feedback" id="fb"></div></div>';
    $('opts').onclick = function (e) {
      var b = e.target.closest('.opt'); if (!b) return;
      var o = it.opts[+b.dataset.k];
      if (it.force && !o[1]) {
        b.disabled = true; b.classList.add('wrong'); beep(200, 0.2); buzz(60);
        $('fb').textContent = o[2];
        return;
      }
      [].forEach.call($('opts').children, function (x) { x.disabled = true; });
      b.classList.add(o[1] ? 'right' : 'wrong');
      if (o[1]) { S.score++; beep(880, 0.12); } else { beep(200, 0.2); buzz(60); }
      $('fb').innerHTML = esc(o[2]) + '<br><br><button class="pill" id="next">' + (i + 1 < QUIZ.length ? 'Next question' : 'See my score') + '</button>';
      $('next').onclick = function () { S.quiz++; save(); render(); };
    };
  }

  // ------------------------------------------------------------------ app
  var TABS = [['home', '⌂', 'Home'], ['plan', '◆', 'Plan'], ['contract', '✎', 'Contract'], ['chat', '✉', 'Coach'], ['more', '≡', 'More']];
  var REVIEW = new Date('2026-12-01T10:00:00Z');
  function countdown() {
    var ms = REVIEW - Date.now();
    if (ms <= 0) return 'The review has happened. You are still here, so draw your own conclusions.';
    var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
    return d + 'd ' + h + 'h ' + m + 'm until your contract review';
  }
  function home() {
    var bday = isBirthday() ? '<div class="banner">Happy birthday, Oli. Probably. HR is still checking.</div>' : '';
    var weekend = isFriday() ? '<div class="banner" style="background:linear-gradient(90deg,var(--green),var(--accent));color:#04161F">Weekend mode: Meal Deal for dinner too.</div>' : '';
    return bday + weekend +
      '<div class="row between"><div><div class="muted small">' + todayLabel() + '</div><h2>Hi, Oli</h2></div><button class="logo" id="logo" aria-label="Ramvo">r</button></div>' +
      '<div class="card" style="margin-top:14px"><div class="eyebrow">Today</div><h3 style="margin:4px 0">Leg day</h3><div class="muted">Postponed. Reason: traffic.</div></div>' +
      '<div class="card"><div class="row between"><div><div class="big" style="color:var(--pink)">0</div><div class="muted small">days at the gym</div></div>' +
      '<div style="text-align:right"><div class="big" style="color:var(--green)">63</div><div class="muted small">days of Meal Deals in a row</div></div></div></div>' +
      '<div class="card"><div class="eyebrow">Macros</div><div class="rings" style="margin-top:10px">' +
      ring('4 g', 'protein', 0.03, '--pink') + ring('3/3', 'Meal Deals', 1, '--green') + ring('2', 'sweeteners', 1, '--accent') + '</div></div>' +
      '<div class="card"><div class="row between"><div><div class="eyebrow">Weather</div><b>Cloudy, 9°C. UV index 2.</b><div class="muted small">Ginger warning: SPF 50 recommended. Yes, even in winter.</div></div><span style="font-size:30px">☁</span></div></div>' +
      '<div class="card"><div class="eyebrow">Ramvo tip</div><p style="margin:4px 0 0">Your coach suggests: start training. Your car suggests: drive Janet home. Your Simmer box suggests: you never cancelled it.</p></div>';
  }
  function ring(v, l, pct, col) {
    var deg = Math.round(pct * 360);
    return '<div style="text-align:center"><div class="ring" style="background:conic-gradient(var(' + col + ') ' + deg + 'deg, var(--card2) 0)"><div class="ring" style="width:50px;height:50px;background:var(--card)">' + v + '</div></div><div class="muted small" style="margin-top:4px">' + l + '</div></div>';
  }
  function plan() {
    return '<div class="eyebrow">Plan by Coach Janet</div><h2 style="margin:4px 0 12px">Your 4-day split</h2>' +
      '<div class="card">' +
      day('A', 'Cardio', 'Walk from the car park to your desk. Arrive before 9. Optional: arrive before 9:30.') +
      day('B', 'Strength', 'Lift a coffee cup that ' + J() + ' made. 3 sets of "thank you". Rest 90 seconds between sips.') +
      day('C', 'Mobility', 'Ask one question without a question mark. Then think about it. Then do not ask it.') +
      day('D', 'Recovery', 'Cancel Simmer. (Advanced. Many have tried.)') +
      '</div><div class="card"><div class="eyebrow">Nutrition</div><p style="margin:4px 0 0">Meal Deal, but swap the crisps for a protein bar. One step at a time, Oli.</p></div>';
  }
  function day(l, t, d) { return '<div class="day"><span class="tag">' + l + '</span><div><b>' + t + '</b><div class="muted">' + d + '</div></div></div>'; }
  function contract() {
    var renewed = has('contract');
    return '<div class="eyebrow">Human Resources · MeetingSnore</div><h2 style="margin:4px 0 12px">Contract review</h2>' +
      '<button class="card contract-badge" id="badge">' +
      (renewed
        ? '<span class="tag green">RENEWED</span><h3 style="margin:8px 0">Contract renewed</h3><p style="margin:0">Reason: ' + J() + ' vouched for you. Also, quietly: you are actually doing well. Do not tell anyone we said that.</p>'
        : '<span class="tag warn">PENDING</span><h3 style="margin:8px 0">Tuesday 1 December</h3><div class="count-big" id="cd">' + countdown() + '</div>' +
          '<p style="margin:8px 0 0">Probability of renewal: 12%. Please prepare to return your lanyard, your parking space and the stapler you think nobody saw.</p>') +
      '</button>' +
      '<div class="card"><div class="eyebrow">Your recruiter</div><p style="margin:4px 0 0">' + J() + ' ran your interview, gave the green light and has vouched for you ever since. ' + J() + ' would like that on the record. And a coffee.</p></div>' +
      '<div class="card"><div class="eyebrow">Performance review</div>' +
      '<div class="day"><span class="tag">Punctuality</span><div>2/10 (traffic, allegedly)</div></div>' +
      '<div class="day"><span class="tag">Client care</span><div>Distribution grade. Replies in 3-5 working days, like a true TD Synnex professional.</div></div>' +
      '<div class="day"><span class="tag">Curiosity</span><div>Off the charts. Mostly questions that did not need asking.</div></div>' +
      '<div class="day"><span class="tag">Team size</span><div>1. You are the whole of MeetingSnore. Also its worst-performing and best-performing employee.</div></div></div>';
  }
  var QUESTIONS = [
    ['Is HDMI just USB but wider?', 'Great question. Wrong, but great.'],
    ['What does AV stand for again?', 'Audio Visual. You work at an AV company. For three months now.'],
    ['If I mute myself, can they still see me?', 'Yes, Oli. They can always see you.'],
    ['Can we have a meeting about the meeting?', 'That is literally the business model. Welcome to MeetingSnore.'],
    ['Why is the traffic always on my route?', 'Because the traffic is a lifestyle choice.'],
  ];
  function chat() {
    return '<div class="eyebrow">Coach ' + J() + '</div><h2 style="margin:4px 0 12px">Ask me anything</h2>' +
      '<div id="log"><div class="bubble them">Hi Oli. I am your coach. I am also the person who hired you, which is why I am still here at 18:00 answering this.</div></div>' +
      '<div class="qbtns" id="qbtns">' + QUESTIONS.map(function (q, i) { return '<button data-q="' + i + '">' + esc(q[0]) + '</button>'; }).join('') +
      '<button data-poem="1" style="border-color:var(--accent);color:var(--accent)">You wrote me a poem. Write one back.</button></div>';
  }
  var POEM = [
    'He drives to work through traffic jams that only he can see,',
    'He tells his clients "three to five days", the TD Synnex way, for free.',
    'He taught the fish in Thailand how to breathe beneath the sea,',
    'But cannot find the meeting room that clearly says "Room B".',
    'His lunch is a Meal Deal, and his dinner is one too,',
    'His Simmer box keeps coming, though he swears that they are through.',
    'He asks a thousand questions, and not one of them is new,',
    'But Janet vouched for him on Tuesday. So, Oli: we are stuck with you.',
  ];
  function more() {
    var ride = has('carpool')
      ? '<div class="tag green">★ 5/5</div><p style="margin:6px 0 0">"Smooth, punctual, great music, would ride again." (' + J() + ' was paid one coffee to write this.)</p>'
      : '<div class="tag pink">★ 1/5</div><p style="margin:6px 0 0">"Lasted longer than the working day. Asked 14 questions before the first roundabout."</p><button class="pill" id="ride" style="margin-top:10px">Request a ride from Oli</button>';
    return '<div class="eyebrow">Profile</div><div class="card" style="margin-top:8px"><h3>Oliver "Oli" Hoskins</h3><div class="muted small">AKA 4jin8 · gamertag, alter ego, and the only one who reads his emails</div>' +
      '<div class="muted">Head of Everything · MeetingSnore (employees: 1)</div>' +
      '<div class="day"><span class="tag">Diving</span><div>Qualified to teach others to breathe underwater. Not qualified to arrive on time.</div></div>' +
      '<div class="day"><span class="tag">Birthday</span><div>15 January <button class="link" id="bday">(probably)</button>. HR is checking.</div></div>' +
      '<div class="day"><span class="tag">Club</span><div>Manchester United (declared under oath in the quiz). Previously Tottenham Hotspur, trophy cabinet available on request.</div></div>' +
      '<div class="day"><span class="tag">Previous</span><div>Distribution. Still treats every client like a pallet.</div></div></div>' +
      '<div class="eyebrow">Carpool</div><div class="card" style="margin-top:8px"><b>Rides with Oli</b>' + ride + '</div>' +
      '<div class="eyebrow">Subscriptions</div><div class="card" style="margin-top:8px">' +
      (has('simmer')
        ? '<b>Simmer</b><div class="tag green" style="margin-left:6px">Cancelled</div><p class="muted" style="margin:6px 0 0">£0 saved. This week\'s box has already been charged.</p>'
        : '<div class="row between"><b>Simmer meal kits</b><span class="tag pink">Active since forever</span></div><p class="muted" style="margin:6px 0 0">You forgot to cancel. We did not forget to charge.</p><div class="runaway-wrap" id="rw"><button class="runaway" id="cancel">Cancel subscription</button></div>') +
      '</div>' +
      '<div class="eyebrow">MeetingSnore Employee Handbook</div><div class="card" style="margin-top:8px">' +
      '<div class="clause"><b>4.2 Questions.</b> Employees may ask up to 3 questions per hour. Oli has an exemption. The exemption was not approved; he asked for it anyway.</div>' +
      '<div class="clause"><b>6.1 Lateness.</b> "Traffic" is accepted as an excuse a maximum of 250 times per year.</div>' +
      '<div class="clause"><b>7.3 Distribution Mindset.</b> Client emails must be answered within 3-5 working days, as is tradition.</div>' +
      '<div class="clause"><b>9.9 Nutrition.</b> The canteen recognises the Meal Deal as a food group. Specifically, Oli\'s only one.</div>' +
      '<p class="fine">By continuing to be employed you accept all clauses, sub-clauses and the <a id="clause">undisclosed clause 12</a>, which supersedes everything above and is enforced by Janet.</p></div>';
  }

  function renderApp() {
    var body = { home: home, plan: plan, contract: contract, chat: chat, more: more }[S.tab]();
    screen.innerHTML = '<div class="fade-in" id="tabBody">' + body + '</div>';
    // the tab bar lives outside the scrolling screen, so it stays pinned to the bottom
    var nav = $('tabs');
    if (!nav) {
      nav = document.createElement('nav'); nav.className = 'tabs'; nav.id = 'tabs';
      $('phone').appendChild(nav);
      nav.onclick = function (e) { var b = e.target.closest('button'); if (!b) return; S.tab = b.dataset.tab; save(); beep(520, 0.05); renderApp(); };
    }
    nav.innerHTML = TABS.map(function (t) {
      return '<button data-tab="' + t[0] + '" class="' + (S.tab === t[0] ? 'on' : '') + '"><span>' + t[1] + '</span>' + t[2] + '</button>';
    }).join('');
    screen.scrollTop = 0;
    wire();
  }

  // per-tab interactions (some are secrets)
  var logoTaps = 0, logoT, badgeTaps = 0, dodges = 0;
  function wire() {
    var logo = $('logo');
    if (logo) logo.onclick = function () {
      logoTaps++; clearTimeout(logoT); logoT = setTimeout(function () { logoTaps = 0; }, 2500);
      beep(400 + logoTaps * 60, 0.05);
      if (logoTaps >= 7) {
        logoTaps = 0; found('dev');
        sheet('<h3>Developer mode: Oli\'s question log</h3><p class="muted small">Recorded for quality and training purposes. Mostly training.</p>' +
          QUESTIONS.map(function (q) { return '<div class="clause">"' + esc(q[0]) + '"</div>'; }).join('') +
          '<div class="clause">"Is the Wi-Fi password the same as yesterday?"</div><div class="clause">"Do I need to bring a laptop to a laptop meeting?"</div><button class="pill block" data-close>Close log</button>');
      }
    };
    var badge = $('badge');
    if (badge) {
      var cd = $('cd'), tick = cd && setInterval(function () { if (!document.body.contains(cd)) return clearInterval(tick); cd.textContent = countdown(); }, 30000);
      badge.onclick = function () {
        if (has('contract')) return;
        badgeTaps++; beep(300 + badgeTaps * 80, 0.06); buzz(20);
        if (badgeTaps >= 5) { badgeTaps = 0; found('contract'); renderApp(); }
        else toast(['HR is reviewing...', 'Still reviewing...', 'Calling your recruiter...', 'Janet is typing...'][badgeTaps - 1]);
      };
    }
    var q = $('qbtns');
    if (q) q.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var log = $('log');
      if (b.dataset.poem) {
        log.insertAdjacentHTML('beforeend', '<div class="bubble me">' + esc(b.textContent) + '</div><div class="bubble them poem" id="poem"><b>Ode to Oli</b><br><span class="muted small">by Ramvo. No AI was harmed.</span><br><br>' +
          POEM.map(function (l, i) { return '<p data-line="' + i + '">' + esc(l) + '</p>'; }).join('') + '<p class="muted small" id="poemEnd" style="font-style:normal">The end. Janet would like a coffee.</p></div>');
        b.remove();
        var end = $('poemEnd');
        if ('IntersectionObserver' in window) {
          var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); setTimeout(function () { found('poem'); }, 600); } }, { root: screen, threshold: 1 });
          io.observe(end);
        } else found('poem');
        $('poem').scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      var it = QUESTIONS[+b.dataset.q];
      log.insertAdjacentHTML('beforeend', '<div class="bubble me">' + esc(it[0]) + '</div><div class="bubble them">' + esc(it[1]) + '</div>');
      b.remove(); beep(700, 0.05);
      screen.scrollTop = screen.scrollHeight;
    };
    var bday = $('bday');
    if (bday) bday.onclick = function () { found('birthday'); toast('Happy birthday. Probably. Somewhere around 15 January.', 3500); confetti(40); };
    var clause = $('clause');
    if (clause) clause.onclick = function () {
      found('clause');
      sheet('<h3>Clause 12 (undisclosed)</h3><p><b>Coffee made by Jan is a privilege, not a right.</b></p><p>Milk, two sweeteners. Stirred, not shaken. Jan reserves the right to withdraw coffee privileges if the word "traffic" is used before 10:00.</p><button class="pill block" data-close>I accept</button>');
    };
    var ride = $('ride');
    if (ride) ride.onclick = function () { found('carpool'); renderApp(); };
    var cancel = $('cancel');
    if (cancel) {
      var dodge = function (e) {
        if (dodges >= 4) return;
        if (e) e.preventDefault();
        dodges++;
        var w = $('rw').clientWidth - cancel.offsetWidth;
        cancel.style.left = (cancel.offsetWidth / 2 + Math.random() * Math.max(0, w)) + 'px';
        cancel.style.top = (20 + Math.random() * 80) + 'px';
        cancel.textContent = ['Are you sure?', 'Really sure?', 'Think of the risotto', 'Fine, one more try'][dodges - 1];
        beep(250 + dodges * 50, 0.05);
      };
      cancel.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') dodge(); });
      cancel.addEventListener('pointerdown', dodge);
      cancel.onclick = function () { if (dodges >= 4) { found('simmer'); renderApp(); } };
    }
  }

  // ------------------------------------------------------------------ global secrets: typing, konami, swipes, clock, URL, dates
  var buf = '';
  function typed(ch) {
    if (S.stage !== 'app') return;
    buf = (buf + ch.toLowerCase()).slice(-12);
    if (/janet$/.test(buf)) { buf = ''; janetMode(); }
    else if (/coys$/.test(buf)) { buf = ''; coys(); }
    else if (/traffic$/.test(buf)) { buf = ''; traffic(); }
  }
  function janetMode() {
    S.janet = !S.janet; save();
    if (!found('janet')) toast(S.janet ? 'Janet mode on' : 'Janet mode off. He is Jan again. For now.');
    else toast('Janet mode: every Jan is now Janet. As it should be.', 3200);
    renderApp();
  }
  function coys() {
    found('coys');
    sheet('<div class="cabinet"><h3>Tottenham Hotspur trophy cabinet</h3><div class="shelf dust">Recent additions: none</div><div class="shelf dust">Coming soon™</div><p class="muted">Come on you Spurs. Someone has to.</p><button class="pill block" data-close>Close (gently)</button></div>');
  }
  function traffic() {
    found('traffic');
    ['🚗', '🚙', '🚕', '🚌', '🚐'].forEach(function (c, i) {
      var el = document.createElement('div'); el.className = 'car'; el.textContent = c;
      el.style.top = (25 + i * 11) + 'vh'; el.style.animationDelay = (i * 0.35) + 's';
      document.body.appendChild(el); setTimeout(function () { el.remove(); }, 5200);
    });
    toast('Excuse logged. Excuse rejected.', 3400);
  }
  var KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  var kpos = 0;
  function konamiStep(k) {
    kpos = k === KONAMI[kpos] ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) { kpos = 0; thailand(); }
  }
  var SWIPES = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
  var spos = 0;
  function swipeStep(d) {
    spos = d === SWIPES[spos] ? spos + 1 : (d === SWIPES[0] ? 1 : 0);
    if (spos === SWIPES.length) { spos = 0; thailand(); }
  }
  function thailand() {
    if (S.stage !== 'app') return;
    S.under = !S.under; save(); bubbles(S.under);
    if (!found('thai')) toast(S.under ? 'Diving again. Sawasdee krap.' : 'Back on dry land.');
    else toast('Thailand mode: you are underwater. Sawasdee krap, instructor.', 3400);
  }
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' && !e.target.classList.contains('typebox')) return;
    if (tag === 'textarea') return;
    var k = (e.key || '').toLowerCase();
    if (S.stage === 'app') konamiStep(k);
    if (k.length === 1 && /[a-z]/.test(k) && !e.target.classList.contains('typebox')) typed(k);
  });
  var tx = null, ty = null;
  screen.addEventListener('touchstart', function (e) { var t = e.touches[0]; tx = t.clientX; ty = t.clientY; }, { passive: true });
  screen.addEventListener('touchend', function (e) {
    if (tx === null || S.stage !== 'app') return;
    var t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty; tx = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 60) return;
    swipeStep(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }, { passive: true });

  // clock: real UK time; tapping it "fast-forwards" through the week
  var FAKE = ['Mon 09:47 (late)', 'Tue 10:00 (review)', 'Wed 13:05 (Meal Deal)', 'Thu 16:59', 'Fri 17:01'];
  function ukNow() {
    try {
      var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; }); return o;
    } catch (e) { var d = new Date(); return { weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()], hour: String(d.getHours()), minute: String(d.getMinutes()).padStart(2, '0') }; }
  }
  function isFriday() { var n = ukNow(); return (n.weekday === 'Fri' && +n.hour >= 17) || S.clock === FAKE.length - 1; }
  function isBirthday() {
    try { var d = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'numeric' }).format(new Date()); return d === '15/01'; } catch (e) { return false; }
  }
  function todayLabel() { return S.clock >= 0 ? FAKE[S.clock] : 'Today'; }
  function paintClock() { var n = ukNow(); $('clock').textContent = S.clock >= 0 ? FAKE[S.clock] : (+n.hour) + ':' + n.minute; }
  $('clock').onclick = function () {
    if (S.stage !== 'app') return;
    S.clock = (S.clock + 1) % FAKE.length; save(); paintClock(); beep(600, 0.04);
    if (S.clock === FAKE.length - 1) { found('friday'); if (S.tab === 'home') renderApp(); }
  };

  // ------------------------------------------------------------------ sheets: hints, finale
  function sheet(html) {
    var s = $('sheet'); s.innerHTML = '<div class="panel" role="dialog" aria-modal="true">' + html + '</div>'; s.hidden = false;
    var b = s.querySelector('input'); if (b) setTimeout(function () { b.focus(); }, 50);
  }
  $('sheet').addEventListener('click', function (e) { if (e.target.id === 'sheet' || e.target.hasAttribute('data-close')) $('sheet').hidden = true; });
  $('psst').onclick = function () {
    sheet('<h3>Psst. Secrets found: ' + S.found.length + '/' + SECRETS.length + '</h3><p class="muted small">One hint each. Some need typing: on a phone, type into the box below.</p>' +
      SECRETS.map(function (s, i) { return '<div class="hint ' + (has(s.id) ? 'done' : '') + '"><span class="n">' + (has(s.id) ? '✓' : i + 1) + '</span><span class="t">' + (has(s.id) ? s.name + ': ' : '') + esc(s.hint) + '</span></div>'; }).join('') +
      '<input class="typebox" id="typebox" placeholder="Type a secret word here" autocapitalize="off" autocomplete="off" spellcheck="false">' +
      '<button class="pill block" data-close style="margin-top:12px">Back to work</button>');
    var tb = $('typebox');
    tb.addEventListener('input', function () {
      var m = tb.value.toLowerCase().replace(/[^a-z]/g, '').match(/(janet|coys|traffic)$/);
      if (!m) return;
      $('sheet').hidden = true; tb.value = ''; buf = '';
      ({ janet: janetMode, coys: coys, traffic: traffic })[m[1]]();
    });
  };
  function finale() {
    var today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    sheet('<div class="cert"><h2>Certificate of Excellence</h2><div class="small">in Being Oli</div>' +
      '<div class="who">Oliver "Oli" Hoskins</div><div class="small" style="margin-top:-4px">AKA 4jin8</div><div class="small">has completed Ramvo: Oli Edition, found all 12 secrets and, against all odds, remains employed.</div>' +
      '<table><tr><td>Punctuality</td><td>2/10 (traffic)</td></tr><tr><td>Nutrition</td><td>Meal Deal/10</td></tr>' +
      '<tr><td>Questions asked</td><td>∞</td></tr><tr><td>Diving</td><td>Instructor</td></tr><tr><td>Spurs trophies witnessed</td><td>0 (not his fault)</td></tr>' +
      '<tr><td>Contract</td><td>Renewed (Jan vouched)</td></tr></table>' +
      '<div class="sig-line">Janet</div><div class="small">Coach Janet, Head of Recruitment (self-appointed) · ' + today + '</div></div>' +
      '<div class="coupon"><span class="eyebrow">Coupon</span><b>One free coffee at work</b><div>Made by Jan. Milk, two sweeteners.</div>' +
      '<div class="muted small" style="margin-top:6px">Valid until 31 January 2027 · Serial OLI-0001 · Not transferable · Void if the word "traffic" is used before 10:00</div></div>' +
      '<p class="muted small" style="text-align:center">Take a screenshot and show it to Jan to redeem.</p><button class="pill block" data-close>Back to work</button>');
    confetti(120);
  }
  $('finaleBtn').onclick = finale;
  $('mute').onclick = function () { S.mute = !S.mute; save(); side(); };
  $('reset').onclick = function () {
    sheet('<h3>Start over?</h3><p>You will lose ' + S.found.length + ' secrets and your hard-earned Oli Score.</p><button class="pill block" id="doReset">Yes, wipe it</button><button class="link" data-close style="display:block;margin:12px auto 0">No</button>');
    $('doReset').onclick = function () { try { localStorage.removeItem(KEY); } catch (e) {} location.href = location.pathname; };
  };

  // ------------------------------------------------------------------ boot
  function render() {
    side(); paintClock();
    document.body.classList.toggle('in-app', S.stage === 'app');
    if (S.stage !== 'app' && $('tabs')) $('tabs').remove();
    if (S.stage === 'login') renderLogin();
    else if (S.stage === 'quiz') renderQuiz();
    else renderApp();
  }
  setInterval(paintClock, 30000);
  bubbles(S.under && S.stage === 'app');
  render();
  // URL secret and the real Friday evening, once inside the app
  if (S.stage === 'app') {
    if (/[?&]tuesday\b/.test(location.search)) { found('contract'); S.tab = 'contract'; renderApp(); }
    var n = ukNow();
    if (n.weekday === 'Fri' && +n.hour >= 17) found('friday');
    if (isBirthday()) found('birthday');
  }

  // exposed for the test harness only
  window.__oli = { checkPassword: checkPassword, SECRETS: SECRETS, QUIZ: QUIZ };
})();
