// Post-build steps, run after `vite build` (see the "build" script).
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { games } from '../src/lib/games.js'

const SITE = 'https://enochtsang.com'
const dist = fileURLToPath(new URL('../dist/', import.meta.url))

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
}

function writeSitemap() {
  const urls = [
    `${SITE}/`,
    `${SITE}/about`,
    ...games.map((g) => `${SITE}/games/${g.slug}`),
  ]
  const body = urls.map((u) => `  <url><loc>${escapeXml(u)}</loc></url>`).join('\n')
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    '\n</urlset>\n'
  mkdirSync(dist, { recursive: true })
  writeFileSync(join(dist, 'sitemap.xml'), xml)
  console.log(`sitemap.xml: ${urls.length} URLs`)
}

writeSitemap()
