<template>
  <div class="filters">
    <!-- search bar + actions, always visible -->
    <div class="search-row">
      <label class="search">
        <span class="sr-only">Search games by name</span>
        <svg class="search-icon" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="5" />
          <path d="M10.4 10.4 L15 15" />
        </svg>
        <input
          type="search"
          :value="search"
          placeholder="Search games…"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          @input="$emit('search', $event.target.value)"
          @keydown.esc="$emit('search', '')"
        />
      </label>
      <div class="actions">
        <button class="action lucky" type="button" :disabled="!luckyAvailable" @click="$emit('lucky')">
          <span aria-hidden="true">⚄</span> Feeling lucky
        </button>
        <button class="action" type="button" :disabled="!canClear" @click="$emit('clear')">Clear filters</button>
      </div>
    </div>

    <!-- Filters -->
    <button
      class="toggle"
      type="button"
      :aria-expanded="moreOpen"
      aria-controls="more-filters"
      @click="moreOpen = !moreOpen"
    >
      <ArrowIcon class="caret" />
      Filters
      <span v-if="!moreOpen && counts.total" class="badge">{{ counts.total }} active</span>
    </button>

    <!-- each panel's height slides open and shut (see "Open / close" below) -->
    <div class="fold" :class="{ open: moreOpen }" :inert="!moreOpen">
      <div class="fold-clip">
      <div id="more-filters" class="panel">
        <div class="group">
          <div class="group-label">
            Players
            <span class="hint">{{ playersHint }}</span>
          </div>
          <div v-for="r in RANGE_ROWS" :key="r.key" class="range-row">
            <span class="range-label">{{ r.label }}</span>
            <div class="chips">
              <button
                v-for="n in MAX_PLAYERS" :key="r.key + n" type="button"
                class="chip num" :class="{ inrange: inRange(n) }"
                :aria-pressed="state[r.key] === n"
                :aria-label="`${r.aria} ${n} player${n === 1 ? '' : 's'}`"
                @click="r.set(n)"
              >{{ n }}</button>
            </div>
          </div>
        </div>

        <div class="group">
          <div class="group-label">Co-op support type</div>
          <div class="chips">
            <button
              v-for="m in MODES" :key="m.id" type="button" class="chip"
              :aria-pressed="state.modes.includes(m.id)"
              @click="toggleIn('modes', m.id)"
            >{{ m.label }}</button>
          </div>
        </div>

        <div class="group">
          <label class="group-label" for="max-cost">
            Max cost
            <span class="hint">per person, CAD, for {{ groupSize }} players</span>
          </label>
          <div class="money">
            <span class="money-sign" aria-hidden="true">$</span>
            <input
              id="max-cost"
              type="number"
              inputmode="decimal"
              min="0"
              step="1"
              placeholder="Any"
              :value="state.cost ?? ''"
              @input="setCost($event.target.value)"
            />
          </div>
        </div>

        <div class="group">
          <div class="group-label">Devs</div>
          <div class="chips">
            <button
              v-for="(d, id) in DEV_SIZES" :key="id" type="button" class="chip"
              :aria-pressed="state.devs.includes(id)"
              @click="toggleIn('devs', id)"
            ><b class="dev-id">{{ id }}</b> {{ d.label }}</button>
          </div>
        </div>

        <!-- Even more filters -->
        <button
          class="toggle inner"
          type="button"
          :aria-expanded="evenOpen"
          aria-controls="even-more-filters"
          @click="evenOpen = !evenOpen"
        >
          <ArrowIcon class="caret" />
          Even more filters
          <span v-if="!evenOpen && counts.evenMore" class="badge">{{ counts.evenMore }} active</span>
        </button>

        <div class="fold inner-fold" :class="{ open: evenOpen }" :inert="!evenOpen">
          <div class="fold-clip">
          <div id="even-more-filters" class="panel inner-panel">
            <div class="group">
              <div class="group-label">Length</div>
              <div class="chips">
                <button
                  v-for="l in LENGTHS" :key="l.id" type="button" class="chip"
                  :aria-pressed="state.lengths.includes(l.id)"
                  @click="toggleIn('lengths', l.id)"
                >{{ l.label }}</button>
              </div>
            </div>

            <div class="group">
              <div class="group-label">Tags</div>
              <div class="chips">
                <HeadTip
                  v-for="t in TAGS" :key="t.id" v-slot="{ describedby }"
                  :text="t.meaning" align="left" :focusable="false"
                >
                  <button
                    type="button" class="chip"
                    :aria-pressed="state.tags.includes(t.id)"
                    :aria-describedby="describedby"
                    @click="toggleIn('tags', t.id)"
                  >{{ t.label }}</button>
                </HeadTip>
                <HeadTip
                  v-slot="{ describedby }"
                  text="Players on different platforms can play together."
                  align="left" :focusable="false"
                >
                  <button
                    type="button" class="chip"
                    :aria-pressed="state.crossplay"
                    :aria-describedby="describedby"
                    @click="$emit('update', { crossplay: !state.crossplay })"
                  >Crossplay</button>
                </HeadTip>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MODES, LENGTHS, playerRange, groupSize as groupSizeOf, parseCost } from '../lib/filters.js'
