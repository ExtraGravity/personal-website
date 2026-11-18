// Post-build steps, run after `vite build` (see the "build" script).
//
// 1. sitemap.xml
// 2. One HTML file per route (dist/about/index.html, dist/games/<slug>/index.html)
//    with that page's title, description, canonical, Open Graph tags and
//    JSON-LD (schema.org) data, so
//    crawlers and link previews get them without running JS. Only the <head>
//    differs: #app stays empty and the app starts exactly as it does from
//    dist/index.html (intro, warp and all).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  games, formatHours, SITE_TITLE, HOME_TITLE, ABOUT_TITLE, gameTitle, JELLY, JUPITER, PITCH,
} from '../src/lib/games.js'

const SITE = 'https://bettertogethergaming.com'
// link-preview image (public/og-image.png, made by scripts/og-image.sh)
const OG_IMAGE = {
  url: `${SITE}/og-image.png`,
  width: 1200,
  height: 630,
  alt: `${SITE_TITLE}: co-op game reviews`,
}
const dist = fileURLToPath(new URL('../dist/', import.meta.url))

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
}

/* plain text cut to `max` characters at a word boundary; sentences with a
   link in them are dropped rather than left dangling ("watch it at") */
function clip(text, max = 160) {
  const s = text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !/https?:\/\//.test(sentence))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:–-]+$/, '') + '…'
}

/* Every page: path, title (same as router.js sets), description, og:type.
   Game descriptions only use the spoiler-free fields. */
function pages() {
  const list = {
    path: '/',
    title: HOME_TITLE,
    description:
      `${JELLY} and ${JUPITER} review the co-op games they play together: scores, hours played, ` +
      `how many players each works for and what it costs per person. ${games.length} games so far.`,
    type: 'website',
    body: listBody(),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_TITLE,
      url: `${SITE}/`,
      description: `Co-op game reviews by ${JELLY} and ${JUPITER}.`,
    },
  }
  const about = {
    path: '/about',
    title: ABOUT_TITLE,
    description:
      `How ${JELLY} and ${JUPITER} score co-op games, and what the columns, tags and ` +
      `player-count colours on ${SITE_TITLE} mean.`,
    type: 'website',
    body: aboutBody(),
  }
  const gamePages = games.map((g) => {
    const lead = `${g.name}: ${g.avg}/10 from ${JELLY} and ${JUPITER} after ${formatHours(g.hours)} of co-op.`
    const more = g.whyPlay || g.enochBlurb || g.moBlurb || ''
    return {
      path: `/games/${g.slug}`,
      title: gameTitle(g),
      description: clip(more ? `${lead} ${more}` : lead),
      type: 'article',
      body: gameBody(g),
      jsonLd: gameReviews(g),
    }
  })
  return [list, about, ...gamePages]
}

/* ── Page text for crawlers that don't run JS ─────────
   Plain HTML inside #app, hidden with CSS. The app clears #app when it
   mounts and renders as usual (intro, warp and all), so visitors never see
   this; crawlers that skip JS skip CSS too and read it. Spoiler-free text
   only, same as the descriptions. */
