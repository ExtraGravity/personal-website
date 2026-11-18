/* Hover highlight for the list's rows, tracked by the list as a whole.

   Two jobs:
   1. No skipped rows. The browser only checks what is under the pointer about
      once a frame, so a quick flick can jump clean over a 45px row and it
      never lights. Instead, every pointer move walks the path from the last
      position (using the browser's in-between samples too, where it has
      them) and lights every row the pointer crossed.
   2. A minimum play time. A row the mouse only brushes past keeps its
      highlight for MIN ms before it lets go, so passing up and down the list
      doesn't flicker barely-started sweeps. With the 0.36s sweep and its
      easing (GameRow.vue), 100ms reaches about a third of the row, 120ms
      just under half, 150ms about two thirds, 200ms about 85%.

   It sets `data-hover` on the row element directly (GameRow.vue's CSS lights
   the sweep from it), so nothing re-renders. Mouse only: a tap on a phone
   doesn't leave a row lit. */

const MIN = 150
const STEP = 8 // px between the points checked along the pointer's path

export function trackRowHover(list) {
  const lit = new Map() // row element → { at, timer }
  let current = null    // the row under the pointer now
  let last = null       // where the pointer was at the previous move

  function light(row, now) {
    let s = lit.get(row)
    if (!s) {
      s = { at: now, timer: null }
      lit.set(row, s)
      row.setAttribute('data-hover', '')
    }
    clearTimeout(s.timer)
    s.timer = null
  }

  function release(row, now) {
    const s = lit.get(row)
    if (!s) return
    clearTimeout(s.timer)
    s.timer = setTimeout(() => {
      row.removeAttribute('data-hover')
      lit.delete(row)
    }, Math.max(0, MIN - (now - s.at)))
  }

  const rowAt = (x, y) => {
    const row = document.elementFromPoint(x, y)?.closest('.game-row')
    return row && list.contains(row) ? row : null
  }

  function onMove(e) {
    if (e.pointerType !== 'mouse') return
    const now = performance.now()
    const points = e.getCoalescedEvents?.().length ? e.getCoalescedEvents() : [e]
    const crossed = new Set()
    for (const p of points) {
      const to = { x: p.clientX, y: p.clientY }
      const from = last || to
      const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / STEP))
      for (let i = 1; i <= steps; i++) {
        const row = rowAt(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps)
        if (row) crossed.add(row)
      }
      last = to
    }
    const here = rowAt(last.x, last.y)
    for (const row of crossed) light(row, now)
    // rows only passed over get their minimum, then let go
    for (const row of crossed) if (row !== here) release(row, now)
    if (current && current !== here) release(current, now)
    current = here
  }

  function onLeave(e) {
    if (e.pointerType !== 'mouse') return
    if (current) release(current, performance.now())
    current = null
    last = null
  }

  list.addEventListener('pointermove', onMove)
  list.addEventListener('pointerleave', onLeave)
  return () => {
    list.removeEventListener('pointermove', onMove)
    list.removeEventListener('pointerleave', onLeave)
    for (const s of lit.values()) clearTimeout(s.timer)
  }
}