import { TAGS } from '../data/tags.js'
import HeadTip from './HeadTip.vue'
import ArrowIcon from './ArrowIcon.vue'
import { MAX_PLAYERS, DEV_SIZES } from '../lib/games.js'

const props = defineProps({
  state: Object,
  search: String,
  counts: Object,
  canClear: Boolean,
  luckyAvailable: Boolean,
})
const emit = defineEmits(['search', 'update', 'clear', 'lucky'])

// both panels start closed; a closed toggle shows how many choices inside it are on
const moreOpen = ref(false)
const evenOpen = ref(false)

const range = computed(() => playerRange(props.state))
const groupSize = computed(() => groupSizeOf(props.state))
const inRange = (n) => !!range.value && n >= range.value[0] && n <= range.value[1]

const playersHint = computed(() => {
  const r = range.value
  if (!r) return 'any'
  if (r[0] === r[1]) return `exactly ${r[0]}`
  return `${r[0]} to ${r[1]}`
})

function setMin(n) {
  const s = props.state
  if (s.pmin === n) return emit('update', { pmin: null })
  emit('update', { pmin: n, pmax: s.pmax && s.pmax < n ? n : s.pmax })
}
function setMax(n) {
  const s = props.state
  if (s.pmax === n) return emit('update', { pmax: null })
  emit('update', { pmax: n, pmin: s.pmin && s.pmin > n ? n : s.pmin })
}
// empty box (or anything that isn't a number from 0 up) = no limit
function setCost(v) {
  emit('update', { cost: parseCost(v) })
}
const RANGE_ROWS = [
  { label: 'Min', key: 'pmin', aria: 'At least', set: setMin },
  { label: 'Max', key: 'pmax', aria: 'At most', set: setMax },
]
function toggleIn(key, id) {
  const cur = props.state[key]
  emit('update', { [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] })
}
</script>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.6rem;
}

/* ── Search row ──────────────────────────────────── */
.search-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: stretch;
}
.search {
  flex: 1 1 260px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 0.8rem;
  border: 1px solid rgba(42,245,255,0.25);
  background: rgba(42,245,255,0.03);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 14px rgba(42,245,255,0.18);
}
.search-icon {
  width: 14px; height: 14px;
  flex: none;
  fill: none;
  stroke: var(--accent-dim);
  stroke-width: 1.6;
}
.search input {
  flex: 1;
  min-width: 0;
  padding: 0.65rem 0;
  font-family: var(--font-hud);
  font-size: 1rem;
  letter-spacing: 0.08em;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: none;
}
.search input::placeholder { color: rgba(221,238,255,0.3); }
.search input::-webkit-search-cancel-button { filter: hue-rotate(140deg) brightness(1.5); }

.actions { display: flex; gap: 0.6rem; flex: 0 0 auto; }
.action {
  padding: 0.55rem 0.9rem;
  font-family: var(--font-hud);
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(42,245,255,0.8);
  border: 1px solid rgba(42,245,255,0.3);
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.action:hover:not(:disabled) {
  background: rgba(42,245,255,0.1);
  color: #fff;
  border-color: var(--accent);
}
.action:disabled { opacity: 0.35; cursor: default; }
.lucky span { font-size: 1rem; line-height: 0; }

/* ── Toggles ─────────────────────────────────────── */
.toggle {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.25rem 0;
  font-family: var(--font-hud);
  font-size: 0.82rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(42,245,255,0.65);
}
.toggle:hover { color: var(--accent); }
.caret {
  width: 7px; height: 8px;
  fill: currentColor;
  transition: transform 0.2s;
}
.toggle[aria-expanded="true"] .caret { transform: rotate(90deg); }
.badge {
  padding: 0.05rem 0.45rem;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--bg);
  background: var(--accent);
}