const h = escapeXml
const paras = (text) =>
  String(text)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${h(p)}</p>`)
    .join('')
const gameLink = (g) => `<a href="/games/${g.slug}">${h(g.name)}</a>`

function listBody() {
  const items = games.map((g) => `<li>${gameLink(g)}: ${g.avg}/10</li>`).join('')
  return (
    `<header><h1>${h(SITE_TITLE)}</h1><p>Co-op game reviews</p></header>` +
    `<p>${h(PITCH)}</p>` +
    `<ol>${items}</ol>` +
    `<p><a href="/about">About</a></p>`
  )
}

function aboutBody() {
  return (
    `<h1>About</h1>` +
    `<p>${h(`We're ${JELLY} and ${JUPITER} and we like to play co-op games together. When we finish a game (or give up on it) we each score it out of 10 and write down what we thought.`)}</p>` +
    `<p><a href="/">All reviews</a></p>`
  )
}

function gameBody(g) {
  const out = [`<p><a href="/">${h(SITE_TITLE)}</a></p>`, `<article><h1>${h(g.name)}</h1>`]
  out.push(
    `<p>${h(`Score ${g.avg}/10 · ${JELLY} ${g.enoch} · ${JUPITER} ${g.mo}${g.guest ? ` · ${g.guest.name}${g.guest.score != null ? ` ${g.guest.score}` : ''} (guest)` : ''} · ${formatHours(g.hours)} played`)}</p>`,
  )
  if (g.whyPlay) out.push(`<p>${h(`Why you should play this game: ${g.whyPlay}`)}</p>`)
  if (g.note) out.push(paras(g.note))
  if (g.playersBlurb || g.coopBlurb) {
    out.push(`<h2>Players</h2>`, paras(g.playersBlurb || ''), paras(g.coopBlurb || ''))
  }
  if (g.costBlurb) out.push(`<h2>Cost</h2>`, paras(g.costBlurb))
  if (g.enochBlurb) out.push(`<h2>${h(JELLY)}'s review</h2>`, paras(g.enochBlurb))
  if (g.moBlurb) out.push(`<h2>${h(JUPITER)}'s review</h2>`, paras(g.moBlurb))
  if (g.guest?.blurb) out.push(`<h2>${h(g.guest.name)}'s review</h2>`, paras(g.guest.blurb))
  // recommendations: names in the data, resolved like GameView.vue does
  const r = g.recommends || {}
  const find = (name) => games.find((x) => x.name === name)
  const recs = [...(r.top ? [r.top] : []), ...(r.also || [])].map(find).filter(Boolean)
  if (recs.length) {
    out.push(
      `<h2>${h(`If you liked ${g.name}`)}</h2>`,
      `<ul>${recs.map((x) => `<li>${gameLink(x)}</li>`).join('')}</ul>`,
    )
  }
  if (g.steamUrl) out.push(`<p><a href="${h(g.steamUrl)}">View on Steam</a></p>`)
  out.push('</article>')
  return out.join('')
}

/* One schema.org Review per reviewer, rated out of 10, about the game.
   Only spoiler-free text goes in reviewBody. */
function gameReviews(g) {
  const url = `${SITE}/games/${g.slug}`
  const game = { '@type': 'VideoGame', name: g.name, ...(g.steamUrl && { sameAs: g.steamUrl }) }
  const review = (name, score, body) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    url,
    itemReviewed: game,
    author: { '@type': 'Person', name },
    reviewRating: { '@type': 'Rating', ratingValue: score, bestRating: 10, worstRating: 0 },
    publisher: { '@type': 'Organization', name: SITE_TITLE, url: `${SITE}/` },
    ...(body && { reviewBody: body }),
    ...(g.reviewed && { datePublished: g.reviewed }),
    ...(g.updated && { dateModified: g.updated }),
  })
  const out = [review(JELLY, g.enoch, g.enochBlurb), review(JUPITER, g.mo, g.moBlurb)]
  if (g.guest?.score != null) out.push(review(g.guest.name, g.guest.score, g.guest.blurb))
  return out
}

