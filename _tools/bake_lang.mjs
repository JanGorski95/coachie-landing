// Bakes one language of a page's inline i18n dictionary into its static HTML,
// so crawlers, link previews and the first paint show that language.
// Polish (or English) still comes from the page's own JS at runtime.
//
// Usage: node _tools/bake_lang.mjs <file.html> <dictVar> <lang>
//   e.g. node _tools/bake_lang.mjs index.html TRANSLATIONS en
//        node _tools/bake_lang.mjs trainers/index.html P en
// Run it again after editing the dictionary (it is idempotent).
import fs from 'node:fs'

const [file, dictVar, lang] = process.argv.slice(2)
if (!file || !dictVar || !lang) {
  console.error('usage: node _tools/bake_lang.mjs <file.html> <dictVar> <lang>')
  process.exit(1)
}
let html = fs.readFileSync(file, 'utf8')

// ---- extract the dictionary literal: `var <dictVar> = { ... };` (balanced braces, string-aware)
function extractLiteral(src, name) {
  const m = new RegExp(`(?:var|const|let)\\s+${name}\\s*=\\s*\\{`).exec(src)
  if (!m) throw new Error(`dictionary ${name} not found`)
  let i = m.index + m[0].length - 1
  const start = i
  let depth = 0
  let quote = null
  for (; i < src.length; i++) {
    const c = src[i]
    if (quote) {
      if (c === '\\') { i++; continue }
      if (c === quote) quote = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue }
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1) }
  }
  throw new Error('unbalanced dictionary literal')
}
const dict = new Function(`return (${extractLiteral(html, dictVar)})`)()[lang]
if (!dict) throw new Error(`no "${lang}" block in ${dictVar}`)

// ---- replace inner HTML of every element carrying data-i18n="key"
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])
let out = ''
let pos = 0
let replaced = 0
const missing = []
const openRe = /<([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>/g
// Only work outside <script> and <style> blocks.
const scriptRanges = []
for (const m of html.matchAll(/<(script|style)\b[\s\S]*?<\/\1>/gi)) scriptRanges.push([m.index, m.index + m[0].length])
const inScript = (i) => scriptRanges.some(([a, b]) => i >= a && i < b)

let m
while ((m = openRe.exec(html))) {
  if (inScript(m.index)) continue
  const tag = m[1].toLowerCase()
  const key = m[2]
  if (VOID.has(tag)) continue
  const innerStart = m.index + m[0].length
  // find the matching close tag, counting nested same-name tags
  const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi')
  tagRe.lastIndex = innerStart
  let depth = 1
  let t
  let innerEnd = -1
  while ((t = tagRe.exec(html))) {
    if (t[1]) depth--
    else if (!t[0].endsWith('/>')) depth++
    if (depth === 0) { innerEnd = t.index; break }
  }
  if (innerEnd < 0) throw new Error(`no closing </${tag}> for ${key}`)
  if (!(key in dict)) { missing.push(key); continue }
  out += html.slice(pos, innerStart) + dict[key]
  pos = innerEnd
  openRe.lastIndex = innerEnd
  replaced++
}
out += html.slice(pos)
html = out

// ---- attributes: data-i18n-placeholder / data-i18n-aria-label
for (const [attr, target] of [['data-i18n-placeholder', 'placeholder'], ['data-i18n-aria-label', 'aria-label']]) {
  html = html.replace(new RegExp(`<[^>]*\\s${attr}="([^"]+)"[^>]*>`, 'g'), (tagText, key) => {
    if (!(key in dict)) return tagText
    const val = String(dict[key]).replace(/"/g, '&quot;')
    const re = new RegExp(`(\\s${target}=")[^"]*(")`)
    return re.test(tagText) ? tagText.replace(re, `$1${val}$2`) : tagText.replace(/\s*\/?>$/, (end) => ` ${target}="${val}"${end}`)
  })
}

// ---- <html lang>
html = html.replace(/<html lang="[a-z-]+"/, `<html lang="${lang}"`)

fs.writeFileSync(file, html)
console.log(`${file}: ${replaced} elements -> ${lang}${missing.length ? `, ${missing.length} keys missing in ${lang}: ${missing.join(', ')}` : ''}`)
