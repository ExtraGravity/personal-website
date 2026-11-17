<template>
  <div id="shell" :class="`intro-${introModeName}`" :style="introVars">
    <!-- Background layers -->
    <div class="bg-grid"></div>
    <WireframeShape ref="shape" :start-delay="timings.shapeAt" />
    <div class="bg-vignette"></div>
    <div class="scanlines"></div>

    <!-- HUD chrome -->
    <a class="hud hud-top hud-link" :href="listHref" @click.prevent="goToList">
      {{ JELLY }} &amp; {{ JUPITER }}
    </a>
    <RouterLink class="hud hud-about hud-link" :to="{ name: 'about' }">About</RouterLink>
    <div class="hud hud-bottom">
      <span class="blink">▶</span>&nbsp;
      {{ games.length }} GAMES LOGGED
    </div>

    <!-- Main content -->
    <main>
      <div ref="view" class="view-wrap">
        <!-- the list never unmounts: on a game page it stays behind as a
             dimmed "ghost", slid half off screen (lib/warp.js) -->
        <div
          v-show="route.name === 'list' || onGame"
          class="list-clip"
          :class="{ ghost: onGame }"
        >
          <div ref="list" class="list-inner">
            <ListView />
          </div>
        </div>
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { games, JELLY, JUPITER } from './lib/games.js'
import { introMode, introTimings } from './lib/intro.js'
import { registerWarp, syncGhost, navState } from './lib/warp.js'
import WireframeShape from './components/WireframeShape.vue'
import ListView from './views/ListView.vue'

const router = useRouter()
const route = useRoute()
const onGame = computed(() => route.name === 'game')
const shape = ref(null)   // WireframeShape ref — kicked on each interaction
const view = ref(null)
const list = ref(null)
const KICK_HOVER = 0.018  // bg-shape spin nudge on row hover
const KICK_CLICK = 0.058  // bigger nudge (lingers) when a row is opened

provide('kickShape', (big = false) => shape.value?.kick(big ? KICK_CLICK : KICK_HOVER, !big))

/* ── Intro timing (shared with ListView through CSS vars) ─────────── */
const introModeName = introMode()
const timings = introTimings()
const introVars = {
  '--hud-delay': `${timings.typeAt}ms`,
  '--header-delay': `${Math.max(0, timings.typeAt - 250)}ms`,
}

/* "Back to list" from anywhere: step back in history if the list is right
   behind us (keeps scroll + filters), otherwise open it with the last query */
