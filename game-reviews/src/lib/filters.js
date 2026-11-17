import { fuzzyMatch } from './fuzzy.js'
import {
  MAX_PLAYERS, DEFAULT_GROUP, LEVELS, DEV_SIZES,
  hasPlayerData, levelAt, costPerPerson, hasCostData,
} from './games.js'
import { TAG_BY_ID } from '../data/tags.js'

/* ── Filter state <-> URL query ───────────────────────
   Everything that defines "the view" lives in the query string so a copied
   address reproduces it. Defaults are left out to keep URLs short. */

export const MODES = [
  { id: 'online', label: 'Online' },
  { id: 'couch', label: 'Couch' },
]
export const LENGTHS = [
  { id: 'short', label: 'Under 10 hours', test: (h) => h < 10 },
  { id: 'mid', label: '10 to 30 hours', test: (h) => h >= 10 && h <= 30 },
  { id: 'long', label: 'Over 30 hours', test: (h) => h > 30 },
]

export function emptyState() {
  return {
    q: '',
    pmin: null,
    pmax: null,
    modes: [],
    lengths: [],
    tags: [],
    devs: [], // 'S' | 'M' | 'L'
    crossplay: false,
    cost: null, // max cost per person in CAD, or null for any
    all: false, // show games missing data for an active filter
  }
}

const list = (v) => (typeof v === 'string' && v ? v.split(',') : [])
const int = (v) => {
  const n = parseInt(v, 10)
  return n >= 1 && n <= MAX_PLAYERS ? n : null
}
// a max cost: any number from 0 up, in dollars
const money = (v) => {
  const n = Number(v)
  return typeof v === 'string' && v !== '' && Number.isFinite(n) && n >= 0 ? n : null
}

export function stateFromQuery(query) {
  const s = emptyState()
  s.q = typeof query.q === 'string' ? query.q : ''
  s.pmin = int(query.pmin)
  s.pmax = int(query.pmax)
  if (s.pmin && s.pmax && s.pmin > s.pmax) s.pmax = s.pmin
  s.modes = list(query.mode).filter((m) => MODES.some((o) => o.id === m))
  s.lengths = list(query.len).filter((m) => LENGTHS.some((o) => o.id === m))
  s.tags = list(query.tags).filter((t) => TAG_BY_ID[t])
  s.devs = list(query.devs).filter((d) => DEV_SIZES[d])
  s.crossplay = query.xplay === '1'
  s.cost = money(query.cost)
  s.all = query.all === '1'
  return s
}

export function queryFromState(s) {
  const q = {}
  if (s.q) q.q = s.q
  if (s.pmin) q.pmin = String(s.pmin)
  if (s.pmax) q.pmax = String(s.pmax)
  if (s.modes.length) q.mode = s.modes.join(',')
  if (s.lengths.length) q.len = s.lengths.join(',')
  if (s.tags.length) q.tags = s.tags.join(',')
  if (s.devs.length) q.devs = s.devs.join(',')
  if (s.crossplay) q.xplay = '1'
  if (s.cost !== null) q.cost = String(s.cost)
  if (s.all) q.all = '1'
  return q
}

/* ── Player range ─────────────────────────────────── */
/* one bound alone means an exact count */
export function playerRange(s) {
  if (!s.pmin && !s.pmax) return null
  const lo = s.pmin || s.pmax
  const hi = s.pmax || s.pmin
  return [Math.min(lo, hi), Math.max(lo, hi)]
}

export function groupSize(s) {
  const r = playerRange(s)
  return r ? r[0] : DEFAULT_GROUP
}

function countsIn(range) {
  const out = []
  for (let n = range[0]; n <= range[1]; n++) out.push(n)
  return out
}

/* ── Filter definitions ───────────────────────────────
   active: is the filter switched on
   hasData: does this game carry what the filter needs (else it's "unrated")
   test: does the game pass                                    */
