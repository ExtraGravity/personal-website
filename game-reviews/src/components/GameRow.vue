<template>
  <!-- The row keeps its slot and width in the table. The .piece inside it is
       positioned on its own, so it can be reshaped freely without moving any
       other row: it is the row and, once opened, the game's page. It grows to
       the right and then downwards (lib/warp.js animates its width and
       height), and the page's text is simply inside it. -->
  <div class="game-row" :class="{ unrated, open }" :data-slug="game.slug">
    <div class="piece">
      <RouterLink v-slot="{ href, navigate }" :to="open ? listTo : gameTo" custom>
        <a
          class="row-head"
          :href="href"
          :aria-label="open ? 'Back to list' : ariaLabel"
          @click="onClick($event, navigate)"
        >
          <!-- hover sweep layers (closed rows only) -->
          <span class="sweep-fill"></span>
          <span class="sweep-border-top"></span>
          <span class="sweep-border-bot"></span>

          <!-- row content (column folding: see .col-* rules in style.css).
               The number cells draw their value from data-v with CSS
               (::before), so the link's text is just the game's name for
               crawlers; screen readers get the full aria-label. -->
          <span class="row-main" aria-hidden="true">
            <span class="expand-arrow">
              <svg viewBox="0 0 87 100" fill="currentColor">
                <path d="M86.6,50 L0,0 L0,100 L86.6,50 Z" />
              </svg>
            </span>
            <span class="col-name"><span
              v-for="(seg, i) in nameParts"
              :key="i"
              :class="{ hit: seg.hit }"
            >{{ seg.text }}</span></span>
            <span class="col-players"><PlayerIcons :players="game.players" /></span>
            <span class="col-score col-person" :data-v="game.mo"></span>
            <span class="col-score col-person" :data-v="game.enoch"></span>
            <span class="col-hours" :data-v="game.hours"></span>
            <span class="col-flag col-ea" :data-v="game.earlyAccess ? 'EA' : ''"></span>
            <span class="col-flag col-done" :data-v="game.completed === false ? '' : '✓'"></span>
            <span class="col-flag col-devs" :class="{ none: !game.devs }" :data-v="game.devs || '—'"></span>
            <span class="col-cost" :class="{ none: cost === null }" :data-v="formatCost(cost)"></span>
            <span class="col-avg" :class="scoreClass(game.avg)" :data-v="game.avg"></span>
          </span>

          <!-- open: the whole band is the way back -->
          <span v-if="open" class="back-link band-label" aria-hidden="true">
            <svg viewBox="0 0 87 100"><path d="M86.6,50 L0,0 L0,100 L86.6,50 Z" /></svg>
            Back to list
          </span>
        </a>
      </RouterLink>

      <GameView v-if="open" class="row-page" />
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'
import PlayerIcons from './PlayerIcons.vue'
import GameView from '../views/GameView.vue'
import { highlight } from '../lib/fuzzy.js'
import { scoreClass, costPerPerson, formatCost, JELLY, JUPITER } from '../lib/games.js'
import { navState } from '../lib/warp.js'

const props = defineProps({
  game: Object,
  positions: { type: Array, default: null },  // fuzzy-matched letters
  groupSize: { type: Number, default: 2 },
  unrated: Boolean,
  open: Boolean,                               // this game's page is showing
})

const goToList = inject('goToList', null)
const gameTo = computed(() => ({ name: 'game', params: { slug: props.game.slug } }))
const listTo = computed(() => ({ name: 'list', query: navState.listQuery }))
function onClick(e, navigate) {
  if (props.open && goToList) {
    e.preventDefault()
    goToList()
  } else {
    navigate(e)
  }
}

const nameParts = computed(() => highlight(props.game.name, props.positions))
const cost = computed(() => costPerPerson(props.game, props.groupSize))
const ariaLabel = computed(() => {
  const g = props.game
  const parts = [`${g.name}`, `score ${g.avg}`, `${JUPITER} ${g.mo}`, `${JELLY} ${g.enoch}`, `${g.hours} hours`]
  if (cost.value !== null) parts.push(`cost per person ${formatCost(cost.value)}`)
  return parts.join(', ')
})
</script>

<style scoped>
.game-row {
  position: relative;
  display: block;
}
.piece {
  position: relative;
  overflow: hidden;
}
.row-head {
  position: relative;
  display: block;
  cursor: pointer;
  color: inherit;
  text-decoration: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}