/* JSON inside <script>: escape "<" so review text can never close the tag */
const jsonLdTag = (data) =>
  `    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

/* lastmod only where the data has a real date (`updated`, else `reviewed`):
   a guessed date is worse than none. The list page takes the newest game
   date, since it changes whenever a game does. */
function lastmods(all) {
  const byPath = {}
  for (const g of games) {
    const d = g.updated || g.reviewed
    if (d) byPath[`/games/${g.slug}`] = d
  }
  const newest = Object.values(byPath).sort().pop()
  if (newest) byPath['/'] = newest
  return byPath
}

function writeSitemap(all) {
  const mods = lastmods(all)
  const body = all
    .map((p) => {
      const mod = mods[p.path] ? `<lastmod>${mods[p.path]}</lastmod>` : ''
      return `  <url><loc>${escapeXml(SITE + p.path)}</loc>${mod}</url>`
    })
    .join('\n')
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    '\n</urlset>\n'
  writeFileSync(join(dist, 'sitemap.xml'), xml)
  console.log(`sitemap.xml: ${all.length} URLs`)
}

function headTags(p) {
  const url = SITE + p.path
  const tags = [
    ['meta', { name: 'description', content: p.description }],
    ['link', { rel: 'canonical', href: url }],
    ['meta', { property: 'og:site_name', content: SITE_TITLE }],
    ['meta', { property: 'og:type', content: p.type }],
    ['meta', { property: 'og:title', content: p.title }],
    ['meta', { property: 'og:description', content: p.description }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { property: 'og:image', content: OG_IMAGE.url }],
    ['meta', { property: 'og:image:width', content: OG_IMAGE.width }],
    ['meta', { property: 'og:image:height', content: OG_IMAGE.height }],
    ['meta', { property: 'og:image:alt', content: OG_IMAGE.alt }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ]
  const lines = tags.map(([tag, attrs]) => {
    const a = Object.entries(attrs).map(([k, v]) => `${k}="${escapeXml(v)}"`).join(' ')
    return `    <${tag} ${a} />`
  })
  if (p.jsonLd) lines.push(jsonLdTag(p.jsonLd))
  return lines.join('\n')
}

function writePages(all) {
  const template = readFileSync(join(dist, 'index.html'), 'utf8')
  const APP = '<div id="app"></div>'
  if (!/<title>[\s\S]*?<\/title>/.test(template) || !template.includes('</head>') || !template.includes(APP)) {
    throw new Error('dist/index.html: no <title>, </head> or empty #app to fill in')
  }
  for (const p of all) {
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeXml(p.title)}</title>`)
      .replace(/\s*<\/head>/, `\n${headTags(p)}\n    <style>.prerender { display: none; }</style>\n  </head>`)
      .replace(APP, p.body ? `<div id="app"><div class="prerender">${p.body}</div></div>` : APP)
    const dir = join(dist, p.path)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), html)
  }
  console.log(`pages: ${all.length} index.html files with their own head tags`)
}

/* dist/404.html, served by nginx (`error_page 404 /404.html`) for unknown
   paths. Same head, fonts and stylesheet as the site, but without the app's
   script: the router sends unknown paths to "/", which would hide the 404.
   noindex so it never shows up in search. Asset URLs in the template are
   absolute, so it works at any depth (/games/nope too). */
function write404(template) {
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeXml(`Page not found · ${SITE_TITLE}`)}</title>`)
    .replace(/\s*<script type="module"[^>]*><\/script>/, '')
    .replace(
      /\s*<\/head>/,
      `
    <meta name="robots" content="noindex" />
    <style>
      .notfound {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.2rem;
        padding: 2rem 16px;
        text-align: center;
      }
      .notfound .code {
        font-family: var(--font-display);
        font-size: clamp(5rem, 22vw, 9rem);
        line-height: 1;
        letter-spacing: 0.06em;
        color: var(--accent);
        text-shadow: 0 0 18px rgba(42, 245, 255, 0.45);
      }
      .notfound .msg {
        font-family: var(--font-hud);
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: var(--text-dim);
      }
      .notfound p { font-family: var(--font-body); color: var(--text-body); max-width: 32rem; }
      .notfound a {
        font-family: var(--font-hud);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        text-decoration: none;
        border: 1px solid var(--accent-dim);
        padding: 0.7rem 1.2rem;
      }
      .notfound a:hover { border-color: var(--accent); }
    </style>
  </head>`,
    )
    .replace(
      '<div id="app"></div>',
      `<main class="notfound">
      <div class="code">404</div>
      <div class="msg">Page not found</div>
      <p>${escapeXml(`There's nothing here. The game you're looking for might not be reviewed yet.`)}</p>
      <a href="/">All reviews</a>
    </main>`,
    )
  if (html.includes('type="module"') || !html.includes('class="notfound"')) {
    throw new Error('404.html: could not remove the app script or add the page body')
  }
  writeFileSync(join(dist, '404.html'), html)
  console.log('404.html: written')
}

const all = pages()
const template = readFileSync(join(dist, 'index.html'), 'utf8')
writeSitemap(all)
writePages(all)
write404(template)
