import { nextTick, reactive } from 'vue'

/* ── Opening a game: the row itself grows into the page ────────────────
   There is no separate page element. Each row holds a ".piece" (see
   GameRow.vue) which is the row and, once opened, the game's page: a single
   element with a single background. Opening a game animates that element's
   own width and height; the page's text is inside it.

   The list never unmounts. While a game is open it is a "ghost": slid left
   so it is half off screen, dimmed, and lined up so the open row sits at the
   top of the screen.

   List → game:
     1. stretch: the list pans left while the row's piece grows to the right
        edge of the screen
     2. rise:    the list moves up so the row is at the top
     3. drop:    the piece grows downwards (its bottom line falls away past
        the table), opening the page
     4. the route changes and the page's text fades in
   Game → list runs it backwards.
   Anything else is a quick fade. prefers-reduced-motion: a plain fade.

   The router guards drive it, so browser back/forward animate as well.
   App.vue registers the elements via registerWarp(). */

export const navState = reactive({
  listQuery: {},     // last query seen on the list (the ghost list keeps using it)
  listScroll: 0,     // scroll position when the list was left
  listScrollKey: '', // ...and which query it belongs to
})

let els = null      // { view, list, kick }
let router = null
let busy = false

export function registerWarp(e) {
  els = e
  firstLoad()
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
// a timer, not requestAnimationFrame: that never fires in a background tab
const frame = () => new Promise((r) => setTimeout(r, 40))
const px = (v) => `${Math.round(v)}px`
const qkey = (q) => JSON.stringify(Object.keys(q).sort().map((k) => [k, q[k]]))
const shift = (x, y) => `translate(${Math.round(x)}px, ${Math.round(y)}px)`
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
const OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)'
// moving the list up/down: quick for a short hop, never a blur for a long one
const travel = (d) => Math.round(Math.min(360, 140 + Math.abs(d) * 0.4))

// every duration below is scaled by this: lower is faster
const SPEED = 0.85

let anims = []
/* animate, leaving the final keyframe's values as inline styles */
function run(el, keyframes, opts) {
  if (!el) return Promise.resolve()
  const last = { ...keyframes[keyframes.length - 1] }
  delete last.offset
  delete last.easing
  Object.assign(el.style, last)
  const a = el.animate(keyframes, {
    ...opts,
    duration: Math.round((opts.duration || 0) * SPEED),
    delay: Math.round((opts.delay || 0) * SPEED),
  })
  anims.push(a)
  return a.finished.catch(() => {})
}

const findRow = (slug) => document.querySelector(`.game-row[data-slug="${slug}"]`)
const pieceOf = (row) => row.querySelector('.piece')
const rowHeight = (row) => row.querySelector('.row-main').getBoundingClientRect().height
const clip = () => els.list.parentElement // .list-clip (App.vue)

/* Where things sit while a game is open (viewport px, scrolled to the top):
     edge  = x where the table's right edge ends up and the page part begins
     pageW = width of the page part
     pan   = how far left the list slides to get there
     top   = y of the open row */
function geom() {
  // The layout width, which keeps the scrollbar's gutter even while the page
  // is too short to scroll. documentElement.clientWidth drops that gutter in
  // that moment (it reads 10px wider), which put the whole page 10px off
  // until the next re-place, right as a game opened.
  const vw = Math.round(document.documentElement.getBoundingClientRect().width)
  const vh = window.innerHeight
  const main = document.querySelector('main')
  const cs = getComputedStyle(main)
  const r = main.getBoundingClientRect()
  const padL = parseFloat(cs.paddingLeft) || 0
  const padR = parseFloat(cs.paddingRight) || 0
  const left = r.left + padL
  const width = r.width - padL - padR
  // gap right of the page; on phones the page runs to the screen edge
  const margin = vw < 700 ? 0 : 20
  // half the table stays on screen when there's room; on narrow screens the
  // page keeps its reading width and only a strip of the table shows
  let edge = Math.round(Math.max(26, Math.min(width / 2, vw - margin - Math.min(width, 640))))
  const pageW = Math.round(Math.min(width, vw - edge - margin))
  // wide screens: show more of the table rather than leave the right empty,
  // and once all of it shows, centre table + page together
  edge = Math.max(edge, Math.round(Math.min(vw - margin - pageW, (vw + width - pageW) / 2)))
  const top = Math.max(0, r.top + window.scrollY + (parseFloat(cs.paddingTop) || 0))
  return { vw, vh, left, width, edge, pageW, pan: Math.round(left + width - edge), top }
}