const FILTERS = [
  {
    id: 'players',
    active: (s) => !!playerRange(s),
    hasData: hasPlayerData,
    test: (g, s) => countsIn(playerRange(s)).every((n) => levelAt(g, n) !== 'grey'),
  },
  {
    id: 'modes',
    active: (s) => s.modes.length > 0,
    hasData: (g) => Array.isArray(g.mode),
    test: (g, s) => s.modes.every((m) => g.mode.includes(m)),
  },
  {
    id: 'lengths',
    active: (s) => s.lengths.length > 0,
    hasData: (g) => typeof g.hours === 'number',
    test: (g, s) => LENGTHS.some((l) => s.lengths.includes(l.id) && l.test(g.hours)),
  },
  {
    id: 'tags',
    active: (s) => s.tags.length > 0,
    hasData: (g) => Array.isArray(g.tags),
    test: (g, s) => s.tags.every((t) => g.tags.includes(t)),
  },
  {
    id: 'devs',
    active: (s) => s.devs.length > 0,
    hasData: (g) => !!DEV_SIZES[g.devs],
    test: (g, s) => s.devs.includes(g.devs),
  },
  {
    id: 'crossplay',
    active: (s) => s.crossplay,
    hasData: (g) => typeof g.crossplay === 'boolean',
    test: (g) => g.crossplay === true,
  },
  {
    id: 'cost',
    active: (s) => s.cost !== null,
    hasData: hasCostData,
    test: (g, s) => costPerPerson(g, groupSize(s)) <= s.cost,
  },
]

/* how many individual choices are switched on, per panel */
export function activeCounts(s) {
  const more = (playerRange(s) ? 1 : 0) + s.modes.length + (s.cost !== null ? 1 : 0) + s.devs.length
  const evenMore = s.lengths.length + s.tags.length + (s.crossplay ? 1 : 0)
  return { more, evenMore, total: more + evenMore }
}

export function anyFilterActive(s) {
  return FILTERS.some((f) => f.active(s))
}

export function isDefaultView(s) {
  return !s.q.trim() && !anyFilterActive(s)
}

/* best-rated across the selected player range first */
function playersFit(g, s) {
  const r = playerRange(s)
  if (!r || !hasPlayerData(g)) return 0
  return countsIn(r).reduce((sum, n) => sum + (LEVELS[levelAt(g, n)]?.rank || 0), 0)
}

/* Run search + filters.
   rows: games that pass everything (each { game, match, unrated })
   hidden: games that would pass but lack data for an active filter */
export function applyFilters(allGames, s) {
  const active = FILTERS.filter((f) => f.active(s))
  const q = s.q.trim()
  const shown = []
  const hidden = []

  for (const g of allGames) {
    let match = null
    if (q) {
      match = fuzzyMatch(q, g.name)
      if (!match) continue
    }
    let missing = false
    let fail = false
    for (const f of active) {
      if (!f.hasData(g)) { missing = true; continue }
      if (!f.test(g, s)) { fail = true; break }
    }
    if (fail) continue
    const row = { game: g, match, unrated: missing }
    ;(missing ? hidden : shown).push(row)
  }

  const cmp = comparator(s, !!q)
  shown.sort(cmp)
  hidden.sort(cmp)
  const rows = s.all ? shown.concat(hidden) : shown
  return { rows, hiddenCount: hidden.length }
}

function comparator(s, searching) {
  const byOrder = (a, b) => a.game.order - b.game.order
  const byAvg = (a, b) => b.game.avg - a.game.avg || byOrder(a, b)
  return (a, b) => {
    if (searching) {
      const d = b.match.score - a.match.score
      if (d) return d
    }
    const p = playersFit(b.game, s) - playersFit(a.game, s)
    if (p) return p
    return byAvg(a, b)
  }
}

/* "Feeling lucky": random game from the current view; with nothing set,
   only from games scoring 7 or higher */
export function luckyPool(allGames, s, rows) {
  if (isDefaultView(s)) return allGames.filter((g) => g.avg >= 7)
  return rows.map((r) => r.game)
}
