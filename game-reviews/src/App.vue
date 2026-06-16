<template>
  <div id="shell">
    <!-- Background layers -->
    <div class="bg-grid"></div>
    <div class="bg-vignette"></div>
    <div class="scanlines"></div>

    <!-- HUD chrome -->
    <div class="hud hud-top">ENOCH &amp; MOHAMMED — CO-OP GAME REVIEWS</div>
    <div class="hud tilt-readout">
      {{ tiltStatus }} · events: {{ tiltEvents }} · β {{ tilt.x.toFixed(1) }} / γ {{ tilt.y.toFixed(1) }}
    </div>
    <div class="hud hud-bottom">
      <span class="blink">▶</span>&nbsp;
      {{ games.length }} GAMES LOGGED
    </div>

    <!-- Main content -->
    <main :style="tiltStyle">
      <header class="page-header">
        <h1>{{ typedTitle }}<span v-if="cursorVisible" class="type-cursor" :class="{ solid: isTyping }"></span></h1>
      </header>

      <!-- Table header -->
      <div class="table-header">
        <span></span>
        <span>GAME</span>
        <span class="right">MOHAMMED</span>
        <span class="right">ENOCH</span>
        <span class="right">HRS</span>
        <span class="right">SCORE</span>
      </div>

      <!-- Game rows -->
      <div
        class="game-list"
        :class="{ 'has-hover': hoveredIdx !== null }"
      >
        <GameRow
          v-for="(game, i) in games"
          :key="game.name"
          :game="game"
          :class="{ dimmed: hoveredIdx !== null && hoveredIdx !== i }"
          :style="{ animationDelay: (2.7 + Math.min(i * 0.055, 1.8)) + 's' }"
          @mouseenter="hoveredIdx = i"
          @mouseleave="hoveredIdx = null"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { games } from './data/games.js'
import GameRow from './components/GameRow.vue'

const hoveredIdx = ref(null)

/* ── Responsive fold breakpoints ─────────────────────
   As the viewport narrows, columns fold out of the table and into each row's
   blurb. These px values are the single JS source of truth, shared with every
   row via provide/inject (one matchMedia pair instead of one per row).
   The CSS @media blocks in style.css mirror these same numbers. */
const FOLD_HOURS_BP = 600   // HRS leaves the table
const FOLD_SCORES_BP = 480  // Mohammed + Enoch leave the table
const foldHours = ref(false)
const foldScores = ref(false)
provide('foldHours', foldHours)
provide('foldScores', foldScores)
let mqFoldHours, mqFoldScores
const syncFoldHours = (e) => { foldHours.value = e.matches }
const syncFoldScores = (e) => { foldScores.value = e.matches }

/* ── Typed-in title ──────────────────────────────── */
const fullTitle = 'CO-OP GAME REVIEWS'
const typedTitle = ref('')
const cursorVisible = ref(true)
const isTyping = ref(false)

function startTyping() {
  // hold for two full blink cycles (0.9s each); offset by one char interval
  // so the first character lands exactly at 1.8s, in sync with the flickers
  const perChar = 55
  const start = performance.now() + 1800 - perChar
  // time-based so throttled timers catch up instead of stalling
  const timer = setInterval(() => {
    const n = Math.max(0, Math.floor((performance.now() - start) / perChar))
    // solid (non-blinking) cursor while characters are being typed
    isTyping.value = n > 0 && n < fullTitle.length
    typedTitle.value = fullTitle.slice(0, n)
    if (n >= fullTitle.length) {
      clearInterval(timer)
      // let the block blink a few times, then drop it
      setTimeout(() => { cursorVisible.value = false }, 2000)
    }
  }, 30)
}

/* ── Device-tilt parallax (touch devices only) ───── */
const tilt = ref({ x: 0, y: 0 })
const tiltStatus = ref('waiting…')
const tiltEvents = ref(0)
let baseBeta = null
let baseGamma = null

// only touch devices tilt the page; on PC the readout still tracks the
// cursor but no transform is applied
const isTouch = window.matchMedia('(hover: none)').matches

const tiltStyle = computed(() =>
  isTouch && (tilt.value.x || tilt.value.y)
    ? { transform: `perspective(1100px) rotateX(${tilt.value.x}deg) rotateY(${tilt.value.y}deg)` }
    : {}
)

function onOrientation(e) {
  tiltEvents.value = (tiltEvents.value + 1) % 1000
  if (e.beta == null || e.gamma == null) return
  if (baseBeta === null) {
    baseBeta = e.beta
    baseGamma = e.gamma
  }
  // baseline slowly follows the current angle, so the page eases back
  // to flat when you settle into a new holding position
  baseBeta += (e.beta - baseBeta) * 0.02
  baseGamma += (e.gamma - baseGamma) * 0.02
  const clamp = (v) => Math.max(-2, Math.min(2, v))
  tilt.value = {
    x: clamp((e.beta - baseBeta) * -0.08),
    y: clamp((e.gamma - baseGamma) * 0.08),
  }
}