/* ── Panels ──────────────────────────────────────── */
.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.9rem 1rem 1rem;
  border-left: 1px solid rgba(42,245,255,0.25);
  background: linear-gradient(90deg, rgba(42,245,255,0.045), transparent 70%);
}
.inner-panel {
  background: linear-gradient(90deg, rgba(42,245,255,0.035), transparent 70%);
}
.toggle.inner { margin-top: 0.2rem; }

.group { display: flex; flex-direction: column; gap: 0.45rem; }
.group-label {
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.14em;
  color: var(--text);
}
.hint {
  margin-left: 0.6rem;
  font-family: var(--font-hud);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--text-dim);
}
.range-row { display: flex; align-items: center; gap: 0.6rem; }
.range-label {
  width: 2.4rem;
  flex: none;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim);
}

/* max cost: a short number box styled like the search bar */
.money {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0 0.7rem;
  border: 1px solid rgba(42,245,255,0.25);
  background: rgba(7,11,24,0.6);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.money:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 14px rgba(42,245,255,0.18);
}
.money-sign { color: var(--accent-dim); font-size: 0.9rem; }
.money input {
  width: 5.5rem;
  padding: 0.4rem 0;
  font-family: var(--font-hud);
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: none;
  appearance: textfield;
  -moz-appearance: textfield;
}
.money input::-webkit-outer-spin-button,
.money input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.money input::placeholder { color: rgba(221,238,255,0.3); }

.chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip {
  padding: 0.35rem 0.7rem;
  font-family: var(--font-hud);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  color: rgba(221,238,255,0.7);
  border: 1px solid rgba(42,245,255,0.2);
  background: rgba(7,11,24,0.6);
  transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.dev-id { font-weight: normal; color: var(--accent); margin-right: 0.25rem; }
.chip[aria-pressed="true"] .dev-id { color: inherit; }
.chip.num { min-width: 2.1rem; padding: 0.35rem 0; text-align: center; }
.chip:hover { border-color: rgba(42,245,255,0.6); color: #fff; }
.chip.inrange { border-color: rgba(42,245,255,0.45); background: rgba(42,245,255,0.08); }
.chip[aria-pressed="true"] {
  color: var(--bg);
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(42,245,255,0.35);
}

/* ── Open / close ────────────────────────────────── */
/* The grid row goes from 0 to the panel's full height. While shut, the
   negative margin also takes back the gap the parent leaves for it. */
.fold {
  --fold-gap: 0.6rem; /* .filters gap */
  display: grid;
  grid-template-rows: 0fr;
  margin-top: calc(-1 * var(--fold-gap));
  visibility: hidden;
  transition:
    grid-template-rows 0.3s var(--ease-fold),
    margin-top 0.3s var(--ease-fold),
    visibility 0s linear 0.3s;
}
.fold.open {
  grid-template-rows: 1fr;
  margin-top: 0;
  visibility: visible;
  transition:
    grid-template-rows 0.3s var(--ease-fold),
    margin-top 0.3s var(--ease-fold),
    visibility 0s;
}
.inner-fold { --fold-gap: 1rem; } /* .panel gap */
.inner-fold.open { margin-top: -0.3rem; }
.fold-clip { min-height: 0; overflow: hidden; }
/* Once a panel has finished sliding open, stop clipping it so the tooltips on
   its chips can hang below the panel's edge. Closing clips again at once. */
.fold.open > .fold-clip {
  overflow: visible;
  transition: overflow 0s linear 0.3s;
  transition-behavior: allow-discrete;
}
.fold > .fold-clip > .panel {
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.2s ease, transform 0.3s var(--ease-fold);
}
.fold.open > .fold-clip > .panel {
  opacity: 1;
  transform: none;
  transition: opacity 0.25s ease 0.08s, transform 0.3s var(--ease-fold);
}
@media (prefers-reduced-motion: reduce) {
  .fold, .fold.open, .fold > .fold-clip > .panel, .fold.open > .fold-clip > .panel { transition: none; }
}

@media (max-width: 600px) {
  .actions { flex: 1 1 100%; }
  .action { flex: 1; padding: 0.55rem 0.4rem; }
  .panel { padding: 0.8rem 0.7rem 0.9rem; }
  .chip.num { min-width: 1.9rem; }
  .range-row { gap: 0.4rem; }
  .range-label { width: 2rem; }
}
</style>