/* the sizes the open piece is drawn with (see GameRow.vue) */
function setVars(g, row) {
  const s = els.view.style
  s.setProperty('--row-w', px(g.width))
  s.setProperty('--row-h', `${row ? rowHeight(row) : 43}px`) // not rounded: see rowHeight
  s.setProperty('--page-w', px(g.pageW))
  s.setProperty('--page-min-h', px(g.vh - g.top))
}

/* The open piece hangs out of the ghost list, which is out of the page
   flow: the wrapper is kept as tall as the piece so the document scrolls
   exactly as far as the page is long. */
const grow = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver((entries) => {
  const e = entries[entries.length - 1]
  if (els) els.view.style.minHeight = px(e.target.offsetHeight)
})

let ghostY = 0 // the ghost list's vertical offset, as last placed
/* put the ghost list where it belongs while a game is open */
function placeGhost(slug) {
  const g = geom()
  const row = findRow(slug)
  setVars(g, row)
  const list = els.list
  list.style.opacity = ''
  list.style.transform = shift(-g.pan, 0)
  // line the open row up with the top (or just the list's top)
  const anchor = row || list
  const dy = els.view.getBoundingClientRect().top - anchor.getBoundingClientRect().top
  list.style.transform = shift(-g.pan, dy)
  ghostY = dy
  grow?.disconnect()
  if (row) {
    els.view.style.minHeight = px(pieceOf(row).offsetHeight)
    grow?.observe(pieceOf(row))
  }
}

function clearList() {
  grow?.disconnect()
  els.view.style.minHeight = ''
  els.list.style.transform = ''
  els.list.style.opacity = ''
}

/* re-place everything for the current route (first load, resize, fonts) */
export function syncGhost() {
  if (!els || !router || busy) return
  const route = router.currentRoute.value
  if (route.name === 'game') placeGhost(route.params.slug)
  else clearList()
}

/* the row being animated: data-opening gives its piece the opened look and
   takes it out of the row's slot, before/after the route says it is open.
   Attributes, not classes: Vue owns the class list and rewrites it on any
   re-render (a hover on another row is enough), which dropped the marker
   mid-animation and let the row's cells spread across the stretched piece. */
let moving = null
let faded = []
function startMoving(row) {
  moving = row
  row.setAttribute('data-opening', '')
  clip().setAttribute('data-moving', '')
  clip().classList.add('dim')
}
function resetPiece() {
  if (!moving) return
  const piece = pieceOf(moving)
  piece.style.width = ''
  piece.style.height = ''
  piece.style.minHeight = ''
  moving.removeAttribute('data-opening')
  moving = null
}

function cleanup() {
  anims.forEach((a) => a.cancel())
  anims = []
  faded.forEach((el) => { el.style.opacity = '' })
  faded = []
  resetPiece()
  if (!els) return
  clip().removeAttribute('data-moving')
  clip().classList.remove('dim', 'bright')
  els.view.style.opacity = ''
  const route = router.currentRoute.value
  if (route.name === 'game') placeGhost(route.params.slug)
  else clearList()
}

/* what is written on the open page (it fades; the piece itself never does) */
function contents(row) {
  faded = row ? [...row.querySelectorAll('.row-page, .band-label')] : []
  return faded
}

/* ── list → game ─────────────────────────────────── */
async function warpOut(slug) {
  const row = findRow(slug)
  if (!row) { await fadeOut(); return 'fade' }
  els.kick?.()
  const g = geom()
  const { vw, vh } = g
  const r = row.getBoundingClientRect()
  const h = r.height
  const rise = g.top - r.top  // the list moves up so the row ends at the top
  const x1 = r.left - g.pan   // the row's left edge once the list has panned
  const piece = pieceOf(row)

  setVars(g, row)
  piece.style.width = px(r.width)
  piece.style.height = px(h)
  startMoving(row)

  // 1. stretch + pan: the piece grows to the right edge of the screen
  await Promise.all([
    run(els.list, [
      { transform: shift(0, 0) },
      { transform: shift(-g.pan, 0) },
    ], { duration: 340, easing: EASE }),
    run(piece, [{ width: px(r.width) }, { width: px(g.width + g.pageW) }], { duration: 340, easing: EASE }),
  ])

  // 2. rise to the top
  await run(els.list, [
    { transform: shift(-g.pan, 0) },
    { transform: shift(-g.pan, rise) },
  ], { duration: travel(rise), easing: EASE })

  // 3. drop: the piece grows downwards into the page
  await run(piece, [
    { width: px(g.width + g.pageW), height: px(h) },
    { width: px(r.width + g.pageW), height: px(vh - g.top) },
  ], { duration: 260, easing: OUT })
  return 'warp'
}

