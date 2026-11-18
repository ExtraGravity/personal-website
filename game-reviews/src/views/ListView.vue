<template>
  <section class="list-view" :class="{ 'intro-on': intro.mode !== 'none' }" :style="introVars">
    <header class="page-header" :inert="openSlug !== null">
      <SiteLogo class="header-logo intro-chrome" />
      <div class="header-text">
        <!-- the page's h1 only on the list itself: on a game page the game's name
             is the h1, and this stays behind as a plain heading-styled line -->
        <component :is="route.name === 'list' ? 'h1' : 'p'" class="site-title">{{ typedTitle }}<span v-if="cursorVisible" class="type-cursor" :class="{ solid: isTyping }"></span></component>
        <p class="subtitle" :class="{ shown: subtitleShown }">{{ SUBTITLE }}</p>
      </div>
      <p class="pitch" :class="{ shown: subtitleShown }">{{ PITCH }}</p>
    </header>

    <SearchFilters
      class="intro-chrome"
      :inert="openSlug !== null"
      :state="state"
      :search="searchText"
      :counts="counts"
      :can-clear="canClear"
      :lucky-available="luckyCount > 0"
      @search="onSearch"
      @update="patch"
      @clear="clearAll"
      @lucky="feelingLucky"
    />

    <p class="sr-only" aria-live="polite">{{ statusText }}</p>

    <!-- Table header -->
    <div class="table-header intro-chrome" :inert="openSlug !== null">
      <span></span>
      <span>GAME</span>
      <span><HeadTip align="left" :text="TIPS.players">PLAYERS</HeadTip></span>
      <span class="right col-person"><HeadTip :text="`${JUPITER}'s score, out of 10.`">{{ JUPITER.toUpperCase() }}</HeadTip></span>
      <span class="right col-person"><HeadTip :text="`${JELLY}'s score, out of 10.`">{{ JELLY.toUpperCase() }}</HeadTip></span>
      <span class="right col-hours"><HeadTip :text="TIPS.hours">HRS</HeadTip></span>
      <span class="right col-cost"><HeadTip :text="costTip">COST</HeadTip></span>
      <span class="right">
        <HeadTip :text="TIPS.score">SCORE</HeadTip>
      </span>
    </div>

    <!-- Game rows -->
    <div
      ref="listEl"
      class="game-list"
      :class="{ 'rows-intro': rowsIntro }"
    >
      <GameRow
        v-for="(row, i) in rows"
        :key="row.game.slug"
        :game="row.game"
        :positions="row.match && row.match.positions"
        :group-size="groupSize"
        :unrated="row.unrated"
        :open="openSlug === row.game.slug"
        :inert="openSlug !== null && openSlug !== row.game.slug"
        :class="{ dimmed: hovered !== null && hovered !== row.game.slug }"
        :style="rowsIntro ? { animationDelay: rowDelay(i) } : null"
        @mouseenter="onRowHover(row.game.slug)"
        @mouseleave="hovered = null"
      />
    </div>

    <p v-if="!rows.length" class="empty">
      No games match that.
      <button type="button" class="link-btn" @click="clearAll">Clear filters</button>
    </p>

    <p v-if="hiddenCount && !state.all" class="hidden-note">
      {{ hiddenCount }} older game{{ hiddenCount === 1 ? " isn't" : "s aren't" }} rated for this yet.
      <button type="button" class="link-btn" @click="patch({ all: true })">Show them anyway</button>
    </p>
    <p v-else-if="state.all && hiddenCount" class="hidden-note">
      Including {{ hiddenCount }} older game{{ hiddenCount === 1 ? '' : 's' }} not rated for this yet (dimmed).
      <button type="button" class="link-btn" @click="patch({ all: false })">Hide them</button>
    </p>
  </section>
</template>

<script setup>
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GameRow from '../components/GameRow.vue'
import SearchFilters from '../components/SearchFilters.vue'
import HeadTip from '../components/HeadTip.vue'
import SiteLogo from '../components/SiteLogo.vue'
import { games, gameBySlug, JELLY, JUPITER, SITE_TITLE, PITCH } from '../lib/games.js'
import {
  stateFromQuery, queryFromState, applyFilters, activeCounts,
  groupSize as groupSizeOf, luckyPool, emptyState,
} from '../lib/filters.js'
import { takeListIntro } from '../lib/intro.js'
import { navState } from '../lib/warp.js'
import { trackRowHover } from '../lib/rowHover.js'

const route = useRoute()
const router = useRouter()
const kickShape = inject('kickShape', () => {})

/* ── State lives in the URL query ─────────────────── */
// The list stays mounted behind game pages: there it keeps showing the last
// query it had, and marks the open game's row.
const listQuery = computed(() => (route.name === 'list' ? route.query : navState.listQuery))
const state = computed(() => stateFromQuery(listQuery.value))
const openSlug = computed(() => (route.name === 'game' ? route.params.slug : null))
const searchText = ref(state.value.q)
// back/forward or a pasted link: keep the input in step with the URL
watch(() => listQuery.value.q, (q) => {
  const v = typeof q === 'string' ? q : ''
  if (v !== searchText.value) searchText.value = v
})