function enableTilt() {
  tiltStatus.value = 'listening'
  window.addEventListener('deviceorientation', onOrientation)
}

function askTiltPermission() {
  tiltStatus.value = 'asking permission'
  DeviceOrientationEvent.requestPermission()
    .then((p) => {
      tiltStatus.value = 'permission: ' + p
      if (p === 'granted') enableTilt()
    })
    .catch((err) => { tiltStatus.value = 'error: ' + err })
  window.removeEventListener('touchend', askTiltPermission)
}

/* ── Ambient flicker: random elements glitch at random times ── */
let ambientTimer = null
// node sets are static after the load-in, so query them once and reuse
let flickerChrome = null
let flickerRows = null

function scheduleAmbientFlicker() {
  if (!flickerChrome) {
    flickerChrome = document.querySelectorAll('.hud, .table-header, h1')
    flickerRows = document.querySelectorAll('.game-row')
  }
  const delay = 500 + Math.random() * 2000
  ambientTimer = setTimeout(() => {
    // 50/50 chrome vs rows, so the hud/header flicker far more often
    // than uniform selection over 65 rows would give them
    const pool = Math.random() < 0.5 ? flickerChrome : flickerRows
    const el = pool[Math.floor(Math.random() * pool.length)]
    // WAAPI so the CSS load-in animations are never touched/restarted
    if (el) {
      el.animate(
        [
          { opacity: 1 },
          { opacity: 0.25 },
          { opacity: 0.9 },
          { opacity: 0.4 },
          { opacity: 1 },
        ],
        { duration: 160, easing: 'linear' }
      )
    }
    scheduleAmbientFlicker()
  }, delay)
}

// desktop: same page tilt, driven by cursor position instead of gyro
function onMouseTilt(e) {
  tiltEvents.value = (tiltEvents.value + 1) % 1000
  tilt.value = {
    x: (e.clientY / window.innerHeight - 0.5) * -4,
    y: (e.clientX / window.innerWidth - 0.5) * 4,
  }
}

onMounted(() => {
  startTyping()
  // wait for the load-in sequence to finish before ambient glitches start
  setTimeout(scheduleAmbientFlicker, 4500)

  mqFoldHours = window.matchMedia(`(max-width: ${FOLD_HOURS_BP}px)`)
  mqFoldScores = window.matchMedia(`(max-width: ${FOLD_SCORES_BP}px)`)
  foldHours.value = mqFoldHours.matches
  foldScores.value = mqFoldScores.matches
  mqFoldHours.addEventListener('change', syncFoldHours)
  mqFoldScores.addEventListener('change', syncFoldScores)

  if (!isTouch) {
    tiltStatus.value = 'listening: cursor'
    window.addEventListener('mousemove', onMouseTilt)
    return
  }
  if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
    // iOS requires a user gesture before granting motion access
    tiltStatus.value = 'tap anywhere to grant motion access'
    window.addEventListener('touchend', askTiltPermission)
  } else {
    enableTilt()
  }
})

onUnmounted(() => {
  window.removeEventListener('deviceorientation', onOrientation)
  window.removeEventListener('touchend', askTiltPermission)
  window.removeEventListener('mousemove', onMouseTilt)
  clearTimeout(ambientTimer)
  mqFoldHours && mqFoldHours.removeEventListener('change', syncFoldHours)
  mqFoldScores && mqFoldScores.removeEventListener('change', syncFoldScores)
})
</script>

<style scoped>
/* ── Shell & backgrounds ─────────────────────────── */
#shell {
  min-height: 100vh;
  position: relative;
}

.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(42,245,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(42,245,255,0.025) 1px, transparent 1px);
  background-size: 52px 52px;
  pointer-events: none;
  z-index: 0;
}
.bg-vignette {
  position: fixed; inset: 0;
  background: radial-gradient(ellipse at center, transparent 15%, rgba(2,4,14,0.88) 100%);
  pointer-events: none;
  z-index: 1;
}
.scanlines {
  position: fixed; inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(0,0,0,0.08) 3px,
    rgba(0,0,0,0.08) 4px
  );
  pointer-events: none;
  z-index: 80;
}