/* The route has flipped: the row is now marked open, at the size the piece
   was just animated to, and the page's text has appeared inside it. */
async function warpIn(slug) {
  const row = findRow(slug)
  await Promise.all(contents(row).map((el) =>
    run(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: OUT })))
}

/* ── arriving on a game's link ───────────────────────
   The page loads with the game already open. Wind it back to a plain list
   (row closed, nothing dimmed, list not panned), hold a moment, then play
   the same opening as a click would. */
let started = false
function firstLoad() {
  if (started || !els || !router) return
  const route = router.currentRoute.value
  if (!route.name) return // the first navigation hasn't finished yet
  started = true
  if (route.name === 'game' && !reduced()) introOpen(route.params.slug)
  else syncGhost()
}

async function introOpen(slug) {
  const row = findRow(slug)
  if (!row) { syncGhost(); return }
  const piece = pieceOf(row)
  busy = true
  try {
    moving = row
    grow?.disconnect()
    clip().classList.add('bright')
    contents(row).forEach((el) => { el.style.opacity = '0' })

    /* measure the finished layout, then wind back to the plain list */
    let m
    const stage = () => {
      piece.style.width = ''
      piece.style.height = ''
      piece.style.minHeight = ''
      placeGhost(slug)
      grow?.disconnect()
      const g = geom()
      const end = row.getBoundingClientRect() // the open row: at the top, panned
      const h = rowHeight(row)
      // start with the row where it sits in the list, or part-way down the
      // screen if that is out of view
      const natural = end.top + (end.top - els.list.getBoundingClientRect().top)
      const startTop = natural + h < g.vh - 60 ? natural : Math.round(g.vh * 0.4)
      m = { g, h, x1: end.left, yEnd: ghostY, yStart: ghostY + (startTop - end.top) }
      els.view.style.minHeight = px(g.vh)
      piece.style.width = px(g.width)
      piece.style.height = px(h)
      piece.style.minHeight = '0' // .open pins a minimum height; not while it grows
      els.list.style.transform = shift(0, m.yStart)
    }
    stage()
    // Web fonts change every row's size when they arrive. Wait for them (not
    // for ever), then measure again, so nothing shifts mid-animation.
    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
      stage()
    }
    await new Promise((r) => setTimeout(r, 400))
    stage() // the window may have been resized while we waited

    const { g, h, x1, yEnd, yStart } = m
    const { vw, vh } = g
    els.kick?.()
    clip().classList.remove('bright')
    await Promise.all([
      run(els.list, [
        { transform: shift(0, yStart) },
        { transform: shift(-g.pan, yStart) },
      ], { duration: 340, easing: EASE }),
      run(piece, [{ width: px(g.width) }, { width: px(g.width + g.pageW) }], { duration: 340, easing: EASE }),
    ])
    await run(els.list, [
      { transform: shift(-g.pan, yStart) },
      { transform: shift(-g.pan, yEnd) },
    ], { duration: travel(yEnd - yStart), easing: EASE })
    await run(piece, [
      { width: px(g.width + g.pageW), height: px(h) },
      { width: px(g.width + g.pageW), height: px(vh - g.top) },
    ], { duration: 260, easing: OUT })
    piece.style.width = ''
    piece.style.height = ''
    piece.style.minHeight = ''
    await Promise.all(faded.map((el) =>
      run(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: OUT })))
  } finally {
    cleanup()
    busy = false
  }
}