.row-head:focus-visible {
  box-shadow: inset 0 0 0 1px var(--accent), 0 0 12px rgba(42,245,255,0.25);
}

/* ── Opened: the piece grows out of the row ──────────────────────────
   data-opening is set by lib/warp.js while it animates (an attribute, not a
   class: Vue rewrites the row's class list whenever it re-renders, e.g. when
   the pointer moves onto another row, and would drop it); .open once the game's
   page is showing. Sizes come from CSS variables set by lib/warp.js:
     --row-w / --row-h   the row's own size
     --page-w            width of the page part, to the right of the row
     --page-min-h        the page reaches the bottom of the screen at least */
.game-row.open,
.game-row[data-opening] {
  height: var(--row-h);   /* the row keeps its slot; the piece overflows it */
  z-index: 1;
}
.game-row.open > .piece,
.game-row[data-opening] > .piece {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(var(--row-w) + var(--page-w));
  isolation: isolate;
  /* One background for the whole piece, so nothing can fail to line up:
     1 top line   2 bottom line under the row   3 bottom line of the page part
     4 the highlight band (full width)   5 dark backdrop of the page part */
  background:
    linear-gradient(rgba(42,245,255,0.85), rgba(42,245,255,0.85)) left top / 100% 1px no-repeat,
    linear-gradient(rgba(42,245,255,0.6), rgba(42,245,255,0.6)) left calc(var(--row-h) - 1px) / var(--row-w) 1px no-repeat,
    linear-gradient(rgba(42,245,255,0.6), rgba(42,245,255,0.6)) right bottom / calc(100% - var(--row-w)) 1px no-repeat,
    linear-gradient(90deg,
      rgba(42,245,255,0.05) 0%,
      rgba(42,245,255,0.12) 55%,
      rgba(42,245,255,0.24) 85%,
      rgba(42,245,255,0.42) 100%) left top / 100% var(--row-h) no-repeat,
    linear-gradient(180deg,
      transparent var(--row-h),
      rgba(7, 11, 24, 0.55) calc(var(--row-h) + 90px)) right top / calc(100% - var(--row-w)) 100% no-repeat;
}
.game-row.open > .piece { min-height: var(--page-min-h); }
/* the band's highlight carries on down into the page part and fades out
   (same gradient, same size and position as the band's) */