function patch(p) {
  if (route.name !== 'list') return
  router.replace({ query: queryFromState({ ...state.value, q: searchText.value, ...p }) })
}
function onSearch(v) {
  searchText.value = v
  patch({ q: v })
}
function clearAll() {
  searchText.value = ''
  router.replace({ query: queryFromState(emptyState()) })
}

const result = computed(() => applyFilters(games, state.value))
// the open game always has its row, even if the current filters hide it
const rows = computed(() => {
  const list = result.value.rows
  const slug = openSlug.value
  if (!slug || list.some((r) => r.game.slug === slug)) return list
  const game = gameBySlug.get(slug)
  return game ? [{ game, match: null, unrated: false }, ...list] : list
})
const hiddenCount = computed(() => result.value.hiddenCount)
const counts = computed(() => activeCounts(state.value))
const groupSize = computed(() => groupSizeOf(state.value))
const canClear = computed(() => !!state.value.q || counts.value.total > 0 || state.value.all)
const luckyCount = computed(() => luckyPool(games, state.value, rows.value).length)
const statusText = computed(() => `${rows.value.length} game${rows.value.length === 1 ? '' : 's'} shown`)

/* ── Feeling lucky ────────────────────────────────── */
function feelingLucky() {
  const pool = luckyPool(games, state.value, rows.value)
  if (!pool.length) return
  const g = pool[Math.floor(Math.random() * pool.length)]
  router.push({ name: 'game', params: { slug: g.slug } })
}

/* ── Hover dim + background kick ──────────────────── */
// the rows' sweep highlight itself: lib/rowHover.js
const listEl = ref(null)
let stopRowHover = null
onMounted(() => { stopRowHover = trackRowHover(listEl.value) })
onUnmounted(() => stopRowHover?.())
const hovered = ref(null)
watch(() => route.name, () => { hovered.value = null })
function onRowHover(slug) {
  hovered.value = slug
  kickShape()
}

/* ── Column heading explanations (shown on hover) ─── */
const TIPS = {
  players: `How well it plays with each number of players, from 1 up.

Green: the best way to experience the game.
Yellow: works fine, but not the best way to play.
Red: technically supported, but we wouldn't recommend it.
Grey: not officially supported by the game.`,
  hours: 'Hours we played it.',
  score: `Our score: the average of ${JELLY}'s and ${JUPITER}'s, out of 10. The list is ordered by score, highest first.`,
}
const costTip = computed(() =>
  `What each person pays for the cheapest way to play together, assuming ${groupSize.value} players ` +
  '(or the smallest group in the Players filter). If one copy is enough for the group, its price ' +
  'is split between the maximum number of players.')

/* ── Intro: typed title + rows printing in ────────── */
const intro = takeListIntro()
const fullTitle = SITE_TITLE.toUpperCase()
const SUBTITLE = 'CO-OP GAME REVIEWS'
const typedTitle = ref(intro.mode === 'none' ? fullTitle : '')
// the subtitle flickers on once the title has finished typing
const subtitleShown = ref(intro.mode === 'none')
const cursorVisible = ref(intro.mode !== 'none')
const isTyping = ref(false)
const rowsIntro = ref(intro.mode !== 'none')
const introVars = { '--header-delay': `${Math.max(0, intro.typeAt - 250)}ms` }
const rowDelay = (i) => `${intro.rowsAt + Math.min(i * intro.rowStep, intro.rowSpread)}ms`

let typeTimer = null
let cursorTimer = null
let rowsTimer = null

function startTyping() {
  // hold for the intro's blink cycles (0.9s each); offset by one char interval
  // so the first character lands exactly at typeAt, in sync with the flickers.
  // NOTE: WireframeShape's start delay is tuned to land just before this.
  const perChar = 55
  const start = performance.now() + intro.typeAt - perChar
  // time-based so throttled timers catch up instead of stalling
  typeTimer = setInterval(() => {
    const n = Math.max(0, Math.floor((performance.now() - start) / perChar))
    // solid (non-blinking) cursor while characters are being typed
    isTyping.value = n > 0 && n < fullTitle.length
    typedTitle.value = fullTitle.slice(0, n)
    if (n >= fullTitle.length) {
      clearInterval(typeTimer)
      subtitleShown.value = true
      // let the block blink a few times, then drop it
      cursorTimer = setTimeout(() => { cursorVisible.value = false }, 2000)
    }
  }, 30)
}

onMounted(() => {
  if (intro.mode === 'none') return
  startTyping()
  // once every row has printed in, drop the intro animation so rows that
  // appear later (search/filters) just show up
  rowsTimer = setTimeout(() => { rowsIntro.value = false }, intro.rowsAt + intro.rowSpread + 600)
})
onUnmounted(() => {
  clearInterval(typeTimer)
  clearTimeout(cursorTimer)
  clearTimeout(rowsTimer)
})
</script>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.1rem;
  margin-bottom: 2rem;
  text-align: left;
}