/* ── game → list ─────────────────────────────────── */
let box = null // where the open piece stood when we left the game
async function coverOut() {
  const row = document.querySelector('.game-row.open')
  box = null
  if (row) {
    const p = pieceOf(row).getBoundingClientRect()
    box = { top: p.top, width: p.width }
  }
  // what is written on the page fades out; the piece stays
  await Promise.all(contents(row).map((el) =>
    run(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-out' })))
  return 'cover'
}

/* The route has flipped: the list is back in the page flow, scrolled to
   where it was, and the page's text is gone. Put the piece back where it
   stood and walk everything back. */
async function warpBack(slug) {
  const g = geom()
  const { vw, vh } = g
  const row = findRow(slug)
  const r = row && row.getBoundingClientRect()
  if (!r || !box || r.bottom < 0 || r.top > vh) {
    await run(els.list, [{ opacity: 0 }, { opacity: 1 }], { duration: 320 })
    return
  }
  els.kick?.()
  const h = r.height
  const x1 = r.left - g.pan
  const from = box.top - r.top // where the ghost list stood
  const piece = pieceOf(row)
  const tall = Math.max(h, vh - box.top)

  setVars(g, row)
  piece.style.width = px(box.width)
  piece.style.height = px(tall)
  els.list.style.transform = shift(-g.pan, from)
  startMoving(row)

  // 3 reversed: the page folds back up into the row
  await run(piece, [
    { width: px(box.width), height: px(tall) },
    { width: px(g.width + g.pageW), height: px(h) },
  ], { duration: 230, easing: EASE })

  // 2 reversed: the list drops back to where the row belongs
  await run(els.list, [
    { transform: shift(-g.pan, from) },
    { transform: shift(-g.pan, 0) },
  ], { duration: travel(from), easing: EASE })

  // 1 reversed: pan back while the piece shrinks to the row
  clip().classList.remove('dim')
  await Promise.all([
    run(els.list, [
      { transform: shift(-g.pan, 0) },
      { transform: shift(0, 0) },
    ], { duration: 340, easing: EASE }),
    run(piece, [{ width: px(g.width + g.pageW) }, { width: px(r.width) }], { duration: 340, easing: EASE }),
  ])

  // hand over to the row's own highlight, which then sweeps away
  row.setAttribute('data-lit', '')
  resetPiece()
  await frame()
  row.removeAttribute('data-lit')
}

/* ── generic fade ────────────────────────────────── */
async function fadeOut() {
  await run(els.view, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-out' })
}
async function fadeIn() {
  await run(els.view, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' })
}

/* ── router wiring ───────────────────────────────── */
export function installWarp(r) {
  router = r
  let pending = null
  let activeTo = null // the navigation that owns the running transition

  const isQueryOnly = (to, from) =>
    to.name === from.name && (to.name !== 'game' || to.params.slug === from.params.slug)

  router.beforeEach(async (to, from) => {
    // first load, or only the list's query changed: no transition
    if (!from.name || isQueryOnly(to, from)) return true
    // ignore new page changes while a transition is still playing
    if (busy) return false
    if (from.name === 'list') {
      navState.listScroll = window.scrollY
      navState.listScrollKey = qkey(from.query)
    }
    activeTo = to.fullPath
    if (!els) { pending = 'none'; return true }

    busy = true
    try {
      if (reduced()) { await fadeOut(); pending = 'fade' }
      else if (from.name === 'list' && to.name === 'game') pending = await warpOut(to.params.slug)
      else if (from.name === 'game' && to.name === 'list') pending = await coverOut()
      else { await fadeOut(); pending = 'fade' }
    } catch {
      cleanup()
      pending = 'none'
    }
    return true
  })

  router.afterEach(async (to, from, failure) => {
    if (to.name === 'list' && !failure) navState.listQuery = { ...to.query }
    if (!from.name) {
      // first load: place the ghost list, or play the opening for a game link
      if (!failure) nextTick(firstLoad)
      return
    }
    if (isQueryOnly(to, from)) return
    // a navigation we refused while busy: leave the running transition alone
    if (to.fullPath !== activeTo) return
    activeTo = null
    const type = pending
    pending = null
    if (failure) { cleanup(); busy = false; return }

    await nextTick()
    // everything up to the first animation runs before the next paint, so the
    // switch between "list in the flow" and "ghost list" is never seen
    try {
      if (to.name === 'list') {
        const same = qkey(to.query) === navState.listScrollKey
        window.scrollTo(0, same ? navState.listScroll : 0)
      } else {
        window.scrollTo(0, 0)
      }
      if (!els) return
      // the route's own classes take over from the ones set for the animation
      resetPiece()
      if (to.name === 'game') placeGhost(to.params.slug)
      else clearList()
      if (type === 'warp') await warpIn(to.params.slug)
      else if (type === 'cover') await warpBack(from.params.slug)
      else if (type === 'fade') await fadeIn()
    } finally {
      cleanup()
      busy = false
    }
  })
}