.game-row.open > .piece::before,
.game-row[data-opening] > .piece::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: var(--row-h);
  left: var(--row-w);
  right: 0;
  height: 180px;
  background: linear-gradient(90deg,
    rgba(42,245,255,0.05) 0%,
    rgba(42,245,255,0.12) 55%,
    rgba(42,245,255,0.24) 85%,
    rgba(42,245,255,0.42) 100%) right top / calc(100% + var(--row-w)) 100% no-repeat;
  -webkit-mask-image: linear-gradient(180deg, #000, transparent);
  mask-image: linear-gradient(180deg, #000, transparent);
  pointer-events: none;
}
/* the band: the row's cells on the left, "back to list" at the far right */
.game-row.open .row-head,
.game-row[data-opening] .row-head { height: var(--row-h); }
.game-row.open .row-main,
.game-row[data-opening] .row-main { width: var(--row-w); }
.band-label {
  position: absolute;
  right: 1.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(42, 245, 255, 0.85);
}
.row-head:hover .band-label,
.row-head:focus-visible .band-label { color: #fff; }

/* ── Sweep layers (hover highlight of a closed row) ──────────────── */
.sweep-fill,
.sweep-border-top,
.sweep-border-bot {
  position: absolute;
  pointer-events: none;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.sweep-fill {
  inset: 0;
  clip-path: polygon(6px 0, 100% 0, 100% 100%, 0 100%);
  background: linear-gradient(90deg,
    rgba(42,245,255,0.04) 0%,
    rgba(42,245,255,0.09) 55%,
    rgba(42,245,255,0.18) 85%,
    rgba(42,245,255,0.32) 100%
  );
}

.sweep-border-top {
  left: 0; right: 0; top: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(42,245,255,0.55) 40%,
    rgba(42,245,255,0.85) 100%
  );
}

.sweep-border-bot {
  left: 0; right: 0; bottom: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(42,245,255,0.35) 40%,
    rgba(42,245,255,0.65) 100%
  );
}

.game-row:hover .sweep-fill,
.game-row:hover .sweep-border-top,
.game-row:hover .sweep-border-bot,
.row-head:focus-visible .sweep-fill,
.row-head:focus-visible .sweep-border-top,
.row-head:focus-visible .sweep-border-bot,
/* data-lit: set for one frame when a row closes, so the highlight sweeps away */
.game-row[data-lit] .sweep-fill,
.game-row[data-lit] .sweep-border-top,
.game-row[data-lit] .sweep-border-bot {
  transform: scaleX(1);
}
.game-row[data-lit] .sweep-fill,
.game-row[data-lit] .sweep-border-top,
.game-row[data-lit] .sweep-border-bot { transition: none; }
/* opened: the piece's own band replaces the hover highlight */
.game-row.open .sweep-fill,
.game-row.open .sweep-border-top,
.game-row.open .sweep-border-bot,
.game-row[data-opening] .sweep-fill,
.game-row[data-opening] .sweep-border-top,
.game-row[data-opening] .sweep-border-bot { display: none; }

/* ── Row layout ──────────────────────────────────── */
.row-main {
  position: relative;
  display: grid;
  grid-template-columns: var(--grid-cols);
  gap: var(--grid-gap);
  align-items: center;
  padding: 0.65rem 1.4rem 0.65rem 0.7rem;
  font-size: 1.15rem;
  letter-spacing: 0.06em;
}

.row-main [data-v]::before { content: attr(data-v); }

.expand-arrow {
  display: flex;
  align-items: center;
  width: 10px;
  color: var(--accent-dim);
  transition: transform 0.22s ease, color 0.2s;
}
.expand-arrow svg { width: 10px; height: 12px; }
.game-row:hover .expand-arrow,
.row-head:focus-visible .expand-arrow { color: var(--accent); transform: translateX(2px); }

.col-name {
  font-family: var(--font-display);
  font-size: 1.4rem;
  letter-spacing: 0.1em;
  /* long names wrap onto a second line rather than being cut off */
  line-height: 1.1;
  overflow-wrap: anywhere;
  transition: color 0.2s, text-shadow 0.2s;
}
.col-name .hit { color: var(--accent); text-shadow: 0 0 10px rgba(42,245,255,0.55); }
.game-row:hover .col-name,
.game-row.open .col-name,
.game-row[data-opening] .col-name,
.row-head:focus-visible .col-name {
  color: #fff;
  text-shadow: 0 0 14px rgba(42,245,255,0.4);
}

.col-players {
  display: flex;
  align-items: center;
}

.col-score, .col-hours, .col-cost {
  text-align: right;
  color: var(--text-dim);
  font-size: 1.1rem;
  transition: color 0.2s;
}
.col-cost { font-size: 1rem; }
.col-cost.none { opacity: 0.5; }
.game-row:hover .col-score,
.game-row:hover .col-hours,
.game-row:hover .col-cost { color: var(--text); }

/* early access / completed */
.col-flag {
  text-align: center;
  color: var(--accent-dim);
  transition: color 0.2s;
}
.col-ea { font-size: 0.85rem; letter-spacing: 0.12em; color: #f0d080; opacity: 0.75; }
.col-done { font-size: 1.05rem; }
.col-devs { font-size: 1rem; color: var(--text-dim); }
.col-devs.none { opacity: 0.5; }
.game-row:hover .col-devs { color: var(--text); }
.game-row:hover .col-flag { color: var(--accent); }
.game-row:hover .col-ea { color: #f0d080; opacity: 1; }

.col-avg {
  text-align: right;
  font-size: 1.15rem;
  font-weight: bold;
  letter-spacing: 0.08em;
}
/* score colours (.avg-*) are global, in style.css */

/* shown via "show them anyway": missing data for an active filter */
.game-row.unrated .row-main { opacity: 0.55; }
.game-row.unrated:hover .row-main { opacity: 1; }

@media (max-width: 600px) {
  .row-main {
    padding: 0.6rem 0.6rem 0.6rem 0.2rem;
    font-size: 1.05rem;
  }
  .band-label { right: 0.9rem; }

  .expand-arrow { width: 8px; }
  .expand-arrow svg { width: 8px; height: 10px; }

  .col-name { font-size: 1.35rem; line-height: 1.15; }
  .col-score { font-size: 0.95rem; }
  .col-avg   { font-size: 1.05rem; }
  .col-players { --pi-w: 7px; }
}
</style>
