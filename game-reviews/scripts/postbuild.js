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
  games, formatHours, SITE_TITLE, HOME_TITLE, ABOUT_TITLE, gameTitle, JELLY, JUPITER,
} from '../src/lib/games.js'

const SITE = 'https://enochtsang.com'
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
  }
  const gamePages = games.map((g) => {
    const lead = `${g.name}: ${g.avg}/10 from ${JELLY} and ${JUPITER} after ${formatHours(g.hours)} of co-op.`
    const more = g.whyPlay || g.enochBlurb || g.moBlurb || ''
    return {
      path: `/games/${g.slug}`,
      title: gameTitle(g),
      description: clip(more ? `${lead} ${more}` : lead),
      type: 'article',
      jsonLd: gameReviews(g),
    }
  })
  return [list, about, ...gamePages]
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
  return [review(JELLY, g.enoch, g.enochBlurb), review(JUPITER, g.mo, g.moBlurb)]
}

/* JSON inside <script>: escape "<" so review text can never close the tag */
const jsonLdTag = (data) =>
  `    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

function writeSitemap(all) {
  const body = all.map((p) => `  <url><loc>${escapeXml(SITE + p.path)}</loc></url>`).join('\n')
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
  if (!/<title>[\s\S]*?<\/title>/.test(template) || !template.includes('</head>')) {
    throw new Error('dist/index.html: no <title> or </head> to fill in')
  }
  for (const p of all) {
    const html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeXml(p.title)}</title>`)
      .replace(/\s*<\/head>/, `\n${headTags(p)}\n  </head>`)
    const dir = join(dist, p.path)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), html)
  }
  console.log(`pages: ${all.length} index.html files with their own head tags`)
}

const all = pages()
writeSitemap(all)
writePages(all)