/* ── HUD ─────────────────────────────────────────── */
.hud {
  position: fixed;
  font-family: var(--font-hud);
  font-size: 0.72rem;
  letter-spacing: 0.28em;
  color: rgba(42,245,255,0.28);
  text-transform: uppercase;
  white-space: nowrap;
  z-index: 90;
  pointer-events: none;
}
.hud-top    { top: 18px; left: 50%; transform: translateX(-50%); }
.tilt-readout {
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  color: rgba(42, 245, 255, 0.45);
}
.hud-bottom { bottom: 18px; left: 50%; transform: translateX(-50%); }
.blink { animation: blink 1.6s step-start infinite; }
@keyframes blink { 50% { opacity: 0; } }

/* ── Main layout ─────────────────────────────────── */
main {
  position: relative;
  z-index: 10;
  max-width: 860px;
  margin: 0 auto;
  padding: 5rem 1.5rem 5rem;
  transition: transform 0.1s linear;
  will-change: transform;
}

.page-header {
  margin-bottom: 2.5rem;
  text-align: left;
}


.page-header h1 {
  font-family: var(--font-display);
  font-size: 5rem;
  letter-spacing: 0.15em;
  line-height: 1.05;
  color: var(--text);
  display: inline-block;
  white-space: nowrap;
}

/* ── Table header ────────────────────────────────── */
.table-header {
  display: grid;
  grid-template-columns: var(--grid-cols);
  gap: var(--grid-gap);
  padding: 0.3rem 1.4rem 0.3rem 0.7rem;
  font-size: 1rem;
  letter-spacing: 0.18em;
  color: rgba(42,245,255,0.6);
  text-transform: uppercase;
  border-bottom: 1px solid rgba(42,245,255,0.12);
  margin-bottom: 0.15rem;
}
.table-header .right { text-align: right; }

/* ── Game list ───────────────────────────────────── */
.game-list {
  display: flex;
  flex-direction: column;
}

@media (max-width: 765px) {
  .page-header h1 { font-size: 3.9rem; }
}
  
@media (max-width: 600px) {
  main {
    padding: 3rem 0.75rem 4.5rem;
  }

  /* Top HUD is redundant with the h1 and wider than the screen */
  .hud-top { display: none; }


  .hud-bottom {
    font-size: 0.62rem;
    letter-spacing: 0.2em;
    bottom: 12px;
  }

  .page-header { margin-bottom: 1.5rem; }

  /* small enough that the full title fits one line */
  .page-header h1 { font-size: 2.4rem; }

  .table-header {
    padding: 0.3rem 0.7rem 0.3rem 0.2rem;
    font-size: 0.85rem;
  }

  /* HRS column folds out (grid track count handled by --grid-cols) */
  .table-header span:nth-child(5) {
    display: none;
  }
}

/* compact: drop the Mohammed (3rd) + Enoch (4th) headers too — GAME + SCORE only */
@media (max-width: 480px) {
  .table-header span:nth-child(3),
  .table-header span:nth-child(4) {
    display: none;
  }
}

/* Alternating row shading */
.game-list > :nth-child(even) {
  background: rgba(42, 245, 255, 0.028);
}

/* Dim non-hovered rows */
.game-list .dimmed {
  transition: opacity 0.18s ease;
  opacity: 0.5;
}


@media (max-width: 400px) {
  .page-header h1 { font-size: 1.8rem; }
}
/* ── Load-in sequence ────────────────────────────── */
/* HUD chrome flickers on like a CRT powering up */
.hud {
  animation: flicker-in 0.9s linear 1.8s backwards;
}
@keyframes flicker-in {
  0%   { opacity: 0; }
  7%   { opacity: 1; }
  11%  { opacity: 0.2; }
  18%  { opacity: 0.9; }
  24%  { opacity: 0.35; }
  34%  { opacity: 1; }
  41%  { opacity: 0.6; }
  48%, 100% { opacity: 1; }
}

/* Block cursor for the typed-in title */
/* full-height solid block, like a terminal cursor */
.type-cursor {
  display: inline-block;
  width: 0.55em;
  height: 0.75em;
  background: var(--text);
  /* step-end: visible during the first half of each blink cycle.
     Reuses the @keyframes blink defined above. */
  animation: blink 0.9s step-end infinite;
}
.type-cursor.solid { animation: none; }

/* Table header flickers on in place — no horizontal motion */
.table-header {
  animation: flicker-in 0.5s linear 1.55s backwards;
}

/* Rows print in like terminal lines: instant on, highlighted, decaying */
.game-list :deep(.game-row) {
  animation: row-in 0.45s linear backwards;
}
@keyframes row-in {
  0%   { opacity: 0; }
  1%   { opacity: 1; background-color: rgba(42, 245, 255, 0.22); filter: brightness(2.2); }
  45%  { background-color: rgba(42, 245, 255, 0.08); filter: brightness(1.4); }
  100% { opacity: 1; background-color: transparent; filter: brightness(1); }
}
</style>
