/* Intro length, decided once per page load.
   Visits are counted in localStorage, at most once per browser session
   (a sessionStorage flag marks the session as counted).
   The intro always plays (title types, rows print in); only how long the
   cursor blinks before the title starts typing changes:
     visit 1  → full: two blinks (~1.8s)
     visit 2  → short: one blink (~0.9s)
     visit 3+ → quick: no blinking, the title types straight away
   Landing directly on a game page or About never plays it (none), and going
   back to the list later in the same load never replays it. */

const VISITS_KEY = 'coop-reviews:visits'
const SESSION_KEY = 'coop-reviews:session-counted'

function countVisit() {
  try {
    let visits = parseInt(localStorage.getItem(VISITS_KEY), 10) || 0
    if (!sessionStorage.getItem(SESSION_KEY)) {
      visits += 1
      localStorage.setItem(VISITS_KEY, String(visits))
      sessionStorage.setItem(SESSION_KEY, '1')
    }
    return Math.max(1, visits)
  } catch {
    return 1 // storage blocked: treat as a first visit
  }
}

/* timings in ms. typeAt = when the first title character lands */
const TIMINGS = {
  full: { typeAt: 1800, rowsAt: 2700, rowStep: 55, rowSpread: 1800, shapeAt: 1500, ambientAt: 4500 },
  short: { typeAt: 900, rowsAt: 1800, rowStep: 35, rowSpread: 1000, shapeAt: 600, ambientAt: 3200 },
  quick: { typeAt: 150, rowsAt: 1050, rowStep: 35, rowSpread: 1000, shapeAt: 0, ambientAt: 2500 },
  none: { typeAt: 0, rowsAt: 0, rowStep: 0, rowSpread: 0, shapeAt: 0, ambientAt: 1500 },
}

let mode = 'none'
let listIntroUsed = false

export function initIntro(initialPath) {
  const visits = countVisit()
  const base = import.meta.env.BASE_URL || '/'
  const rel = initialPath.startsWith(base) ? initialPath.slice(base.length - 1) : initialPath
  const onList = rel === '/' || rel === ''
  if (!onList) mode = 'none'
  else mode = visits === 1 ? 'full' : visits === 2 ? 'short' : 'quick'
}

/* the app-wide mode (HUD flicker, background shape start) */
export function introMode() {
  return mode
}
export function introTimings() {
  return TIMINGS[mode]
}

/* the list asks once per mount; only the first mount gets the intro */
export function takeListIntro() {
  if (listIntroUsed) return { mode: 'none', ...TIMINGS.none }
  listIntroUsed = true
  return { mode, ...TIMINGS[mode] }
}
