/* Ramvo panel demo - a clickable replica of the trainer panel (admin.ramvo.app)
   built on a sanitized snapshot of the demo trainer account (snapshot.json,
   exported by alma_ross/scripts/demo/export-landing-snapshot.mjs).
   Nothing is sent anywhere: every change lives in memory and "Reset" restores
   the snapshot. Dates are shifted by whole weeks so the demo always looks current.

   RamvoDemo.mount(el, { start, tour, phone, mini, set, cycle, h, cta })
   RamvoDemo.setLang('pl' | 'en')                                              */
(function () {
  'use strict';

  var SCRIPT = document.currentScript;
  var BASE = SCRIPT ? SCRIPT.src.replace(/[^/]*$/, '') : '/assets/panel-demo/';
  var VER = SCRIPT && SCRIPT.src.indexOf('?') > 0 ? SCRIPT.src.slice(SCRIPT.src.indexOf('?')) : ''; // cache-busting, same version as the script
  var DAY = 86400000;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LANG = (function () {
    try { var q = new URLSearchParams(location.search).get('lang'); if (q === 'pl' || q === 'en') return q; } catch (e) {}
    try { var s = localStorage.getItem('ramvo-lang'); if (s === 'pl' || s === 'en') return s; } catch (e) {}
    return (navigator.language || '').toLowerCase().indexOf('pl') === 0 ? 'pl' : 'en';
  })();

  // ------------------------------------------------------------------ copy
  var TXT = {
    pl: {
      nav: { dashboard: 'Pulpit', clients: 'Klienci', plans: 'Plany treningowe', sessions: 'Sesje', messages: 'Wiadomości', budget: 'Budżet', profile: 'Mój profil' },
      grp: ['Przegląd', 'Programowanie', 'Ludzie', 'Biznes'], role: 'Trenerka personalna', reset: 'Od nowa', guide: 'Przewodnik',
      tour: { skip: 'Pomiń', next: 'Dalej', done: 'Zakończ', hint: 'Kliknij tutaj', free: 'Klikaj dowolnie. Zmiany znikają po odświeżeniu.', restart: 'Uruchom przewodnik',
        steps: [
          'To Twój pulpit: przychód, sesje i lista osób, które wymagają uwagi. Kliknij klienta na liście „Wymaga uwagi”.',
          'Karta klienta: waga, treningi z ostatnich tygodni i płatności. Kliknij „Napisz”, żeby odezwać się do klienta.',
          'Wiadomość czeka gotowa z szablonu. Wyślij ją i zobacz, co dzieje się na telefonie klienta.',
          'Biblioteka ćwiczeń: każde ma film techniki. Dodaj ćwiczenie do dnia treningowego.',
          'Zaznaczeni klienci dostaną plan od razu w aplikacji. Kliknij „Wyślij plan”.',
          'Klient dostał powiadomienie. Kliknij „Zacznij trening” na jego telefonie i zapisz serię.',
          'Kalendarz sesji. Przeciągnij sesję na inną godzinę albo kliknij tę oznaczoną „Potwierdź”.',
          'Klient nie przyszedł? „Nie był” od razu nalicza opłatę za nieobecność w Budżecie.',
          'Należności liczą się same z pakietów i sesji. Przy zaległości kliknij „Przypomnij”: klient dostaje push.',
          'Prognoza na 4 miesiące z tego, co już opłacone i zaplanowane. Przełącz na wariant „Z odnowieniami”.',
          'Tak widzą Cię klienci w wyszukiwarce trenerów. Zmień cenę pakietu i patrz na podgląd.',
          'To wszystko. Klikaj dalej sam: każdy moduł działa na danych z konta demo.'
        ] },
      pk: { full: 'Pełna subskrypcja', workout_only: 'Tylko treningi', meal_only: 'Tylko żywienie' },
      pks: { full: 'Pełna', workout_only: 'Treningi', meal_only: 'Żywienie' },
      st: { paid: 'Zapłacone', reported: 'Klient zgłosił wpłatę', overdue: 'Zaległe', open: 'Do zapłaty', waived: 'Umorzone', partial: 'Częściowo' },
      method: { transfer: 'Przelew', blik: 'BLIK', cash: 'Gotówka', card: 'Karta', other: 'Inna' },
      cat: { rent: 'Wynajem sali', equipment: 'Sprzęt', platform: 'Platforma', accounting: 'Księgowość', marketing: 'Marketing', software: 'Oprogramowanie', education: 'Szkolenia', hosting: 'Hosting', ai: 'AI', other: 'Inne' },
      muscle: { all: 'Wszystkie', legs: 'Nogi', back: 'Plecy', shoulders: 'Barki', core: 'Brzuch', chest: 'Klatka', arms: 'Ramiona', cardio: 'Cardio', mobility: 'Mobilność', glutes: 'Pośladki', full_body: 'Całe ciało', other: 'Inne' },
      due: { session: 'Sesja', no_show: 'Nieobecność na sesji', unconfirmed: 'Sesja (obecność niepotwierdzona)', late_cancel: 'Późne odwołanie', other: 'Inne' },
      today: 'dziś', yesterday: 'wczoraj', daysAgo: function (n) { return n + ' ' + pl(n, 'dzień', 'dni', 'dni') + ' temu'; }, hAgo: function (n) { return n + ' h temu'; }, now: 'teraz',
      dash: { title: 'Dzień dobry, Marta', sub: function (n) { return 'Masz dziś ' + n + ' ' + pl(n, 'sesję', 'sesje', 'sesji') + '. Oto, co dzieje się u Twoich klientów.'; },
        k: ['Aktywni klienci', 'Otrzymane w tym miesiącu', 'Sesje w tym tygodniu', 'Nieprzeczytane', 'Zaległości', 'Realizacja planów', 'Średnia ocena', 'Przychód miesięczny (MRR)'],
        ks: { newC: function (n) { return '+' + n + ' w tym miesiącu'; }, ofGoal: function (v) { return 'cel: ' + v; }, todayN: function (n) { return n + ' dziś'; }, conv: function (n) { return n + ' ' + pl(n, 'rozmowa', 'rozmowy', 'rozmów'); },
          dues: function (n) { return n + ' ' + pl(n, 'należność', 'należności', 'należności'); }, last14: 'ostatnie 14 dni', reviews: function (n) { return n + ' ' + pl(n, 'opinia', 'opinie', 'opinii'); }, fc: function (v) { return 'aktywne pakiety · ' + v; } },
        goal: 'Cel miesiąca', goalSub: 'Wpływy w tym miesiącu i prognoza do końca', fcEnd: 'Prognoza na koniec miesiąca', ofGoalPct: function (p) { return p + '% celu'; }, fcLink: 'Prognoza',
        attn: 'Wymaga uwagi', attnSub: 'Zanim ktoś zrezygnuje albo zapomni zapłacić', inactive: function (d) { return d + ' dni bez treningu'; }, overdue: function (v) { return 'zaległa płatność ' + v; },
        expiring: function (d) { return 'pakiet kończy się ' + d; }, unconf: 'sesja bez potwierdzonej obecności', none: 'Wszystko w porządku',
        act: 'Aktywność klientów', actSub: 'Na żywo z aplikacji', workout: 'trening ukończony', set: 'seria zapisana', paidRep: 'zgłoszono wpłatę', todayS: 'Dzisiejsze sesje', noToday: 'Brak sesji dziś' },
      cl: { title: 'Klienci', sub: function (n) { return n + ' aktywnych klientów'; }, all: 'Wszyscy', attn: 'Wymaga uwagi', search: 'Szukaj klienta…',
        th: ['Klient', 'Pakiet', 'Realizacja (14 dni)', 'Ostatni trening', 'Waga', 'Płatności'], ok: 'OK', rep: 'Zgłoszona wpłata', mealOnly: 'bez treningów', never: 'brak',
        since: function (d) { return 'klient od ' + d; }, perM: '/ mies.', kpi: ['Zmiana wagi', 'Treningi (28 dni)', 'Najdłuższa passa', 'Zapłacił łącznie'], days: 'dni',
        weight: 'Waga', target: 'cel', cal: 'Treningi: ostatnie 4 tygodnie', pay: 'Płatności', write: 'Napisz', sessions: 'Sesje', goals: 'Cele' },
      pl: { title: 'Plany treningowe', sub: 'Układasz raz, przypisujesz wielu klientom. Zmiany trafiają do aplikacji od razu.', lib: 'Biblioteka ćwiczeń', libSub: function (n) { return n + ' ćwiczeń z filmem techniki'; },
        search: 'Szukaj ćwiczenia…', add: 'Dodaj', added: 'Dodane', plan: 'Plan', day: 'Dzień', rest: 'przerwa', assign: 'Przypisz klientom', assignSub: 'Dostaną plan i powiadomienie w telefonie',
        send: function (n) { return 'Wyślij plan (' + n + ')'; }, sent: function (n) { return 'Wysłano do ' + n + ' ' + pl(n, 'klienta', 'klientów', 'klientów'); }, live: 'Aktywność na żywo', liveEmpty: 'Gdy klient zacznie trening, zobaczysz tu każdą serię.',
        toast: function (n) { return 'Plan wysłany: ' + n + ' ' + pl(n, 'klient dostał', 'klientów dostało', 'klientów dostało') + ' powiadomienie'; }, mealNote: 'tylko żywienie' },
      se: { title: 'Sesje', sub: 'Przeciągnij sesję, żeby zmienić termin. Klient dostaje powiadomienie.', thisWeek: 'Ten tydzień', gym: 'Siłownia', online: 'Online',
        k: ['Sesje w tygodniu', 'Przychód z sesji', 'Frekwencja', 'Do potwierdzenia'], ks: ['potwierdzone', 'w tym tygodniu', 'ostatnie 3 tygodnie', 'kliknij sesję'],
        confirm: 'Potwierdź', when: 'Termin', type: 'Rodzaj', price: 'Cena', series: 'Seria cotygodniowa', note: 'Notatka', meet: 'Google Meet', meetSub: 'Link dodany do wydarzenia w kalendarzu', join: 'Dołącz',
        meetToast: 'W panelu otwiera się spotkanie Google Meet', att: 'Obecność', was: 'Był', wasNot: 'Nie był', attended: 'Obecny', noShow: 'Nieobecny', cancelled: 'Odwołana', future: 'Zaplanowana',
        attToast: function (v) { return 'Obecność potwierdzona. Należność ' + v + ' dodana do Budżetu'; }, noShowToast: function (p, v) { return 'Nieobecność: ' + p + '% ceny (' + v + ') dodane do należności'; },
        moved: function (d) { return 'Przeniesiono na ' + d + '. Klient dostał powiadomienie'; }, dragHint: 'Przeciągnij w kalendarzu, żeby zmienić termin', pushT: 'Zmiana terminu sesji' },
      ms: { title: 'Wiadomości', sub: 'Czat z klientami w aplikacji, z szablonami i potwierdzeniem odczytu.', type: 'Napisz wiadomość…', send: 'Wyślij', read: 'Przeczytane', delivered: 'Dostarczone',
        tpl: 'Szablony', ctx: 'O kliencie', next: 'Najbliższa sesja', none: 'brak', dues: 'Do zapłaty', comp: 'Realizacja planu', replies: ['Dzięki! 💪', 'Super, dam znać po treningu!', 'Jasne, zrobione 👍', 'Dziękuję, do zobaczenia!'] },
      bu: { title: 'Budżet', sub: 'Należności liczą się same z pakietów i sesji. Ty tylko potwierdzasz wpłaty.', tabs: ['Przegląd', 'Należności i płatności', 'Koszty', 'Prognoza'],
        k: ['Otrzymane', 'Do zapłaty', 'Zaległe', 'Zysk w tym miesiącu'], ks: { goal: function (v) { return 'cel ' + v; }, upcoming: 'w najbliższych dniach', overdue: function (n) { return n + ' po terminie'; }, costs: function (v) { return 'koszty ' + v; } },
        chart: 'Ostatnie 6 miesięcy', recv: 'Otrzymane', costs: 'Koszty', methods: 'Metody płatności', todo: 'Do działania', all: 'Wszystkie', remind: 'Przypomnij', reminded: 'Przypomniano', paid: 'Opłacone', confirm: 'Potwierdź wpłatę',
        recent: 'Ostatnie wpłaty', due: 'termin', remToast: function (n) { return 'Przypomnienie wysłane: ' + n; }, paidToast: function (v) { return 'Zapisano wpłatę ' + v + '. Cel miesiąca zaktualizowany'; },
        pushT: 'Przypomnienie o płatności', pushB: function (v, d) { return v + ' do zapłaty, termin ' + d + '. Szczegóły w aplikacji.'; },
        costsMonth: function (m) { return 'Koszty: ' + m; }, monthly: 'co miesiąc', once: 'jednorazowo', total: 'Razem', nextMonth: function (m) { return 'Prognoza na ' + m; }, nextSub: 'stałe koszty miesięczne', byCat: 'Według kategorii',
        fc: { sure: 'Pewne', renew: function (p) { return 'Z odnowieniami (' + p + '%)'; }, rateNote: function (p, n) { return n >= 3 ? 'odnowienia: ' + p + '% na podstawie ' + n + ' pakietów' : 'odnowienia: domyślnie ' + p + '%'; },
          income: 'Przychód', profit: 'Zysk', src: { paid: 'Zapłacone', due: 'Do zapłaty', planned: 'Zaplanowane', renewal: 'Odnowienia' }, goal: 'cel', risks: 'Ryzyka', risksSub: 'Pakiety kończące się w tym miesiącu',
          renewMsg: 'Napisz o przedłużeniu', noRisk: 'Brak kończących się pakietów', lines: 'Wpływy', costs: 'Koszty', cur: 'bieżący',
          draft: function (n, d) { return 'Cześć ' + n + '! Twój pakiet kończy się ' + d + '. Działamy dalej w tym samym trybie? Daj znać, przedłużę go w aplikacji 💪'; } } },
      pr: { title: 'Mój profil', sub: 'Profil publiczny w wyszukiwarce trenerów i Twój cennik.', pub: 'Profil publiczny', bio: 'O mnie', tags: 'Specjalizacje', prices: 'Cennik',
        pricesSub: 'Klient wybiera pakiet przy zapisie. Ceny sesji dotyczą 60 min. Krótsze i dłuższe sesje skalują się same.', session: { online: 'Sesja online (60 min)', gym: 'Sesja na siłowni (60 min)' },
        preview: 'Tak widzi Cię klient', from: 'od', perM: '/ mies.', reviews: function (n) { return n + ' ' + pl(n, 'opinia', 'opinie', 'opinii'); }, years: function (n) { return n + ' lat doświadczenia'; },
        reply: 'Odpowiedź trenera', complete: 'Profil uzupełniony', pkgs: 'Pakiety', sessions: 'Sesje 1:1', choose: 'Wybierz pakiet' },
      ph: { hi: function (n) { return 'Cześć, ' + n; }, plan: 'Twój plan', newPlan: 'Nowy plan od trenera', start: 'Zacznij trening', todayW: 'Dzisiejszy trening', streak: 'najdłuższa passa',
        next: 'Najbliższa sesja', pay: 'Do zapłaty', payBtn: 'Zapłać', paidBtn: 'Zapłaciłem', allPaid: 'Wszystko opłacone', reported: 'Wpłata zgłoszona trenerowi', transfer: 'Przelew na konto trenera', blik: 'BLIK na telefon',
        tabs: ['Start', 'Trening', 'Czat', 'Płatności'], set: 'Seria', logSet: 'Zapisz serię', done: 'Ćwiczenie ukończone', tech: 'Technika', chatEmpty: 'Napisz do trenera', label: 'Telefon klienta',
        pushPlan: function (t) { return t + ' czeka w aplikacji.'; }, repToast: function (n, v) { return n + ': wpłata ' + v + ' zgłoszona. Potwierdź ją w Budżecie'; } },
      mob: 'Na telefonie pokazujemy uproszczony podgląd. Pełne demo z telefonem klienta otworzysz na komputerze.'
    },
    en: {
      nav: { dashboard: 'Dashboard', clients: 'Clients', plans: 'Workout plans', sessions: 'Sessions', messages: 'Messages', budget: 'Budget', profile: 'My profile' },
      grp: ['Overview', 'Programming', 'People', 'Business'], role: 'Personal trainer', reset: 'Reset', guide: 'Guided tour',
      tour: { skip: 'Skip', next: 'Next', done: 'Finish', hint: 'Click here', free: 'Click around freely. Changes disappear on refresh.', restart: 'Start the tour',
        steps: [
          'This is your dashboard: income, sessions and the people who need attention. Click a client in "Needs attention".',
          'The client card: weight, recent workouts and payments. Click "Message" to reach out.',
          'A message is ready from a template. Send it and watch the client\'s phone.',
          'The exercise library: every exercise has a form video. Add one to the training day.',
          'The ticked clients get the plan in the app straight away. Click "Send plan".',
          'The client got a notification. Tap "Start workout" on their phone and log a set.',
          'The session calendar. Drag a session to another time, or click the one marked "Confirm".',
          'Client didn\'t show up? "No-show" adds the no-show fee to your Budget at once.',
          'Dues are created from packages and sessions automatically. On an overdue one click "Remind": the client gets a push.',
          'A 4-month forecast from what is already paid and planned. Switch to "With renewals".',
          'This is how clients see you in the trainer search. Change a package price and watch the preview.',
          'That\'s it. Keep clicking on your own: every module runs on the demo account\'s data.'
        ] },
      pk: { full: 'Full subscription', workout_only: 'Workouts only', meal_only: 'Nutrition only' },
      pks: { full: 'Full', workout_only: 'Workouts', meal_only: 'Nutrition' },
      st: { paid: 'Paid', reported: 'Client reported payment', overdue: 'Overdue', open: 'Due', waived: 'Written off', partial: 'Partial' },
      method: { transfer: 'Transfer', blik: 'BLIK', cash: 'Cash', card: 'Card', other: 'Other' },
      cat: { rent: 'Gym rent', equipment: 'Equipment', platform: 'Platform', accounting: 'Accounting', marketing: 'Marketing', software: 'Software', education: 'Courses', hosting: 'Hosting', ai: 'AI', other: 'Other' },
      muscle: { all: 'All', legs: 'Legs', back: 'Back', shoulders: 'Shoulders', core: 'Core', chest: 'Chest', arms: 'Arms', cardio: 'Cardio', mobility: 'Mobility', glutes: 'Glutes', full_body: 'Full body', other: 'Other' },
      due: { session: 'Session', no_show: 'Session no-show', unconfirmed: 'Session (attendance not confirmed)', late_cancel: 'Late cancellation', other: 'Other' },
      today: 'today', yesterday: 'yesterday', daysAgo: function (n) { return n + ' days ago'; }, hAgo: function (n) { return n + ' h ago'; }, now: 'now',
      dash: { title: 'Good morning, Marta', sub: function (n) { return 'You have ' + n + ' session' + (n === 1 ? '' : 's') + ' today. Here is what your clients are up to.'; },
        k: ['Active clients', 'Received this month', 'Sessions this week', 'Unread', 'Overdue', 'Plan completion', 'Average rating', 'Monthly revenue (MRR)'],
        ks: { newC: function (n) { return '+' + n + ' this month'; }, ofGoal: function (v) { return 'goal: ' + v; }, todayN: function (n) { return n + ' today'; }, conv: function (n) { return n + ' conversation' + (n === 1 ? '' : 's'); },
          dues: function (n) { return n + ' due' + (n === 1 ? '' : 's'); }, last14: 'last 14 days', reviews: function (n) { return n + ' review' + (n === 1 ? '' : 's'); }, fc: function (v) { return 'active packages · ' + v; } },
        goal: 'Monthly goal', goalSub: 'Money in this month and the forecast to month end', fcEnd: 'Month-end forecast', ofGoalPct: function (p) { return p + '% of goal'; }, fcLink: 'Forecast',
        attn: 'Needs attention', attnSub: 'Before someone quits or forgets to pay', inactive: function (d) { return d + ' days without a workout'; }, overdue: function (v) { return 'overdue payment ' + v; },
        expiring: function (d) { return 'package ends ' + d; }, unconf: 'session attendance not confirmed', none: 'All good',
        act: 'Client activity', actSub: 'Live from the app', workout: 'workout completed', set: 'set logged', paidRep: 'payment reported', todayS: 'Today\'s sessions', noToday: 'No sessions today' },
      cl: { title: 'Clients', sub: function (n) { return n + ' active clients'; }, all: 'All', attn: 'Needs attention', search: 'Search clients…',
        th: ['Client', 'Package', 'Completion (14 days)', 'Last workout', 'Weight', 'Payments'], ok: 'OK', rep: 'Payment reported', mealOnly: 'no workouts', never: 'none',
        since: function (d) { return 'client since ' + d; }, perM: '/ month', kpi: ['Weight change', 'Workouts (28 days)', 'Longest streak', 'Paid in total'], days: 'days',
        weight: 'Weight', target: 'goal', cal: 'Workouts: last 4 weeks', pay: 'Payments', write: 'Message', sessions: 'Sessions', goals: 'Goals' },
      pl: { title: 'Workout plans', sub: 'Build once, assign to many clients. Changes reach the app instantly.', lib: 'Exercise library', libSub: function (n) { return n + ' exercises with form videos'; },
        search: 'Search exercises…', add: 'Add', added: 'Added', plan: 'Plan', day: 'Day', rest: 'rest', assign: 'Assign to clients', assignSub: 'They get the plan and a push notification',
        send: function (n) { return 'Send plan (' + n + ')'; }, sent: function (n) { return 'Sent to ' + n + ' client' + (n === 1 ? '' : 's'); }, live: 'Live activity', liveEmpty: 'When a client starts the workout you will see every set here.',
        toast: function (n) { return 'Plan sent: ' + n + ' client' + (n === 1 ? '' : 's') + ' notified'; }, mealNote: 'nutrition only' },
      se: { title: 'Sessions', sub: 'Drag a session to reschedule it. The client gets a notification.', thisWeek: 'This week', gym: 'Gym', online: 'Online',
        k: ['Sessions this week', 'Session revenue', 'Attendance', 'To confirm'], ks: ['confirmed', 'this week', 'last 3 weeks', 'click a session'],
        confirm: 'Confirm', when: 'When', type: 'Type', price: 'Price', series: 'Weekly series', note: 'Note', meet: 'Google Meet', meetSub: 'Link added to the calendar event', join: 'Join',
        meetToast: 'The panel opens the Google Meet call', att: 'Attendance', was: 'Attended', wasNot: 'No-show', attended: 'Attended', noShow: 'No-show', cancelled: 'Cancelled', future: 'Scheduled',
        attToast: function (v) { return 'Attendance confirmed. A ' + v + ' due was added to Budget'; }, noShowToast: function (p, v) { return 'No-show: ' + p + '% of the price (' + v + ') added to dues'; },
        moved: function (d) { return 'Moved to ' + d + '. The client got a notification'; }, dragHint: 'Drag it in the calendar to reschedule', pushT: 'Session rescheduled' },
      ms: { title: 'Messages', sub: 'In-app chat with your clients, with templates and read receipts.', type: 'Write a message…', send: 'Send', read: 'Read', delivered: 'Delivered',
        tpl: 'Templates', ctx: 'About the client', next: 'Next session', none: 'none', dues: 'Due', comp: 'Plan completion', replies: ['Thanks! 💪', 'Great, I\'ll report back after the workout!', 'Sure, done 👍', 'Thank you, see you!'] },
      bu: { title: 'Budget', sub: 'Dues are created from packages and sessions automatically. You only confirm payments.', tabs: ['Overview', 'Dues & payments', 'Costs', 'Forecast'],
        k: ['Received', 'Due', 'Overdue', 'Profit this month'], ks: { goal: function (v) { return 'goal ' + v; }, upcoming: 'in the coming days', overdue: function (n) { return n + ' past due'; }, costs: function (v) { return 'costs ' + v; } },
        chart: 'Last 6 months', recv: 'Received', costs: 'Costs', methods: 'Payment methods', todo: 'To act on', all: 'All', remind: 'Remind', reminded: 'Reminded', paid: 'Paid', confirm: 'Confirm payment',
        recent: 'Recent payments', due: 'due', remToast: function (n) { return 'Reminder sent: ' + n; }, paidToast: function (v) { return 'Payment of ' + v + ' recorded. Monthly goal updated'; },
        pushT: 'Payment reminder', pushB: function (v, d) { return v + ' due on ' + d + '. Details in the app.'; },
        costsMonth: function (m) { return 'Costs: ' + m; }, monthly: 'monthly', once: 'one-off', total: 'Total', nextMonth: function (m) { return 'Forecast for ' + m; }, nextSub: 'fixed monthly costs', byCat: 'By category',
        fc: { sure: 'Certain', renew: function (p) { return 'With renewals (' + p + '%)'; }, rateNote: function (p, n) { return n >= 3 ? 'renewals: ' + p + '% based on ' + n + ' packages' : 'renewals: default ' + p + '%'; },
          income: 'Income', profit: 'Profit', src: { paid: 'Paid', due: 'Due', planned: 'Planned', renewal: 'Renewals' }, goal: 'goal', risks: 'Risks', risksSub: 'Packages ending this month',
          renewMsg: 'Message about renewing', noRisk: 'No packages ending', lines: 'Money in', costs: 'Costs', cur: 'current',
          draft: function (n, d) { return 'Hi ' + n + '! Your package ends on ' + d + '. Shall we carry on the same way? Let me know and I\'ll renew it in the app 💪'; } } },
      pr: { title: 'My profile', sub: 'Your public profile in the trainer search, and your prices.', pub: 'Public profile', bio: 'About me', tags: 'Specialisations', prices: 'Prices',
        pricesSub: 'Clients pick a package when they sign up. Session prices are per 60 min; shorter and longer sessions scale automatically.', session: { online: 'Online session (60 min)', gym: 'Gym session (60 min)' },
        preview: 'What clients see', from: 'from', perM: '/ month', reviews: function (n) { return n + ' review' + (n === 1 ? '' : 's'); }, years: function (n) { return n + ' years of experience'; },
        reply: 'Trainer\'s reply', complete: 'Profile complete', pkgs: 'Packages', sessions: '1:1 sessions', choose: 'Choose a package' },
      ph: { hi: function (n) { return 'Hi, ' + n; }, plan: 'Your plan', newPlan: 'New plan from your trainer', start: 'Start workout', todayW: 'Today\'s workout', streak: 'longest streak',
        next: 'Next session', pay: 'To pay', payBtn: 'Pay', paidBtn: 'I\'ve paid', allPaid: 'All paid', reported: 'Payment reported to your trainer', transfer: 'Bank transfer to your trainer', blik: 'BLIK to phone',
        tabs: ['Home', 'Workout', 'Chat', 'Payments'], set: 'Set', logSet: 'Log set', done: 'Exercise complete', tech: 'Technique', chatEmpty: 'Message your trainer', label: 'Client\'s phone',
        pushPlan: function (t) { return t + ' is waiting in the app.'; }, repToast: function (n, v) { return n + ': payment of ' + v + ' reported. Confirm it in Budget'; } },
      mob: 'On phones we show a simplified view. Open the full demo with the client\'s phone on a computer.'
    }
  };
  function pl(n, one, few, many) {
    n = Math.abs(n);
    if (n === 1) return one;
    var t = n % 10, h = n % 100;
    return t >= 2 && t <= 4 && (h < 12 || h > 14) ? few : many;
  }

  // ------------------------------------------------------------------ icons (lucide paths)
  var IC = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    plans: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.66 21.51a2 2 0 1 1-2.83-2.83l-1.77 1.77a2 2 0 1 1-2.83-2.83l6.37-6.37a2 2 0 1 1 2.83 2.83l1.77-1.77a2 2 0 1 1 2.83 2.83z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.4 12.77a2 2 0 1 1-2.83-2.83l1.77-1.77a2 2 0 1 1-2.83-2.83l2.83-2.83a2 2 0 1 1 2.83 2.83l1.77-1.77a2 2 0 1 1 2.83 2.83z"/>',
    sessions: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    messages: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    budget: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
    profile: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', checks: '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    video: '<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>', star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>', left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', wallet: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', play: '<path d="m6 3 14 9-14 9z"/>', pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }

  // ------------------------------------------------------------------ dates / numbers
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function localIso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addD(iso, n) { return new Date(Date.parse(iso.slice(0, 10) + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10); }
  function diffD(a, b) { return Math.round((Date.parse(a.slice(0, 10) + 'T00:00:00Z') - Date.parse(b.slice(0, 10) + 'T00:00:00Z')) / DAY); }
  function monthAdd(iso, n) { var y = +iso.slice(0, 4), m = +iso.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + '-' + pad(m + 1) + '-01'; }
  function monthEnd(ms) { return addD(monthAdd(ms, 1), -1); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  // Demo data is Polish; with EN selected, known strings come from en.json.
  var EN = {};
  function escA(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function esc(s) { if (LANG === 'en' && typeof s === 'string' && EN[s]) s = EN[s]; return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sum(a, f) { var s = 0; for (var i = 0; i < a.length; i++) s += Number(f ? f(a[i]) : a[i]) || 0; return s; }
  function grp(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, LANG === 'pl' ? ' ' : ','); }
  // Currency follows the language: PL shows zł, EN shows £ converted at a
  // fixed display rate (demo data is stored in PLN).
  var PLN_PER_GBP = 5;
  function cv(n) { return LANG === 'en' ? Number(n) / PLN_PER_GBP : Number(n); }
  function cvBack(n) { return LANG === 'en' ? Number(n) * PLN_PER_GBP : Number(n); }
  function CUR() { return LANG === 'en' ? '£' : 'zł'; }
  function zl(n) { return LANG === 'en' ? '£' + grp(cv(n)) : grp(n) + ' zł'; }
  function loc() { return LANG === 'pl' ? 'pl-PL' : 'en-GB'; }
  function fD(iso) { return new Intl.DateTimeFormat(loc(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(iso.slice(0, 10) + 'T00:00:00Z')); }
  function fWD(iso) { return new Intl.DateTimeFormat(loc(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(iso.slice(0, 10) + 'T00:00:00Z')); }
  function fMonth(ms, short) { return new Intl.DateTimeFormat(loc(), { month: short ? 'short' : 'long', timeZone: 'UTC' }).format(new Date(ms.slice(0, 7) + '-01T00:00:00Z')); }
  function fT(ts) { return new Intl.DateTimeFormat(loc(), { hour: '2-digit', minute: '2-digit' }).format(new Date(ts)); }
  function wall(ts) { var d = new Date(ts); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); } // bookings keep wall-clock time in UTC
  function nowWall() { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()); }
  function dec(n, d) { var s = (Math.round(n * Math.pow(10, d || 1)) / Math.pow(10, d || 1)).toFixed(d == null ? 1 : d); return LANG === 'pl' ? s.replace('.', ',') : s; }

  // ------------------------------------------------------------------ snapshot
  var SNAP = null, loading = null;
  function load() {
    if (!loading) loading = Promise.all([
      fetch(BASE + 'snapshot.json' + VER).then(function (r) { if (!r.ok) throw new Error('snapshot ' + r.status); return r.json(); }),
      fetch(BASE + 'en.json' + VER).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ]).then(function (res) { EN = res[1] || {}; SNAP = prepare(res[0]); return SNAP; });
    return loading;
  }
  // Shift every date by whole weeks (weekdays stay put) so "today" in the data is today.
  function prepare(raw) {
    var today = localIso(new Date());
    var days = Math.max(0, Math.floor(diffD(today, raw.exportedOn) / 7) * 7);
    var md = (function () { var a = raw.exportedOn, b = addD(a, days); return (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7)); })();
    function walk(v, k) {
      if (Array.isArray(v)) return v.map(function (x) { return walk(x, k); });
      if (v && typeof v === 'object') { var o = {}; for (var kk in v) o[kk] = walk(v[kk], kk); return o; }
      if (typeof v === 'string') {
        if (k === 'month' && /^\d{4}-\d{2}-01$/.test(v)) return monthAdd(v, md);
        if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(Date.parse(v) + days * DAY).toISOString();
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return addD(v, days);
      }
      return v;
    }
    var s = walk(raw, '');
    var COL = ['#3ec6ff', '#ff4d8d', '#35d483', '#ffb020', '#ff7a45', '#a78bfa', '#5eead4', '#f472b6', '#facc15', '#60a5fa', '#c084fc', '#f4f6f8'];
    s.clients.forEach(function (c, i) { c.color = COL[i % COL.length]; c.ini = c.name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2); c.first = c.name.split(' ')[0]; });
    s.C = {}; s.clients.forEach(function (c) { s.C[c.id] = c; });
    s.E = {}; s.library.forEach(function (e) { s.E[e.id] = e; });
    return s;
  }

  // ------------------------------------------------------------------ instance
  var instances = [];
  function Demo(el, opts) {
    this.el = el; this.o = opts || {}; this.timers = [];
    el.classList.add('rd');
    if (this.o.mini) el.classList.add('mini');
    if (this.o.mini || this.o.phone === false) el.classList.add('nophone');
    if (this.o.phoneOnly) el.classList.add('phone-only');
    this.reset(true);
    this.bind();
    this.render();
    if (this.o.phoneOnly && this.o.screens && !reduceMotion) this.startScreens();
    if (this.o.cycle && !reduceMotion) this.startCycle();
  }
  var D = Demo.prototype;
  D.t = function () { return TXT[LANG]; };

  D.reset = function (first) {
    var S = SNAP, self = this;
    this.timers.forEach(clearTimeout); this.timers = [];
    var kasia = S.clients.filter(function (c) { return /^Kasia/.test(c.name); })[0] || S.clients.filter(function (c) { return c.plan === 'full'; })[0] || S.clients[0];
    var p0 = S.plans[0] || { clients: [], days: [] };
    this.st = {
      mod: this.o.start || 'dashboard', client: null, cfilter: 'all', csearch: '',
      muscle: 'all', lsearch: '', plan: 0, day: 0, added: {}, sel: p0.clients.filter(function (c) { return S.C[c] && S.C[c].plan !== 'meal_only'; }), sent: false,
      sessions: clone(S.sessions).map(function (x, i) { x.id = 's' + i; return x; }), week: 0, sess: null,
      threads: clone(S.threads), thread: S.threads[0] ? S.threads[0].c : null, draft: '', typing: null,
      dues: clone(S.budget.dues).map(function (d, i) { d.id = 'd' + i; return d; }), payments: clone(S.budget.payments), btab: 0, dfilter: 'todo', fcVar: 'sure', fcM: 0,
      prof: { prices: clone(S.trainer.prices), bio: S.trainer.bio, tags: S.trainer.tags.slice(), photo: 0, flash: false },
      phone: { who: kasia.id, screen: 'home', push: null, plan: false, sets: 0 },
      feed: [], toast: null, tour: this.o.tour ? 0 : -1
    };
    if (this.o.set) for (var k in this.o.set) this.st[k] = this.o.set[k];
    if (this.o.set && this.o.set.client === 'auto') this.st.client = kasia.id;
    if (this.o.who) this.st.phone.who = this.o.who === 'auto' ? kasia.id : this.o.who;
    if (this.st.tour >= 0) this.tourEnter();
    if (!first) this.render();
    void self;
  };

  D.later = function (ms, fn) { var self = this; this.timers.push(setTimeout(function () { fn.call(self); }, ms)); };
  D.toast = function (text, kind) {
    var id = Math.random();
    this.st.toast = { text: text, kind: kind || 'ok', id: id };
    this.later(3400, function () { if (this.st.toast && this.st.toast.id === id) { this.st.toast = null; this.paintToast(); } });
  };
  D.push = function (who, title, body) {
    var ph = this.el.querySelector('.rd-phw');
    var visible = ph && ph.offsetParent !== null;
    var id = Math.random();
    this.st.phone.who = who;
    this.st.phone.push = { title: title, body: body, id: id };
    if (!visible && !this.o.mini && !this.o.phoneOnly) this.toast(title + ': ' + body, 'info');
    this.later(4600, function () { if (this.st.phone.push && this.st.phone.push.id === id) { this.st.phone.push = null; this.paintPhone(); } });
  };

  // ------------------------------------------------------------------ derived data
  D.today = function () { return localIso(new Date()); };
  D.left = function (d) { return Math.max(0, Number(d.amount_pln) - Number(d.discount_pln || 0) - Number(d.paid_pln || 0)); };
  D.dueState = function (d) {
    if (d.status === 'paid' || d.status === 'waived') return d.status;
    if (d.status === 'reported') return 'reported';
    return d.due_date < this.today() ? 'overdue' : 'open';
  };
  D.overdue = function () { var self = this; return this.st.dues.filter(function (d) { return self.dueState(d) === 'overdue' && self.left(d) > 0; }); };
  D.received = function (ms) { ms = (ms || this.today()).slice(0, 7); return sum(this.st.payments.filter(function (p) { return p.paid_on.slice(0, 7) === ms; }), function (p) { return p.amount_pln; }); };
  D.costsIn = function (ms) {
    var me = monthEnd(ms);
    return SNAP.budget.expenses.filter(function (e) {
      return e.recurring === 'monthly' ? e.spent_on <= me && (!e.ends_on || e.ends_on >= ms) : e.spent_on >= ms && e.spent_on <= me;
    });
  };
  D.planOf = function (cid) { return SNAP.plans.filter(function (p) { return p.clients.indexOf(cid) >= 0; })[0] || null; };
  D.done = function (c, days) { var from = addD(this.today(), -(days - 1)); return c.workoutDays.filter(function (d) { return d >= from; }).length; };
  D.comp = function (c) {
    if (c.plan === 'meal_only') return null;
    var p = this.planOf(c.id), exp = (p ? p.days.length : 3) * 2;
    return Math.min(100, Math.round((this.done(c, 14) / exp) * 100));
  };
  D.lastDays = function (c) { var last = c.workoutDays[c.workoutDays.length - 1]; return last ? diffD(this.today(), last) : null; };
  D.ago = function (iso) {
    var t = this.t(), d = diffD(this.today(), localIso(new Date(iso)));
    if (iso.length > 10 && d === 0) { var h = Math.round((Date.now() - Date.parse(iso)) / 3600000); return h < 1 ? t.now : t.hAgo(h); }
    return d <= 0 ? t.today : d === 1 ? t.yesterday : t.daysAgo(d);
  };
  D.unread = function () {
    return this.st.threads.filter(function (th) { var m = th.msgs[th.msgs.length - 1]; return m && !m.me && (!th.trainerRead || m.at > th.trainerRead); });
  };
  D.weekDays = function (off) {
    var td = this.today(), wd = (new Date(td + 'T00:00:00Z').getUTCDay() + 6) % 7, mon = addD(td, -wd + (off || 0) * 7), out = [];
    for (var i = 0; i < 7; i++) out.push(addD(mon, i));
    return out;
  };
  D.isPast = function (s) { return Date.parse(s.end) < nowWall(); };
  D.unconfirmed = function () { var self = this; return this.st.sessions.filter(function (s) { return s.status === 'confirmed' && !s.att && self.isPast(s); }); };
  D.dueTitle = function (d) {
    var t = this.t();
    if (d.kind === 'subscription') return t.pk[d.plan_slug || 'full'] + (d.period_start ? ' · ' + fD(d.period_start) + '–' + fD(d.period_end || d.period_start) : '');
    if (d.kind === 'session') return d.description === 'no_show' ? t.due.no_show : d.description === 'unconfirmed' ? t.due.unconfirmed : t.due.session;
    if (d.kind === 'late_cancel') return t.due.late_cancel;
    return d.description || t.due.other;
  };
  D.rate = function () { var f = SNAP.budget.forecast; return f.renewal_rate != null && f.renewal_sample >= 3 ? Number(f.renewal_rate) : 0.8; };
  D.fcIncome = function (m, variant) {
    var r = this.rate(), out = { paid: 0, due: 0, planned: 0, renewal: 0 };
    m.income.forEach(function (l) { out[l.source] = (out[l.source] || 0) + Number(l.amount) * (l.source === 'renewal' ? r : 1); });
    if (variant !== 'renew') out.renewal = 0;
    out.total = out.paid + out.due + out.planned + out.renewal;
    out.costs = sum(m.costs, function (c) { return c.amount; });
    return out;
  };
  D.monthForecast = function () {
    // live: paid this month (incl. what was marked paid in the demo) + still expected
    var m = SNAP.budget.forecast.months[0], f = this.fcIncome(m, 'sure');
    var recv = this.received();
    return { received: recv, total: Math.max(f.total, recv + f.due + f.planned), costs: f.costs };
  };

  // ------------------------------------------------------------------ small renderers
  function av(c, cls) { return c ? '<span class="rd-av ' + (cls || '') + '" style="background:' + c.color + '">' + esc(c.ini) + '</span>' : ''; }
  function tag(text, cls) { return '<span class="rd-tag ' + (cls || '') + '">' + text + '</span>'; }
  function pkgTag(slug, t) { return slug ? tag(t.pks[slug], slug === 'full' ? 'cy' : slug === 'workout_only' ? 'mg' : 'ok') : ''; }
  function kpi(o) {
    var spark = '';
    if (o.spark && o.spark.length > 1) {
      var mx = Math.max.apply(null, o.spark), mn = Math.min.apply(null, o.spark), rg = mx - mn || 1;
      var pts = o.spark.map(function (v, i) { return (i * 100 / (o.spark.length - 1)).toFixed(1) + ',' + (24 - ((v - mn) / rg) * 20).toFixed(1); }).join(' ');
      spark = '<svg class="spark" viewBox="0 0 100 26" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="' + o.color + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
    }
    var tagName = o.a ? 'button type="button" data-a="' + o.a + '" data-v="' + (o.v || '') + '"' : 'div';
    return '<' + tagName + ' class="rd-kpi"' + (o.tour ? ' data-tour="' + o.tour + '"' : '') + '><div class="l"><i style="background:' + o.color + '1f;color:' + o.color + '">' + ic(o.icon) + '</i>' + esc(o.label) + '</div>' +
      '<div class="v">' + (o.unit === '£' ? '<small>£</small>' : '') + '<span class="num" data-count="' + (o.count != null ? o.count : '') + '">' + o.value + '</span>' + (o.unit && o.unit !== '£' ? '<small>' + o.unit + '</small>' : '') + '</div><div class="s">' + (o.sub || '') + '</div>' + spark + '</' + (o.a ? 'button' : 'div') + '>';
  }
  function card(title, body, opt) {
    opt = opt || {};
    return '<section class="rd-card ' + (opt.cls || '') + '"' + (opt.tour ? ' data-tour="' + opt.tour + '"' : '') + '><header><div><h4>' + (opt.icon ? ic(opt.icon) : '') + title + '</h4>' + (opt.sub ? '<small>' + opt.sub + '</small>' : '') + '</div>' + (opt.action || '') + '</header>' + body + '</section>';
  }
  function bar(segs) { return '<div class="rd-barb">' + segs.map(function (s) { return '<i style="width:' + Math.max(0, Math.min(100, s[0])).toFixed(1) + '%;background:' + s[1] + '"></i>'; }).join('') + '</div>'; }
  function head(title, sub, action) { return '<div class="rd-h"><div><h3>' + title + '</h3>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (action || '') + '</div>'; }

  // ------------------------------------------------------------------ frame
  D.render = function () {
    var t = this.t(), st = this.st, self = this;
    if (this.o.phoneOnly) {
      if (!this.frame) { this.el.innerHTML = '<div class="rd-phw"><div class="rd-phone"><div class="rd-scr"></div></div></div>'; this.frame = true; }
      this.paintPhone(); return;
    }
    if (!this.frame) {
      this.el.innerHTML = '<div class="rd-tourbar"></div><div class="rd-stage"><div class="rd-win" style="position:relative"><div class="rd-bar"><i></i><i></i><i></i><span class="url"></span><span class="rd-baracts" style="margin-left:auto;display:flex;gap:2px"></span></div>' +
        '<div class="rd-app" style="position:relative"><nav class="rd-side"></nav><div class="rd-main"></div><div class="rd-pan"></div></div><div class="rd-toastw"></div></div>' +
        '<div class="rd-phw"><div class="rd-phone"><div class="rd-scr"></div></div><p class="rd-note"></p></div></div><p class="rd-note rd-mob"></p>';
      if (this.o.h) this.el.style.setProperty('--rd-h', this.o.h);
      if (this.o.mini) {
        var stage = this.el.querySelector('.rd-stage');
        var clip = document.createElement('div'); clip.className = 'rd-clip';
        var sc = document.createElement('div'); sc.className = 'rd-scale';
        stage.parentNode.insertBefore(clip, stage); clip.appendChild(sc); sc.appendChild(stage);
        this.el.setAttribute('aria-hidden', 'true'); this.el.inert = true;
        this.fit();
        if ('ResizeObserver' in window) new ResizeObserver(function () { self.fit(); }).observe(this.el);
      }
      this.frame = true;
      this.mainEl = this.el.querySelector('.rd-main');
      if ('ResizeObserver' in window) { var rt; new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(function () { self.drawLater(); self.placeHint(); }, 120); }).observe(this.mainEl); }
      this.mainEl.addEventListener('scroll', function () { self.placeHint(); }, { passive: true });
    }
    var main = this.mainEl, prevMod = this.lastMod, keep = main.scrollTop;
    var focus = document.activeElement && this.el.contains(document.activeElement) && document.activeElement.getAttribute('data-in') ? { k: document.activeElement.getAttribute('data-in'), v: document.activeElement.getAttribute('data-v') || '', s: document.activeElement.selectionStart, e: document.activeElement.selectionEnd } : null;

    this.el.querySelector('.url').textContent = 'admin.ramvo.app/' + ({ dashboard: '', clients: 'users', plans: 'workout-plans', sessions: 'bookings', messages: 'messages', budget: 'budget', profile: 'profile' }[st.mod] || '');
    this.el.querySelector('.rd-baracts').innerHTML = this.o.mini ? '' :
      (st.tour < 0 ? '<button type="button" class="reset" data-a="tour-restart">' + t.guide + '</button>' : '') + '<button type="button" class="reset" data-a="reset">' + t.reset + '</button>';
    this.el.querySelector('.rd-side').innerHTML = this.vSide();
    main.innerHTML = '<div class="rd-anim' + (prevMod === st.mod ? ' still' : '') + '">' + (this['v_' + st.mod] ? this['v_' + st.mod]() : '') + '</div>';
    if (prevMod === st.mod) main.firstChild.classList.remove('rd-anim'); else if (!this.o.mini) main.scrollTop = 0;
    if (prevMod === st.mod) main.scrollTop = keep;
    this.el.querySelector('.rd-pan').innerHTML = this.vPanel();
    this.el.querySelector('.rd-phw .rd-note').textContent = t.ph.label;
    this.el.querySelector('.rd-mob').textContent = this.o.mini ? '' : t.mob;
    this.lastMod = st.mod;
    this.paintPhone(); this.paintToast(); this.paintTour();
    this.el.querySelectorAll('.rd-msgs').forEach(function (m) { m.scrollTop = m.scrollHeight; });
    if (prevMod !== st.mod) this.countUp();
    this.drawLater();
    if (focus) {
      var sel = '[data-in="' + focus.k + '"]' + (focus.v ? '[data-v="' + focus.v + '"]' : '');
      var f = this.el.querySelector(sel);
      if (f) { f.focus(); try { if (focus.s != null) f.setSelectionRange(focus.s, focus.e); } catch (e) {} }
    }
    if (this.o.mini) this.fit();
  };
  D.fit = function () {
    var sc = this.el.querySelector('.rd-scale'), clip = this.el.querySelector('.rd-clip');
    if (!sc) return;
    var W = this.o.width || 1100, s = Math.min(1, this.el.clientWidth / W);
    sc.style.transform = 'scale(' + s + ')';
    clip.style.height = Math.ceil(sc.offsetHeight * s) + 'px';
  };
  D.countUp = function () {
    if (reduceMotion || this.o.mini) return;
    this.el.querySelectorAll('.rd-main [data-count]').forEach(function (n) {
      var target = parseFloat(n.getAttribute('data-count')); if (!isFinite(target) || target <= 0) return;
      var final = n.textContent, t0 = performance.now();
      (function step(now) {
        var p = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - p, 3);
        if (p < 1) { n.textContent = grp(target * e); requestAnimationFrame(step); } else n.textContent = final;
      })(t0);
    });
  };
  D.vSide = function () {
    var t = this.t(), st = this.st, self = this;
    var ov = this.overdue().length, un = this.unread().length, unc = this.unconfirmed().length;
    var badge = { messages: un, budget: ov, sessions: unc };
    function item(m) { return '<button type="button" class="rd-nav' + (st.mod === m ? ' on' : '') + '" data-a="nav" data-v="' + m + '">' + ic(m) + '<span>' + t.nav[m] + '</span>' + (badge[m] ? '<span class="badge">' + badge[m] + '</span>' : '') + '</button>'; }
    void self;
    return '<div class="who"><span class="rd-av sm"><img src="' + BASE + SNAP.trainer.photos[0] + '" alt=""></span><div><b>' + esc(SNAP.trainer.name) + '</b><span>' + t.role + '</span></div></div>' +
      '<div class="g">' + t.grp[0] + '</div>' + item('dashboard') +
      '<div class="g">' + t.grp[1] + '</div>' + item('plans') +
      '<div class="g">' + t.grp[2] + '</div>' + item('clients') + item('messages') + item('sessions') +
      '<div class="g">' + t.grp[3] + '</div>' + item('budget') + item('profile');
  };
  D.paintToast = function () {
    var w = this.el.querySelector('.rd-toastw'); if (!w) return;
    var to = this.st.toast;
    w.innerHTML = to ? '<div class="rd-toast ' + (to.kind === 'info' ? 'info' : '') + '" role="status">' + ic(to.kind === 'info' ? 'bell' : 'check') + '<span>' + esc(to.text) + '</span></div>' : '';
  };

  // ------------------------------------------------------------------ dashboard
  D.v_dashboard = function () {
    var t = this.t(), d = t.dash, S = SNAP, self = this, td = this.today();
    var week = this.weekDays(0), wk = this.st.sessions.filter(function (s) { return s.status === 'confirmed' && week.indexOf(s.start.slice(0, 10)) >= 0; });
    var todayS = this.st.sessions.filter(function (s) { return s.status === 'confirmed' && s.start.slice(0, 10) === td; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    var ov = this.overdue(), un = this.unread();
    var comps = S.clients.map(function (c) { return self.comp(c); }).filter(function (v) { return v != null; });
    var avgComp = comps.length ? Math.round(sum(comps) / comps.length) : 0;
    var stars = S.reviews.length ? sum(S.reviews, function (r) { return r.stars; }) / S.reviews.length : 0;
    var newC = S.clients.filter(function (c) { return c.since.slice(0, 7) === td.slice(0, 7); }).length;
    var mf = this.monthForecast(), goal = S.trainer.goal || 6000;
    var months = S.budget.overview.months || [];
    var html = head(d.title, d.sub(todayS.length));
    html += '<div class="rd-grid rd-g4">' +
      kpi({ label: d.k[0], icon: 'clients', color: '#3ec6ff', value: S.clients.length, count: S.clients.length, sub: d.ks.newC(newC), a: 'nav', v: 'clients' }) +
      kpi({ label: d.k[1], icon: 'budget', color: '#35d483', value: grp(cv(mf.received)), count: cv(mf.received), unit: CUR(), sub: d.ks.ofGoal(zl(goal)), a: 'go', v: 'budget:0', spark: months.map(function (m) { return m.received; }).concat([mf.received]) }) +
      kpi({ label: d.k[2], icon: 'sessions', color: '#ff4d8d', value: wk.length, count: wk.length, sub: d.ks.todayN(todayS.length), a: 'nav', v: 'sessions' }) +
      kpi({ label: d.k[3], icon: 'messages', color: '#ffb020', value: un.length, sub: d.ks.conv(this.st.threads.length), a: 'nav', v: 'messages' }) + '</div>';
    html += '<div class="rd-grid rd-g4 rd-mt">' +
      kpi({ label: d.k[4], icon: 'alert', color: '#ff5c5c', value: grp(cv(sum(ov, function (x) { return self.left(x); }))), unit: CUR(), sub: d.ks.dues(ov.length), a: 'go', v: 'budget:1' }) +
      kpi({ label: d.k[5], icon: 'trend', color: '#35d483', value: avgComp, unit: '%', sub: d.ks.last14, a: 'nav', v: 'clients' }) +
      kpi({ label: d.k[6], icon: 'star', color: '#ffb020', value: dec(stars, 1), sub: d.ks.reviews(S.reviews.length), a: 'nav', v: 'profile' }) +
      kpi({ label: d.k[7], icon: 'repeat', color: '#a78bfa', value: grp(cv(S.budget.overview.mrr || 0)), count: cv(S.budget.overview.mrr), unit: CUR(), sub: d.ks.fc(S.clients.length), a: 'go', v: 'budget:3' }) + '</div>';

    // goal + attention
    var pPaid = Math.min(100, (mf.received / goal) * 100), pFc = Math.min(100, (mf.total / goal) * 100);
    var goalCard = card(d.goal, '<div class="rd-goal"><div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap"><span class="big">' + zl(mf.received) + '</span><span class="rd-muted">/ ' + zl(goal) + '</span></div>' +
      bar([[pPaid, 'var(--success)'], [Math.max(0, pFc - pPaid), '#3ec6ff66']]) +
      '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap" class="rd-sm"><span class="rd-muted">' + d.fcEnd + ': <b style="color:var(--text)">' + zl(mf.total) + '</b></span><span class="rd-tag ' + (pFc >= 100 ? 'ok' : 'cy') + '">' + d.ofGoalPct(Math.round((mf.total / goal) * 100)) + '</span></div></div>',
      { icon: 'trend', sub: d.goalSub, action: '<button type="button" class="rd-link" data-a="go" data-v="budget:3">' + d.fcLink + ' →</button>', tour: 'goal' });

    var attn = [];
    ov.forEach(function (x) { var c = S.C[x.c]; if (c) attn.push({ c: c, kind: 'dg', txt: d.overdue(zl(self.left(x))), a: 'client', v: c.id }); });
    S.clients.forEach(function (c) { var ld = self.lastDays(c); if (c.plan !== 'meal_only' && ld != null && ld >= 5) attn.push({ c: c, kind: 'wa', txt: d.inactive(ld), a: 'client', v: c.id }); });
    (S.budget.overview.churn || []).forEach(function (x) { var c = S.C[x.c]; if (c && diffD(x.expiry, td) <= 14) attn.push({ c: c, kind: 'cy', txt: d.expiring(fD(x.expiry)), a: 'client', v: c.id }); });
    this.unconfirmed().slice(0, 2).forEach(function (s) { var c = S.C[s.c]; if (c) attn.push({ c: c, kind: 'mg', txt: d.unconf + ' · ' + fD(s.start), a: 'sessopen', v: s.id }); });
    var seen = {}, firstClient = true;
    attn = attn.filter(function (x) { var k = x.c.id + x.kind; if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 6);
    var attnHtml = attn.length ? attn.map(function (x) {
      var tr = ''; if (firstClient && x.a === 'client') { tr = ' data-tour="attn"'; firstClient = false; }
      return '<button type="button" class="rd-row" data-a="' + x.a + '" data-v="' + x.v + '"' + tr + '>' + av(x.c, 'sm') + '<div class="grow"><b>' + esc(x.c.name) + '</b><span>' + x.txt + '</span></div><span class="rd-tag ' + x.kind + '">' + ic(x.kind === 'dg' ? 'wallet' : x.kind === 'wa' ? 'clock' : x.kind === 'mg' ? 'sessions' : 'repeat') + '</span></button>';
    }).join('') : '<p class="rd-empty">' + d.none + '</p>';
    html += '<div class="rd-grid rd-g21 rd-mt">' + goalCard + card(d.attn, attnHtml, { icon: 'alert', sub: d.attnSub }) + '</div>';

    // activity + today
    var act = this.st.feed.map(function (f) { return { c: S.C[f.c], txt: f.txt, at: f.at }; });
    S.clients.forEach(function (c) { c.workoutDays.slice(-2).forEach(function (wd) { act.push({ c: c, txt: d.workout, at: wd + 'T18:00:00.000Z', day: wd }); }); });
    this.st.dues.forEach(function (x) { if (x.status === 'reported' && x.reported_at) act.push({ c: S.C[x.c], txt: d.paidRep + ' · ' + zl(x.amount_pln), at: x.reported_at }); });
    act = act.filter(function (a) { return a.c; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }).slice(0, 6);
    var actHtml = '<div class="rd-feed">' + act.map(function (a) { return '<div class="rd-row">' + av(a.c, 'sm') + '<div class="grow"><b>' + esc(a.c.name) + '</b><span>' + esc(a.txt) + '</span></div><span class="rd-sm rd-muted">' + self.ago(a.day || a.at) + '</span></div>'; }).join('') + '</div>';
    var todayHtml = todayS.length ? todayS.map(function (s) { var c = S.C[s.c]; return '<button type="button" class="rd-row" data-a="sessopen" data-v="' + s.id + '">' + av(c, 'sm') + '<div class="grow"><b>' + wall(s.start) + '–' + wall(s.end) + ' · ' + esc(c ? c.name : '') + '</b><span>' + (s.type === 'online' ? t.se.online : t.se.gym) + (s.price ? ' · ' + zl(s.price) : '') + '</span></div>' + (s.type === 'online' && s.meet ? tag(ic('video') + 'Meet', 'ok') : '') + '</button>'; }).join('') : '<p class="rd-empty">' + d.noToday + '</p>';
    html += '<div class="rd-grid rd-g2 rd-mt">' + card(d.act, actHtml, { icon: 'flame', sub: d.actSub }) + card(d.todayS, todayHtml, { icon: 'sessions', action: '<button type="button" class="rd-link" data-a="nav" data-v="sessions">' + t.nav.sessions + ' →</button>' }) + '</div>';
    return html;
  };

  // ------------------------------------------------------------------ clients
  D.v_clients = function () {
    var t = this.t(), c = t.cl, S = SNAP, st = this.st, self = this;
    var ovBy = {}; this.overdue().forEach(function (d) { ovBy[d.c] = (ovBy[d.c] || 0) + self.left(d); });
    var repBy = {}; st.dues.forEach(function (d) { if (d.status === 'reported') repBy[d.c] = 1; });
    var list = S.clients.filter(function (x) {
      if (st.csearch && x.name.toLowerCase().indexOf(st.csearch.toLowerCase()) < 0) return false;
      if (st.cfilter === 'attn') { var ld = self.lastDays(x); return ovBy[x.id] || (x.plan !== 'meal_only' && ld != null && ld >= 5); }
      return st.cfilter === 'all' || x.plan === st.cfilter;
    });
    var chips = ['all', 'full', 'workout_only', 'meal_only', 'attn'].map(function (k) {
      var n = k === 'all' ? S.clients.length : k === 'attn' ? null : S.clients.filter(function (x) { return x.plan === k; }).length;
      return '<button type="button" class="rd-chip' + (st.cfilter === k ? ' on' : '') + '" data-a="cfilter" data-v="' + k + '">' + (k === 'all' ? c.all : k === 'attn' ? c.attn : t.pks[k]) + (n != null ? ' · ' + n : '') + '</button>';
    }).join('');
    var rows = list.map(function (x) {
      var cp = self.comp(x), ld = self.lastDays(x), w = x.weights, dw = w.length > 1 ? w[w.length - 1][1] - w[0][1] : null;
      var pay = ovBy[x.id] ? tag(t.st.overdue + ' ' + zl(ovBy[x.id]), 'dg') : repBy[x.id] ? tag(c.rep, 'wa') : tag(c.ok, 'ok');
      return '<tr class="click" data-a="client" data-v="' + x.id + '"><td><div class="who">' + av(x, 'sm') + esc(x.name) + '</div></td><td>' + pkgTag(x.plan, t) + ' <span class="rd-muted rd-sm">' + (x.price ? zl(x.price) : '') + '</span></td>' +
        '<td class="hide-sm">' + (cp == null ? '<span class="rd-muted rd-sm">' + c.mealOnly + '</span>' : '<div class="rd-comp">' + bar([[cp, cp >= 75 ? 'var(--success)' : cp >= 45 ? 'var(--warning)' : 'var(--danger)']]) + cp + '%</div>') + '</td>' +
        '<td class="hide-sm rd-sm' + (ld != null && ld >= 5 ? '" style="color:var(--warning)' : ' rd-muted') + '">' + (ld == null ? c.never : ld === 0 ? t.today : ld === 1 ? t.yesterday : t.daysAgo(ld)) + '</td>' +
        '<td class="hide-sm rd-sm">' + (w.length ? dec(w[w.length - 1][1]) + ' kg' + (dw != null ? ' <span style="color:' + (dw <= 0 ? 'var(--success)' : 'var(--warning)') + '">' + (dw > 0 ? '+' : '') + dec(dw) + '</span>' : '') : '–') + '</td><td>' + pay + '</td></tr>';
    }).join('');
    return head(c.title, c.sub(S.clients.length), '<input class="rd-input" style="width:200px" data-in="csearch" placeholder="' + c.search + '" value="' + esc(st.csearch) + '">') +
      '<div class="rd-chips" style="margin-bottom:12px">' + chips + '</div>' +
      '<div class="rd-card" style="padding:8px 6px;overflow-x:auto"><table class="rd-table"><thead><tr>' + c.th.map(function (h, i) { return '<th' + (i >= 2 && i <= 4 ? ' class="hide-sm"' : '') + '>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  };
  D.vClientPanel = function (id) {
    var t = this.t(), c = t.cl, S = SNAP, x = S.C[id], self = this, td = this.today(); if (!x) return '';
    var w = x.weights, dw = w.length > 1 ? w[w.length - 1][1] - w[0][1] : 0;
    var paid = (S.budget.clients || []).filter(function (b) { return b.c === id; })[0];
    var dues = this.st.dues.filter(function (d) { return d.c === id; }).sort(function (a, b) { return a.due_date < b.due_date ? 1 : -1; }).slice(0, 5);
    var cells = ''; for (var i = 27; i >= 0; i--) { var day = addD(td, -i); cells += '<i class="' + (x.workoutDays.indexOf(day) >= 0 ? 'on' : '') + (i === 0 ? ' today' : '') + '" title="' + fD(day) + '"></i>'; }
    var kp = '<div class="rd-grid rd-g2" style="gap:8px">' + [
      [c.kpi[0], (dw > 0 ? '+' : '') + dec(dw) + ' kg', dw <= 0 ? 'var(--success)' : 'var(--warning)'],
      [c.kpi[1], String(this.done(x, 28)), 'var(--accent)'],
      [c.kpi[2], x.bestStreak + ' ' + c.days, 'var(--mg)'],
      [c.kpi[3], zl(paid ? paid.paid_total : 0), 'var(--text)']
    ].map(function (k) { return '<div class="rd-card" style="padding:9px 11px"><div class="rd-sm rd-muted">' + k[0] + '</div><div class="num" style="font-size:18px;color:' + k[2] + '">' + k[1] + '</div></div>'; }).join('') + '</div>';
    return '<aside class="rd-panel" aria-label="' + esc(x.name) + '"><button type="button" class="close" data-a="close" aria-label="×">' + ic('x') + '</button>' +
      '<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;padding-right:30px">' + av(x, 'lg') + '<div><h3 style="font:800 18px Archivo,sans-serif">' + esc(x.name) + '</h3><div class="rd-sm rd-muted">' + (x.city ? esc(x.city) + ' · ' : '') + c.since(fD(x.since)) + '</div><div style="margin-top:4px;display:flex;gap:5px;flex-wrap:wrap">' + pkgTag(x.plan, t) + (x.price ? tag(zl(x.price) + ' ' + c.perM) : '') + '</div></div></div>' +
      '<div style="display:flex;gap:6px;margin-bottom:12px"><button type="button" class="rd-btn" data-a="write" data-v="' + id + '" data-tour="write">' + ic('messages') + c.write + '</button><button type="button" class="rd-btn ghost" data-a="nav" data-v="sessions">' + ic('sessions') + c.sessions + '</button></div>' +
      kp + (x.goals && x.goals.length ? '<div class="rd-chips rd-mt">' + x.goals.map(function (g) { return tag(esc(g)); }).join('') + '</div>' : '') +
      (w.length > 1 ? '<div class="rd-card rd-mt"><header><h4>' + c.weight + '</h4><small>' + dec(w[0][1]) + ' → ' + dec(w[w.length - 1][1]) + ' kg' + (x.target ? ' · ' + c.target + ' ' + dec(x.target) + ' kg' : '') + '</small></header><svg class="rd-chart" data-chart="weight" data-v="' + id + '" viewBox="0 0 340 120" style="height:auto"></svg></div>' : '') +
      (x.plan !== 'meal_only' ? '<div class="rd-card rd-mt"><header><h4>' + c.cal + '</h4></header><div class="rd-cal28">' + cells + '</div></div>' : '') +
      '<div class="rd-card rd-mt"><header><h4>' + c.pay + '</h4></header>' + (dues.map(function (d) { var s = self.dueState(d); return '<div class="rd-row"><div class="grow"><b>' + esc(self.dueTitle(d)) + '</b><span>' + t.bu.due + ' ' + fD(d.due_date) + '</span></div><span class="rd-amt">' + zl(d.amount_pln) + '</span>' + tag(t.st[s], s === 'paid' ? 'ok' : s === 'overdue' ? 'dg' : s === 'reported' ? 'wa' : 'cy') + '</div>'; }).join('') || '<p class="rd-empty">–</p>') + '</div></aside>';
  };

  // ------------------------------------------------------------------ plans
  D.v_plans = function () {
    var t = this.t(), p = t.pl, S = SNAP, st = this.st, self = this;
    var plan = S.plans[st.plan] || S.plans[0], day = plan.days[st.day] || plan.days[0];
    var key = st.plan + ':' + st.day, added = st.added[key] || [];
    var inDay = day.ex.map(function (x) { return x.e; }).concat(added);
    var muscles = ['all']; S.library.forEach(function (e) { if (muscles.indexOf(e.muscle) < 0) muscles.push(e.muscle); });
    var lib = S.library.filter(function (e) { return (st.muscle === 'all' || e.muscle === st.muscle) && (!st.lsearch || (e.name + ' ' + e.nameEn).toLowerCase().indexOf(st.lsearch.toLowerCase()) >= 0); });
    var tourSet = false;
    var libHtml = '<input class="rd-input" data-in="lsearch" placeholder="' + p.search + '" value="' + esc(st.lsearch) + '" style="margin-bottom:8px"><div class="rd-chips" style="margin-bottom:8px">' + muscles.slice(0, 7).map(function (m) { return '<button type="button" class="rd-chip' + (st.muscle === m ? ' on' : '') + '" data-a="muscle" data-v="' + m + '">' + (t.muscle[m] || m) + '</button>'; }).join('') + '</div>' +
      '<div class="rd-scroll">' + lib.map(function (e) {
        var has = inDay.indexOf(e.id) >= 0, tr = ''; if (!has && !tourSet) { tr = ' data-tour="add"'; tourSet = true; }
        return '<div class="rd-ex">' + thumb(e) + '<div class="grow"><b>' + esc(exName(e)) + '</b><span>' + (t.muscle[e.muscle] || e.muscle) + (e.equipment && e.equipment.length ? ' · ' + esc(e.equipment.join(', ')) : '') + '</span></div>' +
          '<button type="button" class="rd-btn sm' + (has ? ' ghost' : '') + '" data-a="add" data-v="' + e.id + '"' + (has ? ' disabled' : '') + tr + '>' + (has ? ic('check') + p.added : '+ ' + p.add) + '</button></div>';
      }).join('') + '</div>';
    var planChips = '<div class="rd-chips" style="margin-bottom:8px">' + S.plans.map(function (pp, i) { return '<button type="button" class="rd-chip' + (i === st.plan ? ' on' : '') + '" data-a="plan" data-v="' + i + '">' + esc(pp.title) + '</button>'; }).join('') + '</div>' +
      '<div class="rd-tabs" style="margin:0 0 6px">' + plan.days.map(function (dd, i) { return '<button type="button" class="rd-tab' + (i === st.day ? ' on' : '') + '" data-a="day" data-v="' + i + '">' + esc(dd.title) + '</button>'; }).join('') + '</div>';
    var exRows = day.ex.map(function (x) { var e = S.E[x.e]; return '<div class="rd-ex">' + thumb(e, 'sm') + '<div class="grow"><b>' + esc(exName(e)) + '</b><span>' + x.sets + ' × ' + esc(x.reps) + (x.kg ? ' · ' + dec(x.kg, 0) + ' kg' : '') + ' · ' + p.rest + ' ' + x.rest + ' s</span></div></div>'; }).join('') +
      added.map(function (id) { var e = S.E[id]; return '<div class="rd-ex new">' + thumb(e, 'sm') + '<div class="grow"><b>' + esc(exName(e)) + '</b><span>3 × 10 · ' + p.rest + ' 90 s</span></div>' + tag(p.added, 'cy') + '</div>'; }).join('');
    var cand = S.clients.filter(function (c) { return c.plan !== 'meal_only'; });
    var assign = cand.map(function (c) {
      var on = st.sel.indexOf(c.id) >= 0;
      return '<div class="rd-row"><button type="button" class="rd-check' + (on ? ' on' : '') + '" data-a="sel" data-v="' + c.id + '" aria-pressed="' + on + '" aria-label="' + esc(c.name) + '"' + (st.sent ? ' disabled' : '') + '>' + (on ? ic('check') : '') + '</button>' + av(c, 'sm') + '<div class="grow"><b>' + esc(c.name) + '</b><span>' + t.pks[c.plan] + '</span></div>' + (st.sent && on ? tag(ic('check') + p.added, 'ok') : '') + '</div>';
    }).join('');
    var n = st.sel.length;
    var feed = st.feed.filter(function (f) { return f.kind === 'set' || f.kind === 'ex'; });
    return head(p.title, p.sub) + '<div class="rd-grid rd-g12">' +
      card(p.lib, libHtml, { icon: 'video', sub: p.libSub(S.library.length) }) +
      '<div class="rd-grid">' + card(p.plan + ': ' + esc(plan.title), planChips + exRows, { icon: 'plans', sub: plan.days.length + ' × / ' + (LANG === 'pl' ? 'tydz.' : 'week') }) +
      card(p.assign, '<div class="rd-scroll" style="max-height:200px">' + assign + '</div><div class="rd-mt"><button type="button" class="rd-btn" data-a="assign" data-tour="assign"' + (st.sent || !n ? ' disabled' : '') + '>' + ic('send') + (st.sent ? p.sent(n) : p.send(n)) + '</button></div>', { icon: 'clients', sub: p.assignSub }) +
      (st.sent ? card(p.live, feed.length ? '<div class="rd-feed">' + feed.map(function (f) { var c = S.C[f.c]; return '<div class="rd-row">' + av(c, 'sm') + '<div class="grow"><b>' + esc(c.name) + '</b><span>' + esc(f.txt) + '</span></div><span class="rd-sm rd-muted">' + t.now + '</span></div>'; }).join('') + '</div>' : '<p class="rd-empty">' + p.liveEmpty + '</p>', { icon: 'flame' }) : '') + '</div></div>';
  };
  function exName(e) { return e ? (LANG === 'en' ? e.nameEn || e.name : e.name) : ''; }
  function thumb(e, cls) { return '<span class="rd-thumb ' + (cls || '') + '">' + (e && e.yt ? '<img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + encodeURIComponent(e.yt) + '/mqdefault.jpg">' : '') + '</span>'; }

  // ------------------------------------------------------------------ sessions
  var H0 = 7, H1 = 21, HH = 44;
  D.v_sessions = function () {
    var t = this.t(), se = t.se, S = SNAP, st = this.st, self = this, td = this.today();
    var days = this.weekDays(st.week);
    var wk = st.sessions.filter(function (s) { return days.indexOf(s.start.slice(0, 10)) >= 0; });
    var conf = wk.filter(function (s) { return s.status === 'confirmed'; });
    var past = st.sessions.filter(function (s) { return s.status === 'confirmed' && s.att; });
    var att = past.length ? Math.round(past.filter(function (s) { return s.att === 'attended'; }).length / past.length * 100) : 100;
    var unc = this.unconfirmed();
    var html = head(se.title, se.sub, '<div style="display:flex;gap:6px;align-items:center"><button type="button" class="rd-btn ghost sm" data-a="week" data-v="-1" aria-label="‹">' + ic('left') + '</button><button type="button" class="rd-btn ghost sm" data-a="week" data-v="0">' + se.thisWeek + '</button><button type="button" class="rd-btn ghost sm" data-a="week" data-v="1" aria-label="›">' + ic('right') + '</button></div>');
    html += '<div class="rd-grid rd-g4" style="margin-bottom:12px">' +
      kpi({ label: se.k[0], icon: 'sessions', color: '#ff4d8d', value: conf.length, sub: se.ks[0] }) +
      kpi({ label: se.k[1], icon: 'budget', color: '#35d483', value: grp(cv(sum(conf, function (s) { return s.price; }))), unit: CUR(), sub: se.ks[1] }) +
      kpi({ label: se.k[2], icon: 'check', color: '#3ec6ff', value: att, unit: '%', sub: se.ks[2] }) +
      kpi({ label: se.k[3], icon: 'alert', color: '#ffb020', value: unc.length, sub: se.ks[3] }) + '</div>';
    var nowW = new Date(nowWall()), tourSet = false;
    var tourId = (unc.filter(function (s) { return days.indexOf(s.start.slice(0, 10)) >= 0; })[0] || conf[0] || {}).id;
    var cols = days.map(function (d, di) {
      var ev = wk.filter(function (s) { return s.start.slice(0, 10) === d; }).map(function (s) {
        var a = new Date(s.start), b = new Date(s.end), c = S.C[s.c];
        var top = (a.getUTCHours() + a.getUTCMinutes() / 60 - H0) * HH, h = Math.max(22, ((b - a) / 3600000) * HH - 2);
        var isUnc = s.status === 'confirmed' && !s.att && self.isPast(s);
        var tr = s.id === tourId && !tourSet ? (tourSet = true, ' data-tour="sess"') : '';
        var stIc = s.att === 'attended' ? '<span class="st" style="color:var(--success)">' + ic('check') + '</span>' : s.att === 'no_show' ? '<span class="st" style="color:var(--danger)">' + ic('x') + '</span>' : isUnc ? '<span class="st" style="color:var(--warning)">' + ic('alert') + '</span>' : '';
        return '<button type="button" class="rd-ev ' + s.type + (self.isPast(s) ? ' past' : '') + (s.status === 'cancelled' ? ' cancel' : '') + '" data-ev="' + s.id + '" style="top:' + top.toFixed(1) + 'px;height:' + h.toFixed(1) + 'px"' + tr + '>' + stIc + '<b>' + esc(c ? c.name : '') + '</b><span>' + wall(s.start) + (isUnc ? ' · ' + se.confirm : '') + '</span></button>';
      }).join('');
      var now = d === td ? '<div class="rd-now" style="top:' + ((nowW.getUTCHours() + nowW.getUTCMinutes() / 60 - H0) * HH).toFixed(1) + 'px"></div>' : '';
      return '<div class="col' + (d === td ? ' today' : '') + '" data-d="' + di + '" style="height:' + (H1 - H0) * HH + 'px">' + ev + (d === td && nowW.getUTCHours() >= H0 && nowW.getUTCHours() < H1 ? now : '') + '</div>';
    }).join('');
    var hrs = ''; for (var hh = H0 + 1; hh < H1; hh++) hrs += '<span style="top:' + (hh - H0) * HH + 'px">' + hh + ':00</span>';
    html += '<div class="rd-week" style="--hh:' + HH + 'px"><div class="hd" style="border-left:0"></div>' + days.map(function (d) { var dt = new Date(d + 'T00:00:00Z'); return '<div class="hd' + (d === td ? ' today' : '') + '">' + new Intl.DateTimeFormat(loc(), { weekday: 'short', timeZone: 'UTC' }).format(dt) + '<b>' + dt.getUTCDate() + '</b></div>'; }).join('') +
      '<div class="hrs">' + hrs + '</div>' + cols + '</div>' +
      '<div class="rd-legend"><span><i style="background:var(--mg)"></i>' + se.gym + '</span><span><i style="background:var(--accent)"></i>' + se.online + '</span><span><i style="background:var(--warning)"></i>' + se.k[3] + '</span></div>';
    return html;
  };
  D.vSessPanel = function (id) {
    var t = this.t(), se = t.se, S = SNAP, s = this.st.sessions.filter(function (x) { return x.id === id; })[0]; if (!s) return '';
    var c = S.C[s.c], past = this.isPast(s), unc = s.status === 'confirmed' && !s.att && past;
    var stTag = s.status === 'cancelled' ? tag(se.cancelled) : s.att === 'attended' ? tag(se.attended, 'ok') : s.att === 'no_show' ? tag(se.noShow, 'dg') : unc ? tag(se.confirm, 'wa') : tag(se.future, 'cy');
    return '<aside class="rd-panel"><button type="button" class="close" data-a="close" aria-label="×">' + ic('x') + '</button>' +
      '<div style="display:flex;gap:12px;align-items:center;padding-right:30px">' + av(c, 'lg') + '<div><h3 style="font:800 18px Archivo,sans-serif">' + esc(c ? c.name : '') + '</h3><div style="display:flex;gap:5px;margin-top:4px;flex-wrap:wrap">' + tag(s.type === 'online' ? se.online : se.gym, s.type === 'online' ? 'cy' : 'mg') + stTag + '</div></div></div>' +
      '<dl class="rd-dl"><dt>' + se.when + '</dt><dd>' + fWD(s.start) + ', ' + wall(s.start) + '–' + wall(s.end) + '</dd><dt>' + se.price + '</dt><dd>' + (s.price ? zl(s.price) : '–') + '</dd>' + (s.series ? '<dt>' + ic('repeat').replace('<svg', '<svg style="width:14px;height:14px;display:inline"') + '</dt><dd>' + se.series + '</dd>' : '') + (s.note ? '<dt>' + se.note + '</dt><dd style="font-weight:600">' + esc(s.note) + '</dd>' : '') + '</dl>' +
      (s.type === 'online' ? '<div class="rd-meet"><span class="ic">' + ic('video') + '</span><div style="flex:1"><b>' + se.meet + '</b><div class="rd-sm rd-muted">' + se.meetSub + '</div></div><button type="button" class="rd-btn ok sm" data-a="meet">' + se.join + '</button></div>' : '') +
      (unc ? '<div class="rd-card" style="margin-top:10px"><header><h4>' + se.att + '</h4></header><div style="display:flex;gap:8px"><button type="button" class="rd-btn ok" data-a="att" data-v="attended">' + ic('check') + se.was + '</button><button type="button" class="rd-btn dg" data-a="att" data-v="no_show" data-tour="noshow">' + ic('x') + se.wasNot + ' (' + SNAP.trainer.noShowPct + '%)</button></div></div>' : '') +
      (!past && s.status === 'confirmed' ? '<p class="rd-sm rd-muted" style="margin-top:10px">↔ ' + se.dragHint + '</p>' : '') + '</aside>';
  };

  // ------------------------------------------------------------------ messages
  D.v_messages = function () {
    var t = this.t(), m = t.ms, S = SNAP, st = this.st, self = this;
    var th = st.threads.filter(function (x) { return x.c === st.thread; })[0] || st.threads[0];
    var list = st.threads.map(function (x) {
      var c = S.C[x.c], last = x.msgs[x.msgs.length - 1], unread = last && !last.me && (!x.trainerRead || last.at > x.trainerRead);
      return '<button type="button" class="rd-th' + (x === th ? ' on' : '') + (unread ? ' unread' : '') + '" data-a="thread" data-v="' + x.c + '">' + av(c, 'sm') + '<div class="grow"><b>' + esc(c ? c.name : '') + '<time>' + (last ? self.ago(last.at) : '') + '</time></b><span>' + (last ? (last.me ? (LANG === 'pl' ? 'Ty: ' : 'You: ') : '') + esc(last.body) : '') + '</span></div>' + (unread ? '<i class="dot"></i>' : '') + '</button>';
    }).join('');
    var conv = '';
    if (th) {
      var c = S.C[th.c], lastDay = '', lastMe = null;
      th.msgs.forEach(function (x, i) { if (x.me) lastMe = i; });
      var bubbles = th.msgs.map(function (x, i) {
        var d = localIso(new Date(x.at)), sep = d !== lastDay ? '<span class="rd-day">' + (d === self.today() ? t.today : fWD(d)) + '</span>' : '';
        lastDay = d;
        var rec = i === lastMe ? '<span class="rd-read">' + (th.clientRead && th.clientRead >= x.at ? ic('checks') + m.read + ' ' + fT(th.clientRead) : ic('check') + m.delivered) + '</span>' : '';
        return sep + '<div class="rd-msg' + (x.me ? ' me' : '') + (x.fresh ? ' new' : '') + '">' + esc(x.body) + '<time>' + fT(x.at) + '</time></div>' + rec;
      }).join('') + (st.typing === th.c ? '<div class="rd-typing"><i></i><i></i><i></i></div>' : '');
      var tpl = '<div class="rd-chips">' + S.templates.map(function (x, i) { return '<button type="button" class="rd-chip" data-a="tpl" data-v="' + i + '">' + esc(x.title) + '</button>'; }).join('') + '</div>';
      conv = '<div class="rd-conv"><header>' + av(c, 'sm') + '<div class="grow" style="flex:1"><b>' + esc(c ? c.name : '') + '</b><div class="rd-sm rd-muted">' + (c ? t.pk[c.plan] : '') + '</div></div></header>' +
        '<div class="rd-msgs">' + bubbles + '</div><div class="rd-compose">' + tpl + '<div class="row"><textarea class="rd-text" style="min-height:40px;height:40px;resize:none" data-in="draft" placeholder="' + m.type + '">' + esc(st.draft) + '</textarea><button type="button" class="rd-btn" data-a="send" data-tour="send" aria-label="' + m.send + '">' + ic('send') + m.send + '</button></div></div></div>';
      var next = st.sessions.filter(function (s) { return s.c === th.c && s.status === 'confirmed' && !self.isPast(s); }).sort(function (a, b) { return a.start < b.start ? -1 : 1; })[0];
      var open = st.dues.filter(function (d) { return d.c === th.c && (d.status === 'open' || d.status === 'partial' || d.status === 'reported'); });
      var cp = c ? this.comp(c) : null;
      conv += '<div class="rd-ctx"><div style="text-align:center">' + av(c, 'lg').replace('rd-av lg', 'rd-av lg" style="margin:0 auto 6px;background:' + (c ? c.color : '') + '') + '<b>' + esc(c ? c.name : '') + '</b><div style="margin-top:4px">' + (c ? pkgTag(c.plan, t) : '') + '</div></div>' +
        '<h5>' + m.next + '</h5>' + (next ? fWD(next.start) + ', ' + wall(next.start) : m.none) +
        '<h5>' + m.dues + '</h5>' + (open.length ? zl(sum(open, function (d) { return self.left(d); })) : zl(0)) +
        (cp != null ? '<h5>' + m.comp + '</h5><div class="rd-comp">' + bar([[cp, 'var(--success)']]) + cp + '%</div>' : '') +
        '<div style="margin-top:14px"><button type="button" class="rd-btn ghost sm" data-a="client" data-v="' + th.c + '">' + t.cl.title + ' →</button></div></div>';
    }
    return head(m.title, m.sub) + '<div class="rd-inbox"><div class="rd-threads">' + list + '</div>' + conv + '</div>';
  };

  // ------------------------------------------------------------------ budget
  D.v_budget = function () {
    var t = this.t(), b = t.bu, st = this.st;
    var tabs = '<div class="rd-tabs">' + b.tabs.map(function (x, i) { return '<button type="button" class="rd-tab' + (st.btab === i ? ' on' : '') + '" data-a="btab" data-v="' + i + '"' + (i === 3 ? ' data-tour="fctab"' : '') + '>' + x + '</button>'; }).join('') + '</div>';
    var body = [this.bOverview, this.bDues, this.bCosts, this.bForecast][st.btab].call(this);
    return head(b.title, b.sub, tag(fMonth(this.today()) + ' ' + this.today().slice(0, 4), 'cy')) + tabs + body;
  };
  D.bOverview = function () {
    var t = this.t(), b = t.bu, S = SNAP, self = this, ms = this.today().slice(0, 7) + '-01';
    var recv = this.received(), costs = sum(this.costsIn(ms), function (e) { return e.amount_pln; });
    var ov = this.overdue(), open = this.st.dues.filter(function (d) { return self.dueState(d) === 'open'; });
    var html = '<div class="rd-grid rd-g4">' +
      kpi({ label: b.k[0], icon: 'budget', color: '#35d483', value: grp(cv(recv)), unit: CUR(), sub: b.ks.goal(zl(S.trainer.goal || 6000)), a: 'btab', v: '1' }) +
      kpi({ label: b.k[1], icon: 'clock', color: '#3ec6ff', value: grp(cv(sum(open, function (d) { return self.left(d); }))), unit: CUR(), sub: b.ks.upcoming, a: 'btab', v: '1' }) +
      kpi({ label: b.k[2], icon: 'alert', color: '#ff5c5c', value: grp(cv(sum(ov, function (d) { return self.left(d); }))), unit: CUR(), sub: b.ks.overdue(ov.length), a: 'btab', v: '1' }) +
      kpi({ label: b.k[3], icon: 'trend', color: '#a78bfa', value: grp(cv(recv - costs)), unit: CUR(), sub: b.ks.costs(zl(costs)), a: 'btab', v: '2' }) + '</div>';
    var methods = S.budget.overview.methods || {}, mt = sum(Object.keys(methods).map(function (k) { return methods[k]; })) || 1;
    var mHtml = Object.keys(methods).sort(function (a, c) { return methods[c] - methods[a]; }).map(function (k) { return '<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between" class="rd-sm"><span>' + (t.method[k] || k) + '</span><b>' + zl(methods[k]) + '</b></div>' + bar([[methods[k] / mt * 100, 'var(--accent)']]) + '</div>'; }).join('');
    var mf = this.monthForecast(), goal = S.trainer.goal || 6000;
    var goalHtml = '<div class="rd-goal"><span class="big">' + zl(mf.received) + '</span> <span class="rd-muted">/ ' + zl(goal) + '</span>' + bar([[mf.received / goal * 100, 'var(--success)'], [Math.max(0, (mf.total - mf.received) / goal * 100), '#3ec6ff66']]) + '<div class="rd-sm rd-muted">' + t.dash.fcEnd + ': <b style="color:var(--text)">' + zl(mf.total) + '</b></div></div>';
    html += '<div class="rd-grid rd-g21 rd-mt">' + card(b.chart, '<svg class="rd-chart" data-chart="months"></svg><div class="rd-legend"><span><i style="background:var(--success)"></i>' + b.recv + '</span><span><i style="background:var(--mg)"></i>' + b.costs + '</span></div>', { icon: 'trend' }) +
      '<div class="rd-grid">' + card(t.dash.goal, goalHtml, { icon: 'trend', action: '<button type="button" class="rd-link" data-a="btab" data-v="3">' + t.dash.fcLink + ' →</button>' }) + card(b.methods, mHtml, { icon: 'wallet' }) + '</div></div>';
    return html;
  };
  D.bDues = function () {
    var t = this.t(), b = t.bu, S = SNAP, st = this.st, self = this, tourSet = false;
    var order = { reported: 0, overdue: 1, open: 2, paid: 3, waived: 4, partial: 2 };
    var list = st.dues.filter(function (d) { var s = self.dueState(d); return st.dfilter === 'all' ? true : s !== 'paid' && s !== 'waived'; })
      .sort(function (a, c) { var x = order[self.dueState(a)] - order[self.dueState(c)]; return x || (a.due_date < c.due_date ? -1 : 1); }).slice(0, st.dfilter === 'all' ? 40 : 30);
    var rows = list.map(function (d) {
      var c = S.C[d.c], s = self.dueState(d), acts = '';
      if (s === 'overdue' || s === 'open') {
        var tr = s === 'overdue' && !tourSet ? (tourSet = true, ' data-tour="remind"') : '';
        acts = '<button type="button" class="rd-btn ghost sm" data-a="remind" data-v="' + d.id + '"' + tr + (d.reminded_demo ? ' disabled' : '') + '>' + ic('bell') + (d.reminded_demo ? b.reminded : b.remind) + '</button><button type="button" class="rd-btn ok sm" data-a="paid" data-v="' + d.id + '">' + ic('check') + b.paid + '</button>';
      } else if (s === 'reported') acts = '<button type="button" class="rd-btn ok sm" data-a="paid" data-v="' + d.id + '">' + ic('check') + b.confirm + '</button>';
      return '<div class="rd-row" style="flex-wrap:wrap">' + av(c, 'sm') + '<div class="grow" style="min-width:150px"><b>' + esc(c ? c.name : '') + '</b><span>' + esc(self.dueTitle(d)) + ' · ' + b.due + ' ' + fD(d.due_date) + '</span></div><span class="rd-amt">' + zl(d.amount_pln) + '</span>' + tag(t.st[s], s === 'paid' ? 'ok' : s === 'overdue' ? 'dg' : s === 'reported' ? 'wa' : 'cy') + '<div style="display:flex;gap:5px">' + acts + '</div></div>';
    }).join('');
    var pays = st.payments.slice().sort(function (a, c) { return a.paid_on < c.paid_on ? 1 : -1; }).slice(0, 8).map(function (p) { var c = S.C[p.c]; return '<div class="rd-row">' + av(c, 'sm') + '<div class="grow"><b>' + esc(c ? c.name : '') + '</b><span>' + fD(p.paid_on) + ' · ' + (t.method[p.method] || p.method) + '</span></div><span class="rd-amt" style="color:var(--success)">+' + zl(p.amount_pln) + '</span></div>'; }).join('');
    return '<div class="rd-chips" style="margin-bottom:10px">' + ['todo', 'all'].map(function (k) { return '<button type="button" class="rd-chip' + (st.dfilter === k ? ' on' : '') + '" data-a="dfilter" data-v="' + k + '">' + b[k] + '</button>'; }).join('') + '</div>' +
      '<div class="rd-grid rd-g21">' + card(b.tabs[1], rows || '<p class="rd-empty">–</p>', { icon: 'wallet' }) + card(b.recent, pays, { icon: 'budget' }) + '</div>';
  };
  D.bCosts = function () {
    var t = this.t(), b = t.bu, ms = this.today().slice(0, 7) + '-01', nx = monthAdd(ms, 1);
    var cur = this.costsIn(ms), next = this.costsIn(nx).filter(function (e) { return e.recurring === 'monthly'; });
    var total = sum(cur, function (e) { return e.amount_pln; });
    var rows = cur.map(function (e) { return '<div class="rd-row"><span class="rd-av sm" style="background:var(--subtle);color:var(--muted)">' + ic(e.recurring === 'monthly' ? 'repeat' : 'wallet').replace('<svg', '<svg style="width:13px;height:13px"') + '</span><div class="grow"><b>' + esc(e.note || t.cat[e.category]) + '</b><span>' + (t.cat[e.category] || e.category) + ' · ' + (e.recurring === 'monthly' ? b.monthly : b.once + ' · ' + fD(e.spent_on)) + '</span></div><span class="rd-amt">' + zl(e.amount_pln) + '</span></div>'; }).join('');
    var cats = {}; cur.forEach(function (e) { cats[e.category] = (cats[e.category] || 0) + e.amount_pln; });
    var catHtml = Object.keys(cats).sort(function (a, c) { return cats[c] - cats[a]; }).map(function (k) { return '<div style="margin-bottom:9px"><div style="display:flex;justify-content:space-between" class="rd-sm"><span>' + (t.cat[k] || k) + '</span><b>' + zl(cats[k]) + '</b></div>' + bar([[cats[k] / (total || 1) * 100, 'var(--mg)']]) + '</div>'; }).join('');
    return '<div class="rd-grid rd-g21">' + card(b.costsMonth(fMonth(ms)), rows + '<div class="rd-row"><div class="grow"><b>' + b.total + '</b></div><span class="rd-amt" style="font-size:16px">' + zl(total) + '</span></div>', { icon: 'wallet' }) +
      '<div class="rd-grid">' + card(b.nextMonth(fMonth(nx)), '<div class="num" style="font-size:26px">' + zl(sum(next, function (e) { return e.amount_pln; })) + '</div><div class="rd-sm rd-muted">' + b.nextSub + ' · ' + next.length + '</div>', { icon: 'trend' }) + card(b.byCat, catHtml, { icon: 'budget' }) + '</div></div>';
  };
  D.bForecast = function () {
    var t = this.t(), f = t.bu.fc, S = SNAP, st = this.st, self = this, F = S.budget.forecast, goal = S.trainer.goal || F.goal || 6000;
    var pct = Math.round(this.rate() * 100);
    var seg = '<div class="rd-seg"><button type="button" class="' + (st.fcVar === 'sure' ? 'on' : '') + '" data-a="fcvar" data-v="sure">' + f.sure + '</button><button type="button" class="' + (st.fcVar === 'renew' ? 'on' : '') + '" data-a="fcvar" data-v="renew" data-tour="fcvar">' + f.renew(pct) + '</button></div>';
    var tiles = '<div class="rd-months">' + F.months.map(function (m, i) { var x = self.fcIncome(m, st.fcVar); return '<button type="button" class="rd-month' + (i === st.fcM ? ' on' : '') + '" data-a="fcm" data-v="' + i + '"><small>' + fMonth(m.month) + (i === 0 ? ' · ' + f.cur : '') + '</small><b>' + zl(x.total) + '</b><span style="color:' + (x.total - x.costs >= 0 ? 'var(--success)' : 'var(--danger)') + '">' + f.profit + ' ' + zl(x.total - x.costs) + '</span></button>'; }).join('') + '</div>';
    var m = F.months[st.fcM] || F.months[0], x = this.fcIncome(m, st.fcVar), r = this.rate();
    var groups = ['paid', 'due', 'planned', 'renewal'].filter(function (s) { return s !== 'renewal' || st.fcVar === 'renew'; }).map(function (s) {
      var ls = m.income.filter(function (l) { return l.source === s; }); if (!ls.length) return '';
      var col = { paid: 'ok', due: 'cy', planned: '', renewal: 'mg' }[s];
      return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">' + tag(f.src[s] + ' · ' + ls.length, col) + '<b class="rd-amt">' + zl(x[s]) + '</b></div>' +
        ls.slice(0, 6).map(function (l) { var c = S.C[l.c]; return '<div class="rd-row">' + av(c, 'sm') + '<div class="grow"><b>' + esc(l.name || (c ? c.name : '')) + '</b><span>' + (l.kind === 'subscription' ? t.pk[l.label] || esc(l.label) : t.due.session + (t.se[l.label] ? ' · ' + t.se[l.label] : '')) + (l.date ? ' · ' + fD(l.date) : '') + '</span></div><span class="rd-amt">' + zl(l.amount * (s === 'renewal' ? r : 1)) + '</span></div>'; }).join('') +
        (ls.length > 6 ? '<div class="rd-sm rd-muted" style="padding-top:4px">+ ' + (ls.length - 6) + '</div>' : '') + '</div>';
    }).join('');
    var costs = m.costs.map(function (c) { return '<div class="rd-row"><div class="grow"><b>' + esc(c.note || t.cat[c.category]) + '</b><span>' + (t.cat[c.category] || c.category) + '</span></div><span class="rd-amt">' + zl(c.amount) + '</span></div>'; }).join('');
    var risks = m.risks.length ? m.risks.map(function (k) { var c = S.C[k.c]; return '<div class="rd-row" style="flex-wrap:wrap">' + av(c, 'sm') + '<div class="grow"><b>' + esc(k.name) + '</b><span>' + (t.pk[k.plan_slug] || '') + ' · ' + fD(k.expiry) + '</span></div><span class="rd-amt" style="color:var(--warning)">' + zl(k.price) + '</span><button type="button" class="rd-btn ghost sm" data-a="renew" data-v="' + k.c + '" data-x="' + k.expiry + '">' + ic('messages') + f.renewMsg + '</button></div>'; }).join('') : '<p class="rd-empty">' + f.noRisk + '</p>';
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">' + seg + '<span class="rd-sm rd-muted">' + f.rateNote(pct, F.renewal_sample || 0) + '</span></div>' +
      card(t.bu.tabs[3], '<svg class="rd-chart" data-chart="forecast"></svg><div class="rd-legend">' + ['paid', 'due', 'planned'].concat(st.fcVar === 'renew' ? ['renewal'] : []).map(function (s) { return '<span><i style="background:' + FC_COL[s] + '"></i>' + f.src[s] + '</span>'; }).join('') + '<span><i style="background:var(--orange)"></i>' + f.costs + '</span><span><i style="background:transparent;border:1px dashed var(--muted)"></i>' + f.goal + ' ' + zl(goal) + '</span></div>', { icon: 'trend' }) +
      tiles + '<div class="rd-grid rd-g21">' + card(f.lines + ': ' + fMonth(m.month), groups || '<p class="rd-empty">–</p>', { icon: 'budget' }) +
      '<div class="rd-grid">' + card(f.risks, risks, { icon: 'alert', sub: f.risksSub }) + card(f.costs, costs + '<div class="rd-row"><div class="grow"><b>' + t.bu.total + '</b></div><span class="rd-amt">' + zl(x.costs) + '</span></div>', { icon: 'wallet' }) + '</div></div>';
  };
  var FC_COL = { paid: '#35d483', due: '#3ec6ff', planned: '#2b6f8f', renewal: '#ff4d8d' };

  // ------------------------------------------------------------------ profile
  D.v_profile = function () {
    var t = this.t(), p = t.pr, S = SNAP, st = this.st, tr = S.trainer, pr = st.prof;
    var allTags = tr.tags.concat(['Mobilność', 'Dieta sportowa', 'Trening funkcjonalny', 'Zdrowy kręgosłup'].filter(function (x) { return tr.tags.indexOf(x) < 0; }));
    var editor = card(p.pub, '<label class="rd-label">' + p.bio + '</label><textarea class="rd-text" rows="6" data-in="bio">' + esc(pr.bio) + '</textarea>' +
      '<label class="rd-label" style="margin-top:12px">' + p.tags + '</label><div class="rd-chips">' + allTags.map(function (g) { var on = pr.tags.indexOf(g) >= 0; return '<button type="button" class="rd-chip' + (on ? ' on' : '') + '" data-a="tag" data-v="' + escA(g) + '">' + (on ? '✓ ' : '+ ') + esc(g) + '</button>'; }).join('') + '</div>', { icon: 'profile' }) +
      card(p.prices, ['full', 'workout_only', 'meal_only'].map(function (k, i) { return '<div class="rd-price"><div><b class="rd-sm">' + t.pk[k] + '</b></div><input class="rd-input" type="number" min="0" step="10" inputmode="numeric" data-in="price" data-v="' + k + '" value="' + Math.round(cv(pr.prices[k] || 0)) + '"' + (i === 0 ? ' data-tour="price"' : '') + '></div>'; }).join('') +
        ['online', 'gym'].map(function (k) { return '<div class="rd-price"><div><b class="rd-sm">' + p.session[k] + '</b></div><input class="rd-input" type="number" min="0" step="5" inputmode="numeric" data-in="price" data-v="' + k + '" value="' + Math.round(cv(pr.prices[k] || 0)) + '"></div>'; }).join(''), { icon: 'budget', sub: p.pricesSub, cls: 'rd-mt' });
    return head(p.title, p.sub, '<div style="display:flex;align-items:center;gap:8px"><svg class="rd-ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" stroke="#1f242b" stroke-width="5" fill="none"/><circle cx="22" cy="22" r="18" stroke="#35d483" stroke-width="5" fill="none" stroke-dasharray="113" stroke-dashoffset="' + (113 * 0.06).toFixed(1) + '" transform="rotate(-90 22 22)" stroke-linecap="round"/><text x="22" y="26" text-anchor="middle" fill="#f4f6f8" font-size="11" font-weight="800" font-family="Archivo">94%</text></svg><span class="rd-sm rd-muted">' + p.complete + '</span></div>') +
      '<div class="rd-grid rd-g2"><div>' + editor + '</div><div>' + this.vPreview() + '</div></div>';
  };
  D.vPreview = function () {
    var t = this.t(), p = t.pr, S = SNAP, tr = S.trainer, pr = this.st.prof;
    var prices = ['full', 'workout_only', 'meal_only'].map(function (k) { return pr.prices[k]; }).filter(function (v) { return v > 0; });
    var from = prices.length ? Math.min.apply(null, prices) : 0;
    var stars = S.reviews.length ? sum(S.reviews, function (r) { return r.stars; }) / S.reviews.length : 0;
    var bio = (LANG === 'en' && EN[pr.bio]) || pr.bio;
    bio = bio.length > 230 ? bio.slice(0, 230) + '…' : bio;
    return '<div class="rd-label">' + p.preview + '</div><div class="rd-prev"><div class="ph"><img src="' + BASE + tr.photos[pr.photo % tr.photos.length] + '" alt="">' +
      '<button type="button" class="nav l" data-a="photo" data-v="-1" aria-label="‹">' + ic('left') + '</button><button type="button" class="nav r" data-a="photo" data-v="1" aria-label="›">' + ic('right') + '</button>' +
      '<div class="pg">' + tr.photos.map(function (x, i) { return '<button type="button" class="' + (i === pr.photo % tr.photos.length ? 'on' : '') + '" data-a="photo" data-v="=' + i + '" aria-label="' + (i + 1) + '"></button>'; }).join('') + '</div></div>' +
      '<div class="bd"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><h3 style="font:800 18px Archivo,sans-serif">' + esc(tr.name) + '</h3><div class="rd-sm"><span class="rd-stars">' + '★★★★★'.slice(0, Math.round(stars)) + '</span> <b>' + dec(stars) + '</b> <span class="rd-muted">· ' + p.reviews(S.reviews.length) + '</span></div></div>' +
      '<div class="from" style="flex-direction:column;align-items:flex-end;display:flex"><span>' + p.from + '</span><b class="' + (pr.flash ? 'flash' : '') + '">' + zl(from) + '</b><span>' + p.perM + '</span></div></div>' +
      '<div class="rd-sm rd-muted" style="margin:6px 0;display:flex;gap:10px;flex-wrap:wrap"><span>' + p.years(tr.years || 0) + '</span>' + (tr.gyms[0] ? '<span>📍 ' + esc(tr.gyms[0]) + '</span>' : '') + '</div>' +
      '<div class="rd-chips" style="margin:8px 0">' + pr.tags.map(function (g) { return tag(esc(g), 'cy'); }).join('') + '</div><p class="rd-sm" style="color:#c9ced5">' + esc(bio) + '</p>' +
      '<div class="rd-label" style="margin-top:12px">' + p.pkgs + '</div>' + ['full', 'workout_only', 'meal_only'].filter(function (k) { return pr.prices[k] > 0; }).map(function (k) { return '<div class="rd-pkg"><span>' + t.pk[k] + '</span><b>' + zl(pr.prices[k]) + ' <span class="rd-muted rd-sm" style="font-family:Manrope">' + p.perM + '</span></b></div>'; }).join('') +
      '<div class="rd-label" style="margin-top:10px">' + p.sessions + '</div><div class="rd-sm">' + t.se.online + ' <b>' + zl(pr.prices.online || 0) + '</b> · ' + t.se.gym + ' <b>' + zl(pr.prices.gym || 0) + '</b></div>' +
      S.reviews.slice(0, 2).map(function (r) { return '<div class="rd-rev"><div style="display:flex;justify-content:space-between"><b>' + esc(r.name) + '</b><span class="rd-stars">' + '★★★★★'.slice(0, r.stars) + '</span></div><p class="rd-muted" style="margin-top:3px">' + esc(r.comment) + '</p>' + (r.reply ? '<div class="reply"><b>' + p.reply + ':</b> ' + esc(r.reply) + '</div>' : '') + '</div>'; }).join('') +
      '<button type="button" class="rd-btn" style="width:100%;margin-top:12px">' + p.choose + '</button></div></div>';
  };

  // ------------------------------------------------------------------ side panel
  D.vPanel = function () {
    if (this.st.mod === 'clients' && this.st.client) return this.vClientPanel(this.st.client);
    if (this.st.mod === 'sessions' && this.st.sess) return this.vSessPanel(this.st.sess);
    return '';
  };

  // ------------------------------------------------------------------ phone
  D.paintPhone = function () {
    var scr = this.el.querySelector('.rd-scr'); if (!scr || this.el.classList.contains('nophone')) return;
    var t = this.t(), ph = t.ph, S = SNAP, st = this.st, P = st.phone, c = S.C[P.who] || S.clients[0], self = this, td = this.today();
    var plan = st.sent ? S.plans[st.plan] : this.planOf(c.id), body = '';
    var myDues = st.dues.filter(function (d) { return d.c === c.id && ['open', 'partial', 'reported'].indexOf(d.status) >= 0; }).sort(function (a, b) { return a.due_date < b.due_date ? -1 : 1; });
    var next = st.sessions.filter(function (s) { return s.c === c.id && s.status === 'confirmed' && !self.isPast(s); }).sort(function (a, b) { return a.start < b.start ? -1 : 1; })[0];
    if (P.screen === 'home') {
      body = '<div class="hi">' + ph.hi(esc(c.first)) + '</div><div class="dt">' + fWD(td) + '</div>';
      if (plan && c.plan !== 'meal_only') {
        var dd = plan.days[st.sent ? st.day : 0];
        body += '<div class="rd-pc' + (P.plan ? ' new' : '') + '"><div class="lb" style="color:var(--accent)">' + (P.plan ? ph.newPlan : ph.todayW) + '</div><h5>' + esc(plan.title) + '</h5><div class="rd-muted" style="margin-bottom:8px">' + esc(dd ? dd.title : '') + ' · ' + (dd ? dd.ex.length + (st.added[st.plan + ':' + st.day] || []).length : 0) + ' ' + (LANG === 'pl' ? 'ćwiczeń' : 'exercises') + '</div><button type="button" class="rd-btn" style="width:100%" data-a="ph-start" data-tour="ph-start">' + ic('play') + ph.start + '</button></div>';
      }
      body += '<div class="rd-pc" style="display:flex;align-items:center;gap:10px"><span class="num" style="font-size:26px;color:var(--mg)">' + c.bestStreak + '</span><div><b>' + ph.streak + '</b><div style="display:flex;gap:3px;margin-top:5px">' + [6, 5, 4, 3, 2, 1, 0].map(function (i) { return '<i style="width:14px;height:6px;border-radius:3px;background:' + (c.workoutDays.indexOf(addD(td, -i)) >= 0 ? 'var(--mg)' : 'var(--subtle)') + '"></i>'; }).join('') + '</div></div></div>';
      if (next) body += '<div class="rd-pc"><div class="lb">' + ph.next + '</div><b>' + fWD(next.start) + ', ' + wall(next.start) + '</b><div class="rd-muted">' + (next.type === 'online' ? t.se.online + ' · Google Meet' : t.se.gym) + '</div></div>';
      if (myDues[0]) body += this.phDue(myDues[0]);
    } else if (P.screen === 'workout') {
      var pl0 = plan || S.plans[0], dy = pl0.days[st.sent ? st.day : 0], ex = dy.ex[0], e = S.E[ex.e];
      body = '<div class="lb rd-muted" style="font-size:10.5px;font-weight:800;text-transform:uppercase">' + esc(dy.title) + '</div><div class="hi" style="font-size:17px">' + esc(exName(e)) + '</div><div class="rd-muted">' + ex.sets + ' × ' + esc(ex.reps) + (ex.kg ? ' · ' + dec(ex.kg, 0) + ' kg' : '') + '</div>' +
        '<div class="rd-vid">' + (e && e.yt ? '<img alt="" loading="lazy" src="https://i.ytimg.com/vi/' + encodeURIComponent(e.yt) + '/mqdefault.jpg">' : '') + '</div><div class="rd-sm rd-muted">' + ph.tech + ' · 0:42</div>' +
        '<div class="rd-sets">' + [1, 2, 3, 4].map(function (i) { return '<i class="' + (i <= P.sets ? 'on' : '') + '">' + ph.set + ' ' + i + '</i>'; }).join('') + '</div>' +
        '<button type="button" class="rd-btn ' + (P.sets >= 4 ? 'ok' : '') + '" style="width:100%;min-height:38px" data-a="ph-set" data-tour="ph-set"' + (P.sets >= 4 ? ' disabled' : '') + '>' + (P.sets >= 4 ? ic('check') + ph.done : ph.logSet) + '</button>' +
        '<div class="rd-pc" style="margin-top:10px">' + dy.ex.slice(1, 4).map(function (x) { var ee = S.E[x.e]; return '<div class="rd-ex">' + thumb(ee, 'sm') + '<div class="grow"><b style="font-size:12px">' + esc(exName(ee)) + '</b><span>' + x.sets + ' × ' + esc(x.reps) + '</span></div></div>'; }).join('') + '</div>';
    } else if (P.screen === 'chat') {
      var th = st.threads.filter(function (x) { return x.c === c.id; })[0];
      body = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span class="rd-av sm"><img src="' + BASE + S.trainer.photos[0] + '" alt=""></span><b>' + esc(S.trainer.name) + '</b></div>' +
        (th ? th.msgs.slice(-7).map(function (m) { return '<div class="rd-pmsg' + (m.me ? '' : ' me') + (m.fresh ? ' new' : '') + '">' + esc(m.body) + '</div>'; }).join('') : '<p class="rd-empty">' + ph.chatEmpty + '</p>');
    } else {
      body = '<div class="hi" style="font-size:17px">' + ph.tabs[3] + '</div><div class="dt">' + esc(c.name) + '</div>' + (myDues.length ? myDues.map(function (d) { return self.phDue(d, true); }).join('') : '<div class="rd-pc" style="text-align:center;color:var(--success)">' + ic('check').replace('<svg', '<svg style="width:22px;height:22px;margin:0 auto 4px"') + ph.allPaid + '</div>');
    }
    var tabs = ['home', 'workout', 'chat', 'pay'], icn = ['home', 'plans', 'messages', 'wallet'];
    scr.innerHTML = '<div class="rd-sb"><span>' + fT(new Date().toISOString()) + '</span><span>5G ▮▮▮</span></div><div class="rd-pb">' + body + '</div>' +
      '<nav class="rd-tabbar">' + tabs.map(function (k, i) { return '<button type="button" class="' + (P.screen === k ? 'on' : '') + '" data-a="ph-tab" data-v="' + k + '">' + ic(icn[i]) + ph.tabs[i] + '</button>'; }).join('') + '</nav>' +
      (P.push ? '<div class="rd-push"><img src="/assets/brand/favicon/favicon.svg" alt=""><div style="flex:1;min-width:0"><b>' + esc(P.push.title) + ' <small>· ' + t.now + '</small></b><span>' + esc(P.push.body) + '</span></div></div>' : '');
    if (P.screen === 'chat') { var pb = scr.querySelector('.rd-pb'); pb.scrollTop = pb.scrollHeight; }
  };
  D.phDue = function (d, full) {
    var t = this.t(), ph = t.ph, rep = d.status === 'reported';
    return '<div class="rd-pc' + (d.fresh ? ' new' : '') + '"><div class="lb" style="color:' + (this.dueState(d) === 'overdue' ? 'var(--danger)' : 'var(--accent)') + '">' + ph.pay + ' · ' + fD(d.due_date) + '</div><h5>' + zl(this.left(d)) + '</h5><div class="rd-muted" style="margin-bottom:8px">' + esc(this.dueTitle(d)) + '</div>' +
      (full && !rep ? '<div class="rd-sm rd-muted" style="margin-bottom:8px">' + ph.transfer + ': ' + esc(SNAP.trainer.bank) + '<br>' + ph.blik + '</div>' : '') +
      (rep ? '<div class="rd-tag wa">' + ph.reported + '</div>' : '<button type="button" class="rd-btn" style="width:100%" data-a="ph-paid" data-v="' + d.id + '">' + ic('check') + ph.paidBtn + '</button>') + '</div>';
  };

  // ------------------------------------------------------------------ charts (drawn after layout)
  D.drawLater = function () {
    var self = this;
    this.el.querySelectorAll('svg[data-chart]').forEach(function (svg) {
      var k = svg.getAttribute('data-chart');
      if (k === 'weight') self.chartWeight(svg, svg.getAttribute('data-v'));
      if (k === 'months') self.chartMonths(svg);
      if (k === 'forecast') self.chartForecast(svg);
    });
  };
  D.chartWeight = function (svg, id) {
    var x = SNAP.C[id]; if (!x) return;
    var w = x.weights.map(function (p) { return p[1]; }), W = 340, H = 120, p = 14;
    var lo = Math.min.apply(null, w.concat(x.target ? [x.target] : [])) - 0.6, hi = Math.max.apply(null, w) + 0.6;
    var X = function (i) { return p + i * (W - 2 * p) / Math.max(1, w.length - 1); }, Y = function (v) { return H - p - (v - lo) / (hi - lo) * (H - 2 * p); };
    var d = w.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
    svg.innerHTML = (x.target ? '<line x1="' + p + '" x2="' + (W - p) + '" y1="' + Y(x.target).toFixed(1) + '" y2="' + Y(x.target).toFixed(1) + '" stroke="#8e97a3" stroke-dasharray="4 4"/><text x="' + (W - p) + '" y="' + (Y(x.target) - 5).toFixed(1) + '" text-anchor="end">' + this.t().cl.target + ' ' + dec(x.target) + '</text>' : '') +
      '<path d="' + d + ' L' + X(w.length - 1).toFixed(1) + ' ' + (H - p) + ' L' + p + ' ' + (H - p) + 'Z" fill="#35d48322"/><path d="' + d + '" fill="none" stroke="#35d483" stroke-width="2.5" stroke-linejoin="round"/>' +
      w.map(function (v, i) { return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="' + (i === w.length - 1 ? 4 : 2.5) + '" fill="#35d483"/>'; }).join('') +
      '<text x="' + X(w.length - 1).toFixed(1) + '" y="' + (Y(w[w.length - 1]) - 9).toFixed(1) + '" text-anchor="end" style="fill:#f4f6f8;font-weight:800">' + dec(w[w.length - 1]) + ' kg</text>';
  };
  D.chartMonths = function (svg) {
    var ms = (SNAP.budget.overview.months || []).slice(), self = this;
    if (ms.length) ms[ms.length - 1] = Object.assign({}, ms[ms.length - 1], { received: this.received(ms[ms.length - 1].month) });
    var W = Math.max(280, svg.clientWidth || 560), H = 190, pb = 22, pt = 10, mx = Math.max.apply(null, ms.map(function (m) { return Math.max(m.received, m.expenses); }).concat([1])) * 1.1;
    var gw = (W - 20) / ms.length, bw = Math.min(26, gw / 3);
    var Y = function (v) { return H - pb - v / mx * (H - pb - pt); };
    var out = [1, 2, 3].map(function (i) { var v = mx / 3 * i; return '<line x1="10" x2="' + (W - 10) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="#242a31"/><text x="12" y="' + (Y(v) - 3).toFixed(1) + '">' + grp(Math.round(cv(v) / (LANG === 'en' ? 20 : 100)) * (LANG === 'en' ? 20 : 100)) + '</text>'; }).join('');
    ms.forEach(function (m, i) {
      var cx = 10 + gw * i + gw / 2;
      out += '<rect x="' + (cx - bw - 2).toFixed(1) + '" y="' + Y(m.received).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (H - pb - Y(m.received)).toFixed(1) + '" rx="4" fill="#35d483"/>' +
        '<rect x="' + (cx + 2).toFixed(1) + '" y="' + Y(m.expenses).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (H - pb - Y(m.expenses)).toFixed(1) + '" rx="4" fill="#ff4d8d" opacity=".85"/>' +
        '<text x="' + cx.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + fMonth(m.month, true) + '</text>';
    });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.height = H + 'px';
    svg.innerHTML = out; void self;
  };
  D.chartForecast = function (svg) {
    var F = SNAP.budget.forecast, self = this, st = this.st, goal = SNAP.trainer.goal || F.goal || 6000;
    var data = F.months.map(function (m) { return self.fcIncome(m, st.fcVar); });
    var W = Math.max(280, svg.clientWidth || 560), H = 210, pb = 22, pt = 12, mx = Math.max.apply(null, data.map(function (x) { return Math.max(x.total, x.costs); }).concat([goal])) * 1.12;
    var gw = (W - 20) / data.length, bw = Math.min(70, gw * 0.5);
    var Y = function (v) { return H - pb - v / mx * (H - pb - pt); };
    var out = '<line x1="10" x2="' + (W - 10) + '" y1="' + Y(goal).toFixed(1) + '" y2="' + Y(goal).toFixed(1) + '" stroke="#8e97a3" stroke-dasharray="5 5"/>';
    data.forEach(function (x, i) {
      var cx = 10 + gw * i + gw / 2, y0 = H - pb, on = i === st.fcM;
      ['paid', 'due', 'planned', 'renewal'].forEach(function (s) {
        if (!x[s]) return; var h = x[s] / mx * (H - pb - pt);
        out += '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (y0 - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + FC_COL[s] + '"' + (s === 'renewal' ? ' opacity=".7"' : '') + '/>';
        y0 -= h;
      });
      out += '<text x="' + cx.toFixed(1) + '" y="' + (y0 - 6).toFixed(1) + '" text-anchor="middle" style="fill:#f4f6f8;font-weight:800">' + grp(cv(x.total)) + '</text>' +
        '<line x1="' + (cx - bw / 2 - 6).toFixed(1) + '" x2="' + (cx + bw / 2 + 6).toFixed(1) + '" y1="' + Y(x.costs).toFixed(1) + '" y2="' + Y(x.costs).toFixed(1) + '" stroke="#ff7a45" stroke-width="3" stroke-linecap="round"/>' +
        '<text x="' + cx.toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" style="' + (on ? 'fill:#3ec6ff;font-weight:800' : '') + '">' + fMonth(F.months[i].month) + '</text>' +
        (on ? '<rect x="' + (cx - gw / 2 + 4).toFixed(1) + '" y="4" width="' + (gw - 8).toFixed(1) + '" height="' + (H - 8) + '" rx="8" fill="#3ec6ff0d" stroke="#3ec6ff33"/>' : '');
    });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.height = H + 'px';
    svg.innerHTML = out;
  };

  // ------------------------------------------------------------------ actions
  D.bind = function () {
    var self = this;
    this.el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b || !self.el.contains(b) || b.disabled) return;
      if (self.drag && self.drag.moved) return;
      self.act(b.getAttribute('data-a'), b.getAttribute('data-v'), b, e);
    });
    this.el.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-in'); if (!k) return;
      self.input(k, e.target.getAttribute('data-v'), e.target.value, e.target);
    });
    this.el.addEventListener('keydown', function (e) {
      if (e.target.getAttribute('data-in') === 'draft' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); self.act('send'); }
    });
    // calendar drag & drop (pointer events: mouse + touch)
    this.el.addEventListener('pointerdown', function (e) {
      var ev = e.target.closest('.rd-ev'); if (!ev || e.button > 0) return;
      var s = self.st.sessions.filter(function (x) { return x.id === ev.getAttribute('data-ev'); })[0]; if (!s) return;
      self.drag = { ev: ev, s: s, x: e.clientX, y: e.clientY, moved: false, canMove: s.status === 'confirmed' && !self.isPast(s) };
      try { ev.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or already released pointer */ }
    });
    this.el.addEventListener('pointermove', function (e) {
      var d = self.drag; if (!d) return;
      var dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) > 6 && d.canMove) { d.moved = true; d.ev.classList.add('drag'); }
      if (!d.moved) return;
      d.ev.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      self.el.querySelectorAll('.rd-week .col').forEach(function (c) { c.classList.remove('drop'); });
      var col = self.colAt(e.clientX, e.clientY); if (col) col.classList.add('drop');
    });
    var end = function (e) {
      var d = self.drag; if (!d) return;
      if (!d.moved) { self.drag = null; self.act('sessopen', d.s.id, d.ev, e); return; }
      var col = self.colAt(e.clientX, e.clientY);
      if (col) {
        var top = parseFloat(d.ev.style.top) + (e.clientY - d.y), mins = Math.round(((top / HH) * 60) / 30) * 30 + H0 * 60;
        var dur = Date.parse(d.s.end) - Date.parse(d.s.start);
        mins = Math.max(H0 * 60, Math.min(H1 * 60 - dur / 60000, mins));
        var day = self.weekDays(self.st.week)[+col.getAttribute('data-d')];
        var start = Date.parse(day + 'T00:00:00Z') + mins * 60000;
        if (start + dur > nowWall()) {
          d.s.start = new Date(start).toISOString(); d.s.end = new Date(start + dur).toISOString();
          var label = fWD(d.s.start) + ', ' + wall(d.s.start);
          self.toast(self.t().se.moved(label));
          self.push(d.s.c, self.t().se.pushT, label);
          self.tourCheck(d.ev, 'sess');
        }
      }
      setTimeout(function () { self.drag = null; }, 0);
      self.render();
    };
    this.el.addEventListener('pointerup', end);
    this.el.addEventListener('pointercancel', function () { if (self.drag) { self.drag = null; self.render(); } });
  };
  D.colAt = function (x, y) {
    var cols = this.el.querySelectorAll('.rd-week .col');
    for (var i = 0; i < cols.length; i++) { var r = cols[i].getBoundingClientRect(); if (x >= r.left && x < r.right && y >= r.top - 20 && y <= r.bottom + 20) return cols[i]; }
    return null;
  };
  D.input = function (k, v, val) {
    var st = this.st;
    if (k === 'csearch') { st.csearch = val; this.render(); }
    else if (k === 'lsearch') { st.lsearch = val; this.render(); }
    else if (k === 'draft') st.draft = val;
    else if (k === 'bio') { st.prof.bio = val; this.rerenderPreview(); }
    else if (k === 'price') {
      st.prof.prices[v] = Math.max(0, cvBack(Number(val) || 0)); st.prof.flash = true; this.rerenderPreview();
      this.later(700, function () { this.st.prof.flash = false; var b = this.el.querySelector('.rd-prev .from b'); if (b) b.classList.remove('flash'); });
      if (this.st.tour >= 0 && TOUR[this.st.tour].sel === '[data-tour=price]') this.tourNext();
    }
  };
  D.rerenderPreview = function () {
    var prev = this.el.querySelector('.rd-prev'); if (!prev) return;
    var wrap = prev.parentNode; wrap.innerHTML = this.vPreview();
  };
  D.openThread = function (cid, draft) {
    var st = this.st;
    st.mod = 'messages'; st.thread = cid;
    var th = st.threads.filter(function (x) { return x.c === cid; })[0];
    if (!th) { th = { c: cid, msgs: [], clientRead: null, trainerRead: null }; st.threads.unshift(th); }
    th.trainerRead = new Date().toISOString();
    if (draft != null) st.draft = draft;
  };
  D.act = function (a, v, el) {
    var st = this.st, S = SNAP, t = this.t(), self = this;
    switch (a) {
      case 'nav': st.mod = v; st.client = null; st.sess = null; break;
      case 'go': var p = v.split(':'); st.mod = p[0]; if (p[0] === 'budget') st.btab = +p[1] || 0; st.client = null; st.sess = null; break;
      case 'reset': this.reset(); return;
      case 'tour-restart': this.reset(); st = this.st; this.st.tour = 0; this.tourEnter(); break;
      case 'tour-skip': st.tour = -1; break;
      case 'tour-next': this.tourNext(); return;
      case 'client': st.mod = 'clients'; st.client = v; break;
      case 'close': st.client = null; st.sess = null; break;
      case 'cfilter': st.cfilter = v; break;
      case 'write': {
        var ov = this.overdue().filter(function (d) { return d.c === v; })[0], c0 = S.C[v];
        this.openThread(v, ov ? (LANG === 'pl' ? 'Cześć ' + c0.first + '! Przypominam o płatności ' + zl(this.left(ov)) + ' (termin ' + fD(ov.due_date) + '). Dzięki!' : 'Hi ' + c0.first + '! A quick reminder about the ' + zl(this.left(ov)) + ' payment (due ' + fD(ov.due_date) + '). Thanks!') : (S.templates[0] ? S.templates[0].body : ''));
        st.client = null; break;
      }
      case 'thread': this.openThread(v); st.draft = ''; break;
      case 'tpl': st.draft = S.templates[+v].body; break;
      case 'send': {
        var body = (st.draft || '').trim(); if (!body) return;
        var cid = st.thread, th = st.threads.filter(function (x) { return x.c === cid; })[0]; if (!th) return;
        th.msgs.push({ me: true, body: body, at: new Date().toISOString(), fresh: true }); st.draft = '';
        this.push(cid, S.trainer.name, body); st.phone.screen = 'chat';
        this.later(1400, function () { th.clientRead = new Date().toISOString(); this.render(); });
        this.later(2600, function () { this.st.typing = cid; this.render(); });
        this.later(4600, function () { this.st.typing = null; var r = t.ms.replies; th.msgs.push({ me: false, body: r[Math.floor(Math.random() * r.length)], at: new Date().toISOString(), fresh: true }); th.trainerRead = new Date().toISOString(); this.render(); });
        break;
      }
      case 'muscle': st.muscle = v; break;
      case 'plan': st.plan = +v; st.day = 0; st.sel = S.plans[+v].clients.filter(function (c) { return S.C[c] && S.C[c].plan !== 'meal_only'; }); st.sent = false; st.phone.plan = false; break;
      case 'day': st.day = +v; break;
      case 'add': { var k = st.plan + ':' + st.day; st.added[k] = (st.added[k] || []).concat([v]); break; }
      case 'sel': { var i = st.sel.indexOf(v); if (i >= 0) st.sel.splice(i, 1); else st.sel.push(v); break; }
      case 'assign': {
        if (!st.sel.length) return;
        st.sent = true; st.phone.plan = true; st.phone.screen = 'home'; st.phone.sets = 0;
        var who = st.sel.indexOf(st.phone.who) >= 0 ? st.phone.who : st.sel[0];
        this.toast(t.pl.toast(st.sel.length));
        this.push(who, t.ph.newPlan, t.ph.pushPlan(S.plans[st.plan].title));
        break;
      }
      case 'week': st.week = v === '0' ? 0 : st.week + +v; st.sess = null; break;
      case 'sessopen': st.mod = 'sessions'; st.sess = v; {
        var s0 = st.sessions.filter(function (x) { return x.id === v; })[0];
        if (s0) { var days = this.weekDays(0), off = Math.floor(diffD(s0.start.slice(0, 10), days[0]) / 7); st.week = off; }
      } break;
      case 'meet': this.toast(t.se.meetToast, 'info'); break;
      case 'att': {
        var s = st.sessions.filter(function (x) { return x.id === st.sess; })[0]; if (!s) return;
        s.att = v;
        var amt = v === 'no_show' ? Math.round(s.price * S.trainer.noShowPct / 100) : s.price;
        st.dues = st.dues.filter(function (d) { return !(d.booking === s.id); });
        st.dues.unshift({ id: 'n' + Date.now(), c: s.c, kind: 'session', booking: s.id, description: v === 'no_show' ? 'no_show' : null, amount_pln: amt, discount_pln: 0, paid_pln: 0, due_date: addD(s.start.slice(0, 10), S.trainer.terms), status: 'open', fresh: true });
        this.toast(v === 'no_show' ? t.se.noShowToast(S.trainer.noShowPct, zl(amt)) : t.se.attToast(zl(amt)));
        break;
      }
      case 'btab': st.btab = +v; st.mod = 'budget'; break;
      case 'dfilter': st.dfilter = v; break;
      case 'remind': {
        var d = st.dues.filter(function (x) { return x.id === v; })[0]; if (!d) return;
        d.reminded_demo = true; var cc = S.C[d.c];
        this.toast(t.bu.remToast(cc ? cc.name : ''), 'info');
        st.phone.screen = 'pay';
        this.push(d.c, t.bu.pushT, t.bu.pushB(zl(this.left(d)), fD(d.due_date)));
        break;
      }
      case 'paid': {
        var d2 = st.dues.filter(function (x) { return x.id === v; })[0]; if (!d2) return;
        var amt2 = this.left(d2); d2.paid_pln = Number(d2.paid_pln || 0) + amt2; d2.status = 'paid';
        st.payments.unshift({ c: d2.c, amount_pln: amt2, method: 'transfer', paid_on: this.today() });
        this.toast(t.bu.paidToast(zl(amt2)));
        break;
      }
      case 'fcvar': st.fcVar = v; break;
      case 'fcm': st.fcM = +v; break;
      case 'renew': { var cr = S.C[v]; this.openThread(v, t.bu.fc.draft(cr ? cr.first : '', fD(el.getAttribute('data-x')))); break; }
      case 'tag': { var j = st.prof.tags.indexOf(v); if (j >= 0) st.prof.tags.splice(j, 1); else st.prof.tags.push(v); break; }
      case 'photo': { var n = S.trainer.photos.length; st.prof.photo = v.charAt(0) === '=' ? +v.slice(1) : (st.prof.photo + +v + n) % n; break; }
      case 'ph-tab': st.phone.screen = v; break;
      case 'ph-start': st.phone.screen = 'workout'; st.phone.sets = 0; break;
      case 'ph-set': {
        st.phone.sets = Math.min(4, st.phone.sets + 1);
        var pl0 = st.sent ? S.plans[st.plan] : (this.planOf(st.phone.who) || S.plans[0]), dy = pl0.days[st.sent ? st.day : 0], ex = dy.ex[0], e0 = S.E[ex.e];
        st.feed.unshift({ c: st.phone.who, kind: st.phone.sets >= 4 ? 'ex' : 'set', txt: (st.phone.sets >= 4 ? t.ph.done : t.dash.set + ' ' + st.phone.sets + '/4') + ' · ' + exName(e0) + (ex.kg ? ' ' + dec(ex.kg, 0) + ' kg' : '') + ' × ' + ex.reps, at: new Date().toISOString() });
        break;
      }
      case 'ph-paid': {
        var d3 = st.dues.filter(function (x) { return x.id === v; })[0]; if (!d3) return;
        d3.status = 'reported'; d3.reported_at = new Date().toISOString();
        var c3 = S.C[d3.c]; this.toast(t.ph.repToast(c3 ? c3.name : '', zl(this.left(d3))), 'info');
        break;
      }
      default: return;
    }
    this.tourCheck(el);
    this.render();
  };

  // ------------------------------------------------------------------ guided tour
  // Each step: the module it lives in, the element to click, and enter() that
  // makes sure the state the step needs exists (when the user jumps with "Next").
  var TOUR = [
    { mod: 'dashboard', sel: '[data-tour=attn]' },
    { mod: 'clients', sel: '[data-tour=write]', enter: function () { if (!this.st.client) { var a = this.el.querySelector('[data-tour=attn]'); this.st.client = a ? a.getAttribute('data-v') : SNAP.clients[0].id; } } },
    { mod: 'messages', sel: '[data-tour=send]', enter: function () { if (!this.st.draft) this.openThread(this.st.thread || SNAP.clients[0].id, SNAP.templates[0] ? SNAP.templates[0].body : 'Hej!'); } },
    { mod: 'plans', sel: '[data-tour=add]' },
    { mod: 'plans', sel: '[data-tour=assign]' },
    { mod: 'plans', sel: '[data-tour=ph-start],[data-tour=ph-set]', phone: true, enter: function () { if (!this.st.sent) { this.st.sent = true; this.st.phone.plan = true; this.st.phone.screen = 'home'; } } },
    { mod: 'sessions', sel: '[data-tour=sess]', enter: function () {
      var u = this.unconfirmed().sort(function (a, b) { return a.start < b.start ? 1 : -1; })[0];
      if (u) this.st.week = Math.floor(diffD(u.start.slice(0, 10), this.weekDays(0)[0]) / 7);
    } },
    { mod: 'sessions', sel: '[data-tour=noshow]', enter: function () {
      var cur = this.st.sessions.filter(function (x) { return x.id === this.st.sess; }, this)[0];
      if (!cur || cur.att || !this.isPast(cur)) { var u = this.unconfirmed()[0]; if (u) { this.st.sess = u.id; this.st.week = Math.floor(diffD(u.start.slice(0, 10), this.weekDays(0)[0]) / 7); } }
    } },
    { mod: 'budget', sel: '[data-tour=remind]', enter: function () { this.st.btab = 1; this.st.dfilter = 'todo'; } },
    { mod: 'budget', sel: '[data-tour=fcvar]', enter: function () { this.st.btab = 3; } },
    { mod: 'profile', sel: '[data-tour=price]' },
    { mod: null, sel: null }
  ];
  D.tourEnter = function () {
    var s = TOUR[this.st.tour]; if (!s) { this.st.tour = -1; return; }
    if (s.mod && this.st.mod !== s.mod) { this.st.mod = s.mod; if (s.mod !== 'clients') this.st.client = null; if (s.mod !== 'sessions') this.st.sess = null; }
    if (s.enter) { this.render(); s.enter.call(this); }
  };
  D.tourNext = function () {
    if (this.st.tour < 0) return;
    this.st.tour++;
    if (this.st.tour >= TOUR.length) { this.st.tour = -1; this.render(); return; }
    var s = TOUR[this.st.tour];
    var ph = this.el.querySelector('.rd-phw');
    if (s.phone && (!ph || ph.offsetParent === null)) { this.st.tour++; s = TOUR[this.st.tour]; }
    this.tourEnter();
    this.render();
  };
  D.tourCheck = function (el, forced) {
    var st = this.st; if (st.tour < 0 || !el) return;
    var s = TOUR[st.tour]; if (!s || !s.sel) return;
    if ((forced && s.sel === '[data-tour=' + forced + ']') || (el.matches && el.matches(s.sel))) {
      var self = this;
      // let the click render first, then move on
      setTimeout(function () { if (self.st.tour === st.tour) self.tourNext(); }, s.phone ? 900 : 650);
    }
  };
  D.paintTour = function () {
    var bar = this.el.querySelector('.rd-tourbar'), t = this.t(), st = this.st;
    var old = this.el.querySelector('.rd-hint'); if (old) old.remove();
    this.el.querySelectorAll('.rd-hot').forEach(function (n) { n.classList.remove('rd-hot'); });
    if (this.o.mini) { bar.innerHTML = ''; return; }
    if (st.tour < 0) { bar.innerHTML = ''; return; }
    var s = TOUR[st.tour], last = st.tour === TOUR.length - 1;
    bar.innerHTML = '<div class="rd-tour"><span class="step">' + (st.tour + 1) + ' / ' + TOUR.length + '</span><p>' + t.tour.steps[st.tour] + '</p><div class="acts">' +
      (last ? (this.o.cta ? '<a class="rd-btn" href="' + this.o.cta.href + '">' + esc(this.o.cta[LANG] || this.o.cta.pl) + '</a>' : '') + '<button type="button" class="rd-btn ghost" data-a="tour-skip">' + t.tour.done + '</button>' :
        '<button type="button" class="rd-btn ghost sm" data-a="tour-skip">' + t.tour.skip + '</button><button type="button" class="rd-btn sm" data-a="tour-next">' + t.tour.next + ' →</button>') + '</div></div>';
    if (!s.sel) return;
    var target = this.el.querySelector(s.sel);
    if (!target) return;
    target.classList.add('rd-hot');
    this.hotEl = target;
    var hint = document.createElement('div'); hint.className = 'rd-hint'; hint.textContent = t.tour.hint;
    this.el.appendChild(hint);
    // scroll the target into the panel's view (not the page)
    var main = this.mainEl;
    if (main.contains(target)) {
      var r = target.getBoundingClientRect(), m = main.getBoundingClientRect();
      if (r.top < m.top + 40 || r.bottom > m.bottom - 20) main.scrollTop += r.top - m.top - m.height / 3;
    }
    var scroller = target.closest('.rd-scroll');
    if (scroller) { var r2 = target.getBoundingClientRect(), m2 = scroller.getBoundingClientRect(); if (r2.top < m2.top || r2.bottom > m2.bottom) scroller.scrollTop += r2.top - m2.top - 10; }
    this.placeHint();
  };
  D.placeHint = function () {
    var hint = this.el.querySelector('.rd-hint'); if (!hint || !this.hotEl) return;
    var r = this.hotEl.getBoundingClientRect(), o = this.el.getBoundingClientRect();
    var m = this.mainEl.getBoundingClientRect();
    var inMain = this.mainEl.contains(this.hotEl);
    var visible = r.width > 0 && (!inMain || (r.bottom > m.top && r.top < m.bottom));
    hint.style.display = visible ? '' : 'none';
    hint.style.left = (r.left - o.left + r.width / 2) + 'px';
    hint.style.top = (r.top - o.top) + 'px';
  };

  D.go = function (m) {
    var p = String(m).split(':');
    this.st.mod = p[0]; if (p[1] != null) this.st.btab = +p[1];
    this.st.client = null; this.st.sess = null; this.st.tour = -1;
    this.render();
  };
  D.startScreens = function () {
    var self = this, list = this.o.screens, i = 0;
    this.st.phone.screen = list[0]; this.render();
    setInterval(function () {
      if (document.hidden || self.hover) return;
      i = (i + 1) % list.length; self.st.phone.screen = list[i]; self.render();
    }, this.o.screensMs || 4200);
    this.el.addEventListener('pointerenter', function () { self.hover = true; });
    this.el.addEventListener('pointerleave', function () { self.hover = false; });
  };

  // ------------------------------------------------------------------ hero autoplay
  D.startCycle = function () {
    var self = this, mods = this.o.cycle, i = 0;
    var notes = {
      pl: ['Kasia W.: trening ukończony', 'Zapisano wpłatę 400 zł', 'Nowa wiadomość od Tomka Z.', 'Sesja przeniesiona na czwartek 17:00'],
      en: ['Kasia W.: workout completed', 'Payment of £80 recorded', 'New message from Tomek Z.', 'Session moved to Thursday 17:00']
    };
    setInterval(function () {
      if (document.hidden) return;
      i = (i + 1) % mods.length;
      var m = mods[i].split(':'); self.st.mod = m[0]; if (m[1]) self.st.btab = +m[1];
      self.toast(notes[LANG][i % notes[LANG].length], i % 2 ? 'info' : 'ok');
      self.render();
    }, this.o.cycleMs || 3800);
  };

  // ------------------------------------------------------------------ public api
  window.RamvoDemo = {
    mount: function (el, opts) {
      return load().then(function () { var d = new Demo(el, opts); instances.push(d); return d; })
        .catch(function (err) { el.innerHTML = '<p style="color:#8e97a3;text-align:center;padding:40px 0">Demo niedostępne / demo unavailable</p>'; if (window.console) console.error(err); });
    },
    setLang: function (l) { if (!TXT[l]) return; LANG = l; instances.forEach(function (d) { d.render(); }); },
    instances: instances
  };
})();
