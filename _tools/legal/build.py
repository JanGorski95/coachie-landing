"""Build the /legal/ pages from the sources in this folder.

    python _tools/legal/build.py

Sources: docs/<slug>.pl.html and docs/<slug>.en.html. Each starts with a
meta block:

    <!--meta
    title: Regulamin
    description: one line for <meta name="description">
    -->

followed by <section id="..."><h2>...</h2>...</section> blocks. Every <h2>
becomes an entry in the table of contents.

The operator (who provides the service) lives only in operator.json, so
switching from the sole trader to Ramvo Ltd is a one-file change; the
{{OPERATOR}}, {{OPERATOR_SHORT}}, {{EMAIL}}, {{ADDRESS}} and {{REGISTRATION}}
placeholders are filled from it. {{VERSION}} and {{EFFECTIVE}} come from
DOCS below. Output: legal/<slug>/index.html and the hub legal/index.html.
"""
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'legal')

# slug, version, effective date (ISO), nav label pl/en, hub blurb pl/en, icon
DOCS = [
    ('terms', '2.0', '2026-11-26', 'Regulamin', 'Terms of Service',
     'Zasady korzystania z Ramvo dla wszystkich: konto, zdrowie, trenerzy, treści, odpowiedzialność, reklamacje.',
     'The rules for everyone using Ramvo: account, health, trainers, content, liability, complaints.', 'doc'),
    ('subscriptions', '1.1', '2026-11-26', 'Subskrypcje i płatności', 'Subscriptions and payments',
     'Plany, okresy próbne, odnowienia, rezygnacja, 14 dni na odstąpienie, zwroty, zakupy w App Store i Google Play.',
     'Plans, trials, renewals, cancelling, the 14-day right to cancel, refunds, App Store and Google Play purchases.', 'card'),
    ('trainers', '1.1', '2026-11-26', 'Warunki dla trenerów', 'Trainer Terms',
     'Umowa B2B dla trenerów: plany i limity klientów, treści i filmy, obowiązki wobec danych klientów.',
     'The B2B agreement for trainers: plans and client limits, content and videos, duties for client data.', 'briefcase'),
    ('privacy', '2.0', '2026-11-26', 'Polityka prywatności', 'Privacy Policy',
     'Jakie dane zbieramy, po co, na jakiej podstawie, komu je powierzamy, jak długo trzymamy i jakie masz prawa.',
     'What data we collect, why, on what legal basis, who processes it, how long we keep it and your rights.', 'shield'),
    ('ai', '1.0', '2026-11-26', 'Ramvo AI', 'Ramvo AI',
     'Czym jest Ramvo AI, jakie ma ograniczenia, jakie dane do niego trafiają i jak oznaczamy treści AI.',
     'What Ramvo AI is, its limits, what data it receives and how we label AI content.', 'spark'),
    ('community', '1.0', '2026-11-26', 'Zasady społeczności', 'Community Guidelines',
     'Co jest zabronione, jak zgłosić treść lub osobę, jak podejmujemy decyzje i jak się od nich odwołać.',
     'What is not allowed, how to report content or a person, how we decide and how to appeal.', 'flag'),
    ('cookies', '1.0', '2026-11-26', 'Pliki cookie i podobne technologie', 'Cookies and similar technologies',
     'Co zapisujemy w przeglądarce i w aplikacji, po co, i jak to wyłączyć.',
     'What we store in your browser and in the app, why, and how to turn it off.', 'cookie'),
]

ICONS = {
    'doc': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    'card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    'briefcase': '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
    'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    'spark': '<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2L12 3z"/>',
    'flag': '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
    'cookie': '<circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="9" r="1"/><circle cx="14" cy="14.5" r="1"/><circle cx="15" cy="8" r="1"/><circle cx="9" cy="15" r="1"/>',
}