/* the mark spans the title and subtitle */
.header-logo {
  flex: none;
  width: 4.9rem;
  height: 4.9rem;
}

.header-text { min-width: 0; }

.page-header .site-title {
  font-family: var(--font-display);
  font-size: 3.7rem;
  letter-spacing: 0.12em;
  line-height: 1;
  font-weight: bold; /* as an h1, also when it's a <p> */
  color: var(--text);
  white-space: nowrap;
  /* reserve the line while the title types in */
  min-height: 1em;
}

/* second voice: the HUD's mono face, small, wide, in the accent colour */
.subtitle {
  margin: 0.45rem 0 0;
  font-family: var(--font-hud);
  font-size: 1rem;
  letter-spacing: 0.42em;
  color: var(--accent);
  white-space: nowrap;
  opacity: 0;
}
.subtitle.shown { opacity: 1; }

/* the pitch: a sentence from us, not another HUD label, so regular case,
   no letter-spacing, dimmer; its own line under the logo and title */
.pitch {
  flex-basis: 100%;
  max-width: 34rem;
  margin: 0.1rem 0 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-dim);
  opacity: 0;
}
.pitch.shown { opacity: 1; }

/* ── Table header ────────────────────────────────── */
.table-header {
  display: grid;
  grid-template-columns: var(--grid-cols);
  gap: var(--grid-gap);
  align-items: end;
  padding: 0.3rem 1.4rem 0.3rem 0.7rem;
  font-size: 0.92rem;
  letter-spacing: 0.15em;
  color: rgba(42,245,255,0.6);
  text-transform: uppercase;
  border-bottom: 1px solid rgba(42,245,255,0.12);
  margin-bottom: 0.15rem;
  white-space: nowrap;
}
.table-header .right { text-align: right; }

/* ── Game list ───────────────────────────────────── */
.game-list {
  display: flex;
  flex-direction: column;
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

.empty, .hidden-note {
  margin-top: 1.2rem;
  padding: 0 0.7rem;
  font-size: 0.9rem;
  letter-spacing: 0.06em;
  color: var(--text-dim);
}
.empty { font-size: 1rem; color: var(--text); }
.link-btn {
  margin-left: 0.4rem;
  font-family: inherit;
  letter-spacing: inherit;
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.link-btn:hover { color: #fff; }

@media (max-width: 765px) {
  .page-header .site-title { font-size: 2.9rem; }
  .header-logo { width: 4rem; height: 4rem; }
  .subtitle { font-size: 0.85rem; }
}

@media (max-width: 600px) {
  /* small enough that the full title fits one line */
  .page-header { margin-bottom: 1.3rem; gap: 0.75rem; }
  .page-header .site-title { font-size: 1.9rem; letter-spacing: 0.1em; }
  .header-logo { width: 2.9rem; height: 2.9rem; }
  .subtitle { margin-top: 0.3rem; font-size: 0.68rem; letter-spacing: 0.32em; }
  .pitch { margin-top: 0; font-size: 0.85rem; }

  .table-header {
    padding: 0.3rem 0.6rem 0.3rem 0.2rem;
    font-size: 0.78rem;
    letter-spacing: 0.1em;
  }
}

@media (max-width: 400px) {
  .page-header .site-title { font-size: 1.55rem; }
  .header-logo { width: 2.5rem; height: 2.5rem; }
  .subtitle { font-size: 0.6rem; letter-spacing: 0.28em; }
}

@media (max-width: 340px) {
  .page-header .site-title { font-size: 1.35rem; }
}

/* ── Load-in sequence (only on the visits that get an intro) ─────── */
/* Block cursor for the typed-in title. Bebas Neue's cap height is 0.7em, but
   the font only ships a regular weight, so the bold title is synthesised and
   each letter grows about 0.015em on every side: they ink from 0.015em below
   the baseline to 0.715em. The block reaches a little past that at top and
   bottom, and is a little wider than a letter: matched exactly, it looked
   smaller. */
.type-cursor {
  display: inline-block;
  width: 0.48em;
  height: 0.79em;
  height: calc(1cap + 0.09em);
  vertical-align: -0.045em;
  background: var(--text);
  animation: blink 0.9s step-end infinite;
}
.type-cursor.solid { animation: none; }

/* search + table header flicker on in place, just before the title types */
.intro-on .intro-chrome {
  animation: flicker-in 0.5s linear var(--header-delay) backwards;
}
.intro-on .pitch.shown,
.intro-on .subtitle.shown {
  animation: flicker-in 0.5s linear;
}

/* Rows print in like terminal lines: instant on, highlighted, decaying */
.rows-intro :deep(.game-row) {
  animation: row-in 0.45s linear backwards;
}
@keyframes row-in {
  0%   { opacity: 0; }
  1%   { opacity: 1; background-color: rgba(42, 245, 255, 0.22); filter: brightness(2.2); }
  45%  { background-color: rgba(42, 245, 255, 0.08); filter: brightness(1.4); }
  100% { opacity: 1; background-color: transparent; filter: brightness(1); }
}
</style>