const listHref = computed(() => router.resolve({ name: 'list', query: navState.listQuery }).href)
function goToList() {
  const route = router.currentRoute.value
  if (route.name === 'list') { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
  const back = window.history.state?.back
  if (back && router.resolve(back).name === 'list') router.back()
  else router.push({ name: 'list', query: navState.listQuery })
}
provide('goToList', goToList)

/* ── Ambient flicker: random elements glitch at random times ── */
let ambientTimer = null

function scheduleAmbientFlicker() {
  const delay = 500 + Math.random() * 2000
  ambientTimer = setTimeout(() => {
    // 50/50 chrome vs rows, so the hud/header flicker far more often
    // than uniform selection over 70 rows would give them.
    // Queried each time: the visible rows change with routes and filters.
    const pool = Math.random() < 0.5
      ? document.querySelectorAll('.hud, .table-header, h1')
      : document.querySelectorAll('.game-row')
    const el = pool[Math.floor(Math.random() * pool.length)]
    // WAAPI so the CSS load-in animations are never touched/restarted
    // (the dimmed list behind an open game stays still)
    if (el && !el.closest('.ghost, .dim')) {
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

onMounted(() => {
  registerWarp({
    view: view.value,
    list: list.value,
    kick: () => shape.value?.kick(KICK_CLICK, false),
  })
  // the ghost list's position depends on the window size and on row heights
  window.addEventListener('resize', syncGhost)
  document.fonts?.ready.then(syncGhost)
  // wait for the load-in sequence to finish before ambient glitches start
  setTimeout(scheduleAmbientFlicker, timings.ambientAt)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncGhost)
  clearTimeout(ambientTimer)
})
</script>

<style scoped>
/* ── Shell & backgrounds ─────────────────────────── */
#shell {
  min-height: 100vh;
  position: relative;
  /* the page pans sideways during transitions: never scroll horizontally */
  overflow-x: clip;
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
  /* above the wireframe shape (z 1) so it fades the shape's edges into the bg */
  z-index: 2;
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
.hud-link {
  pointer-events: auto;
  text-decoration: none;
  transition: color 0.2s;
}
.hud-link:hover, .hud-link:focus-visible { color: var(--accent); }
.hud-top    { top: 18px; left: 50%; transform: translateX(-50%); }
/* About: a proper button, so it reads as the way to the site's explanation */
.hud-about {
  top: 14px;
  right: 18px;
  padding: 0.45rem 0.95rem;
  font-size: 0.92rem;
  letter-spacing: 0.24em;
  color: var(--accent);
  border: 1px solid rgba(42,245,255,0.55);
  background: rgba(7,11,24,0.75);
  box-shadow: 0 0 12px rgba(42,245,255,0.15);
  transition: color 0.2s, background 0.2s, box-shadow 0.2s;
}
.hud-about:hover, .hud-about:focus-visible {
  color: var(--bg);
  background: var(--accent);
  box-shadow: 0 0 16px rgba(42,245,255,0.45);
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
}

/* ── List behind a game page ─────────────────────── */
.view-wrap {
  position: relative;
  min-height: calc(100vh - 10rem);
}
/* out of the flow, so the page sets the document height; clipped at the
   page's bottom, free to hang off the left of the screen. The tall top
   margin just keeps the rows above the game's row unclipped. */
.list-clip.ghost {
  position: absolute;
  top: -100vh;
  bottom: 0;
  left: 0;
  right: 0;
  overflow-x: visible;
  overflow-y: clip;
}

@media (max-width: 600px) {
  main {
    padding: 3.2rem 0.75rem 4.5rem;
  }

  /* Top HUD title is wider than the screen; the About link stays */
  .hud-top { display: none; }
  .hud-about { top: 10px; right: 10px; padding: 0.3rem 0.6rem; font-size: 0.74rem; letter-spacing: 0.2em; }

  .hud-bottom {
    font-size: 0.62rem;
    letter-spacing: 0.2em;
    bottom: 12px;
  }
}

/* ── Load-in sequence ────────────────────────────── */
/* HUD chrome flickers on like a CRT powering up (timed by the intro) */
.intro-full .hud,
.intro-short .hud,
.intro-quick .hud {
  animation: flicker-in 0.9s linear var(--hud-delay) backwards;
}
</style>

<style>
/* While a game is open, everything in the list except that game's row is
   dimmed (.dim: lib/warp.js, while it animates; .ghost: once it is open;
   .bright: not yet, the opening animation on a direct link is about to run) */
.list-clip .list-view > :not(.game-list),
.list-clip .game-list > .game-row {
  transition: opacity 0.3s ease;
}
.list-clip.dim .list-view > :not(.game-list),
.list-clip.ghost:not(.bright) .list-view > :not(.game-list),
.list-clip.dim .game-list > .game-row:not(.open):not([data-opening]),
.list-clip.ghost:not(.bright) .game-list > .game-row:not(.open):not([data-opening]) {
  opacity: 0.3;
}
/* ...and ignores the pointer: rows sliding under a still cursor would
   otherwise each fire their hover highlight on the way past */
.list-clip.dim .game-list > .game-row:not(.open):not([data-opening]),
.list-clip.ghost .game-list > .game-row:not(.open):not([data-opening]) {
  pointer-events: none;
}
/* no row reacts to the pointer until a transition has finished */
.list-clip[data-moving] .game-row { pointer-events: none; }
/* every other row has a faint stripe: not under an opened row's band */
.list-clip .game-list > .game-row.open,
.list-clip .game-list > .game-row[data-opening] {
  background: transparent;
}

/* shared by the HUD and the list's table header */
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
</style>