MONTHS = {
    'pl': ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'],
    'en': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

UI = {
    'pl': {'effective': 'Obowiązuje od {d} · wersja {v}', 'toc': 'Spis treści', 'docs': 'Dokumenty', 'home': '← Strona główna',
           'hub.title': 'Dokumenty prawne Ramvo', 'hub.lede': 'Wszystkie zasady w jednym miejscu. Każdy dokument zaczyna się krótkim podsumowaniem, a pełna treść jest podzielona na numerowane paragrafy.',
           'hub.provider': 'Usługodawca', 'hub.contact': 'Kontakt', 'print': 'Drukuj / zapisz PDF',
           'draft': ''},
    'en': {'effective': 'Effective from {d} · version {v}', 'toc': 'Contents', 'docs': 'Documents', 'home': '← Home',
           'hub.title': 'Ramvo legal documents', 'hub.lede': 'All the rules in one place. Each document starts with a short summary, and the full text is split into numbered sections.',
           'hub.provider': 'Provider', 'hub.contact': 'Contact', 'print': 'Print / save as PDF',
           'draft': ''},
}


def fmt_date(iso, lang):
    y, m, d = (int(x) for x in iso.split('-'))
    return f'{d} {MONTHS[lang][m - 1]} {y}' if lang == 'pl' else f'{d} {MONTHS[lang][m - 1]} {y}'


def load(slug, lang):
    with open(os.path.join(HERE, 'docs', f'{slug}.{lang}.html'), encoding='utf8') as f:
        src = f.read()
    m = re.match(r'\s*<!--meta\n(.*?)\n-->\n', src, re.S)
    if not m:
        raise SystemExit(f'{slug}.{lang}: missing meta block')
    meta = dict(line.split(': ', 1) for line in m.group(1).splitlines() if line.strip())
    return meta, src[m.end():]


def fill(text, op, lang, version, effective):
    o = op[lang]
    rep = {
        '{{OPERATOR}}': o['full'], '{{OPERATOR_SHORT}}': o['short'], '{{EMAIL}}': f'<a href="mailto:{op["email"]}">{op["email"]}</a>',
        '{{ADDRESS}}': o['address'], '{{REGISTRATION}}': o['registration'], '{{VERSION}}': version, '{{EFFECTIVE}}': fmt_date(effective, lang),
    }
    for k, v in rep.items():
        text = text.replace(k, v)
    left = re.findall(r'\{\{[A-Z_]+\}\}', text)
    if left:
        raise SystemExit(f'unfilled placeholders: {left}')
    return text


def toc(body):
    items = re.findall(r'<section id="([^"]+)">\s*<h2>(.*?)</h2>', body, re.S)
    return ''.join(f'<li><a href="#{i}">{t}</a></li>' for i, t in items)


def nav(active, lang):
    links = ''.join(
        '<a href="/legal/%s/"%s>%s</a>' % (d[0], ' aria-current="page"' if d[0] == active else '', d[3] if lang == 'pl' else d[4]) for d in DOCS)
    return links


CSS = open(os.path.join(HERE, 'legal.css'), encoding='utf8').read()
JS = open(os.path.join(HERE, 'legal.js'), encoding='utf8').read()


def page(title_pl, title_en, desc_pl, url, body_by_lang, active):
    head = f'''<!doctype html>
<html lang="pl" data-lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title_pl)} · Ramvo</title>
<meta name="description" content="{html.escape(desc_pl)}">
<meta name="theme-color" content="#0B0D10">
<link rel="canonical" href="https://ramvo.app{url}">
<link rel="icon" href="/assets/brand/favicon/favicon.ico" sizes="any">
<link rel="icon" href="/assets/brand/favicon/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/brand/favicon/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ramvo">
<meta property="og:title" content="{html.escape(title_pl)} · Ramvo">
<meta property="og:description" content="{html.escape(desc_pl)}">
<meta property="og:image" content="https://ramvo.app/assets/brand/ramvo-og-1200x630-1200.png">
<meta property="og:url" content="https://ramvo.app{url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@800&family=Manrope:wght@400;600;700;800&display=swap">
<style>
{CSS}
</style>
</head>
<body>
<!-- Generated by _tools/legal/build.py - edit the sources there, not this file. -->
<header class="top">
  <a href="/" class="wordmark"><img src="/assets/brand/ramvo-wordmark-ciemne-tlo.svg" alt="Ramvo" height="34"></a>
  <div class="top-right">
    <button type="button" class="print" onclick="window.print()"><span data-l="pl">{UI['pl']['print']}</span><span data-l="en">{UI['en']['print']}</span></button>
    <div class="lang-switch" role="group" aria-label="Language"><button type="button" data-lang="pl">PL</button><button type="button" data-lang="en">EN</button></div>
  </div>
</header>
<div class="shell">
'''
    parts = []
    for lang in ('pl', 'en'):
        parts.append(f'''<div class="lang-block" data-l="{lang}" lang="{lang}">
  <aside class="side">
    <nav class="docs" aria-label="{UI[lang]['docs']}">
      <div class="side-h">{UI[lang]['docs']}</div>
      <a href="/legal/"{' aria-current="page"' if active == 'hub' else ''}>{'Wszystkie dokumenty' if lang == 'pl' else 'All documents'}</a>
      {nav(active, lang)}
      <a href="/" class="home">{UI[lang]['home']}</a>
    </nav>
  </aside>
  <main class="doc">
{body_by_lang[lang]}
  </main>
</div>
''')
    foot = f'''</div>
<footer class="foot"><span data-l="pl">Ramvo · info@ramvo.app</span><span data-l="en">Ramvo · info@ramvo.app</span></footer>
<script>
{JS}
</script>
</body>
</html>
'''
    return head + ''.join(parts) + foot


def main():
    op = json.load(open(os.path.join(HERE, 'operator.json'), encoding='utf8'))
    for slug, version, effective, nav_pl, nav_en, blurb_pl, blurb_en, icon in DOCS:
        bodies = {}
        metas = {}
        for lang in ('pl', 'en'):
            meta, body = load(slug, lang)
            body = fill(body, op, lang, version, effective)
            # both languages share one page: prefix ids and in-page links
            body = re.sub(r'id="([^"]+)"', lambda m: f'id="{lang}-{m.group(1)}"', body)
            body = re.sub(r'href="#([^"]+)"', lambda m: f'href="#{lang}-{m.group(1)}"', body)
            metas[lang] = meta
            eff = UI[lang]['effective'].format(d=fmt_date(effective, lang), v=version)
            bodies[lang] = f'''    <h1>{meta['title']}</h1>
    <p class="updated">{eff}</p>
    <details class="toc" open><summary>{UI[lang]['toc']}</summary><ol>{toc(body)}</ol></details>
{body}'''
        out_dir = os.path.join(OUT, slug)
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf8', newline='\n') as f:
            f.write(page(metas['pl']['title'], metas['en']['title'], metas['pl']['description'], f'/legal/{slug}/', bodies, slug))

    # hub
    hub = {}
    for lang in ('pl', 'en'):
        o = op[lang]
        cards = ''.join(
            f'''<a class="card" href="/legal/{d[0]}/"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[d[7]]}</svg></span>
<span class="card-t">{d[3] if lang == 'pl' else d[4]}</span><span class="card-s">{d[5] if lang == 'pl' else d[6]}</span>
<span class="card-v">{UI[lang]['effective'].format(d=fmt_date(d[2], lang), v=d[1])}</span></a>''' for d in DOCS)
        hub[lang] = f'''    <h1>{UI[lang]['hub.title']}</h1>
    <p class="lede">{UI[lang]['hub.lede']}</p>
    <div class="cards">{cards}</div>
    <div class="provider">
      <div><div class="side-h">{UI[lang]['hub.provider']}</div><p>{o['full']}</p><p>{o['address']}</p><p>{o['registration']}</p></div>
      <div><div class="side-h">{UI[lang]['hub.contact']}</div><p><a href="mailto:{op['email']}">{op['email']}</a></p><p>{o['response']}</p></div>
    </div>'''
    with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8', newline='\n') as f:
        f.write(page('Dokumenty prawne', 'Legal documents', 'Regulamin, polityka prywatności, warunki subskrypcji i pozostałe dokumenty prawne Ramvo.', '/legal/', hub, 'hub'))
    print('built', len(DOCS), 'documents + hub')


if __name__ == '__main__':
    main()
