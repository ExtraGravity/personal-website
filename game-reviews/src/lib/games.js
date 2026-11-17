import { games as rawGames } from '../data/games.js'

/* Display names. Data keys stay `enoch` / `mo`. */
export const JELLY = 'Jelly'      // data key: enoch
export const JUPITER = 'Jupiter'  // data key: mo
export const SITE_TITLE = 'Better Together Gaming'

/* Page titles, shared by router.js (the tab) and scripts/postbuild.js (the
   HTML crawlers and link previews get), so the two always match. */
export const HOME_TITLE = `${SITE_TITLE} · Co-op Game Reviews`
export const ABOUT_TITLE = `About · ${SITE_TITLE}`
export const gameTitle = (g) => `${g.name} co-op review (${g.avg}/10) · ${SITE_TITLE}`

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/* every game gets a slug and its original position (stable tie-break) */
export const games = rawGames.map((g, i) => ({ ...g, slug: slugify(g.name), order: i }))
export const gameBySlug = new Map(games.map((g) => [g.slug, g]))

/* score colour bands: 9+, 7+, 5+, below 5 */
export function scoreClass(avg) {
  if (avg >= 9) return 'avg-great'
  if (avg >= 7) return 'avg-good'
  if (avg >= 5) return 'avg-ok'
  return 'avg-bad'
}

/* ── Developer size (`devs` in games.js) ──────────── */
export const DEV_SIZES = {
  S: { label: 'Small unknown team' },
  M: { label: 'Team with previous success' },
  L: { label: 'Established corporation' },
}

/* ── Player-count ratings ─────────────────────────── */
export const MAX_PLAYERS = 12
export const LEVELS = {
  green: { label: 'Recommended', rank: 3 },
  yellow: { label: 'OK', rank: 2 },
  red: { label: 'Bad experience', rank: 1 },
  grey: { label: 'Not supported', rank: 0 },
}

export function hasPlayerData(g) {
  return Array.isArray(g.players) && g.players.length > 0
}

/* rating at a given player count (1-based); beyond the list = not supported */
export function levelAt(g, n) {
  if (!hasPlayerData(g)) return null
  return g.players[n - 1] || 'grey'
}

export function playerLabel(n, level) {
  return `${n} player${n === 1 ? '' : 's'}: ${LEVELS[level]?.label || 'Not supported'}`
}

/* ── Cost per person ──────────────────────────────── */
export const DEFAULT_GROUP = 2

/* cheapest way for the group to play, divided by players. null = no data */
export function costPerPerson(g, players = DEFAULT_GROUP) {
  if (g.whoBuys === 'free') return 0
  if (typeof g.price !== 'number') return null
  if (g.whoBuys === 'everyone') return g.price
  if (g.whoBuys === 'one') return g.price / Math.max(1, players)
  return null
}

export function formatCost(value) {
  if (value === null || value === undefined) return '—'
  if (value === 0) return 'Free'
  if (value >= 10) return '$' + Math.round(value)
  return '$' + value.toFixed(2).replace(/\.00$/, '')
}

export function hasCostData(g) {
  return g.whoBuys === 'free' || (typeof g.price === 'number' && (g.whoBuys === 'everyone' || g.whoBuys === 'one'))
}

/* ── Misc formatting ──────────────────────────────── */
export function formatHours(h) {
  return `${h} hour${h === 1 ? '' : 's'}`
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d)) return iso
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
}
