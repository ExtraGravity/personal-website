<template>
  <div
    class="game-row"
    :class="{ expanded: isOpen, 'has-blurb': canExpand }"
    @click="toggle"
  >
    <!-- sweep layers -->
    <span class="sweep-fill"></span>
    <span class="sweep-border-top"></span>
    <span class="sweep-border-bot"></span>

    <!-- row content -->
    <div class="row-main">
      <span class="expand-arrow" :style="{ visibility: canExpand ? 'visible' : 'hidden' }">
        <svg viewBox="0 0 87 100" fill="currentColor">
          <path d="M86.6,50 L0,0 L0,100 L86.6,50 Z" />
        </svg>
      </span>
      <span class="col-name">{{ game.name }}</span>
      <span class="col-score">{{ game.mo }}</span>
      <span class="col-score">{{ game.enoch }}</span>
      <span class="col-hours">{{ game.hours }}</span>
      <span class="col-avg" :class="avgClass">{{ game.avg }}</span>
    </div>

    <!-- expandable blurb -->
    <Transition name="blurb">
      <div class="row-blurb" v-if="isOpen">
        <!-- each value folds in here as soon as its column leaves the table -->
        <div v-if="foldHours" class="blurb-stats">
          <div v-if="foldScores" class="stat-people">
            <span><b>MOHAMMED</b> {{ game.mo }}</span>
            <span><b>ENOCH</b> {{ game.enoch }}</span>
          </div>
          <div class="stat-hours"><b>HOURS PLAYED</b> {{ game.hours }}</div>
        </div>
        <p v-if="game.note" class="blurb-note">{{ game.note }}</p>
        <div v-if="game.enochBlurb" class="blurb-entry">
          <span class="blurb-author">Enoch</span>
          <p>{{ game.enochBlurb }}</p>
        </div>
        <div v-if="game.moBlurb" class="blurb-entry">
          <span class="blurb-author">Mohammed</span>
          <p>{{ game.moBlurb }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({ game: Object })
const isOpen = ref(false)
const hasBlurb = computed(() => props.game.enochBlurb || props.game.moBlurb)

/* two fold stages as the viewport narrows (keep in sync with the CSS):
   ≤600 HRS leaves the table, ≤480 Mohammed/Enoch leave too — each value
   folds into the blurb as soon as its column goes */
const foldHours = ref(false)
const foldScores = ref(false)
let mqHours, mqScores
function closeIfStranded() {
  // a no-blurb row is only expandable while something is folded in
  if (!foldHours.value && !hasBlurb.value) isOpen.value = false
}
function onHours(e) { foldHours.value = e.matches; closeIfStranded() }
function onScores(e) { foldScores.value = e.matches }
onMounted(() => {
  mqHours = window.matchMedia('(max-width: 600px)')
  mqScores = window.matchMedia('(max-width: 480px)')
  foldHours.value = mqHours.matches
  foldScores.value = mqScores.matches
  mqHours.addEventListener('change', onHours)
  mqScores.addEventListener('change', onScores)
})
onUnmounted(() => {
  mqHours && mqHours.removeEventListener('change', onHours)
  mqScores && mqScores.removeEventListener('change', onScores)
})

// expandable if there's a blurb, or anything has folded into the blurb
const canExpand = computed(() => hasBlurb.value || foldHours.value)

const avgClass = computed(() => {
  const a = props.game.avg
  if (a >= 9) return 'avg-great'
  if (a >= 7) return 'avg-good'
  if (a >= 5) return 'avg-ok'
  return 'avg-bad'
})

function toggle() {
  if (canExpand.value) isOpen.value = !isOpen.value
}
</script>

<style scoped>
.game-row {
  position: relative;
  overflow: hidden;
  cursor: default;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.game-row.has-blurb { cursor: pointer; }

/* ── Sweep layers ────────────────────────────────── */
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
.game-row.expanded .sweep-fill,
.game-row.expanded .sweep-border-top,
.game-row.expanded .sweep-border-bot {
  transform: scaleX(1);
}

/* ── Row layout ──────────────────────────────────── */
.row-main {
  position: relative;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 6rem 3.8rem 3rem 3.8rem;
  gap: 0 1.2rem;
  align-items: center;
  padding: 0.65rem 1.4rem 0.65rem 0.7rem;
  font-size: 1.15rem;
  letter-spacing: 0.06em;
}

.expand-arrow {
  display: flex;
  align-items: center;
  width: 10px;
  color: var(--accent-dim);
  transition: transform 0.22s ease, color 0.2s;
}
.expand-arrow svg { width: 10px; height: 12px; }
.game-row.expanded .expand-arrow { transform: rotate(90deg); color: var(--accent); }
.game-row:hover .expand-arrow { color: var(--accent); }

.col-name {
  font-family: var(--font-display);
  font-size: 1.4rem;
  letter-spacing: 0.1em;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s, text-shadow 0.2s;
}
.game-row:hover .col-name {
  color: #fff;
  text-shadow: 0 0 14px rgba(42,245,255,0.4);
}

.col-score, .col-hours {
  text-align: right;
  color: var(--text-dim);
  font-size: 1.1rem;
  transition: color 0.2s;
}
.game-row:hover .col-score,
.game-row:hover .col-hours { color: var(--text); }

.col-avg {
  text-align: right;
  font-size: 1.15rem;
  font-weight: bold;
  letter-spacing: 0.08em;
}
.avg-great { color: var(--accent); text-shadow: 0 0 8px rgba(42,245,255,0.5); }
.avg-good  { color: #a0f0a0; }
.avg-ok    { color: #f0d080; }
.avg-bad   { color: #f07070; }

/* ── Blurb ───────────────────────────────────────── */
.row-blurb {
  position: relative;
  padding: 0.8rem 1.4rem 1rem 2.4rem;
  border-top: 1px solid rgba(42, 245, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.blurb-note {
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  color: var(--accent-dim);
  font-style: italic;
}

.blurb-entry {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.blurb-author {
  font-family: var(--font-display);
  font-size: 1.3rem;
  letter-spacing: 0.14em;
  color: var(--accent);
}

.blurb-entry p {
  font-size: 0.9rem;
  line-height: 1.45;
  letter-spacing: 0.03em;
  color: rgba(221, 238, 255, 0.75);
}

/* values folded out of the table show here, each on its own line group */
.blurb-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  color: var(--text-dim);
}
.stat-people {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.4rem;
}
.blurb-stats b {
  font-weight: normal;
  color: var(--accent);
  letter-spacing: 0.12em;
  margin-right: 0.4rem;
}

@media (max-width: 600px) {
  .row-main {
    grid-template-columns: 9px minmax(0, 1fr) 5rem 3.3rem 3.3rem;
    gap: 0 0.45rem;
    padding: 0.6rem 0.7rem 0.6rem 0.2rem;
    font-size: 1.05rem;
    /* keep numbers on the first line when a name wraps */
    align-items: baseline;
  }

  .expand-arrow { width: 8px; }
  .expand-arrow svg { width: 8px; height: 10px; }

  .col-hours { display: none; }

  .col-name {
    font-size: 1.35rem;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    line-height: 1.15;
  }
  .col-score { font-size: 0.95rem; }
  .col-avg   { font-size: 1.05rem; }

  .row-blurb {
    padding: 0.8rem 0.9rem 1rem 1.2rem;
  }

  .blurb-author { font-size: 1.3rem; }
  .blurb-entry p { font-size: 0.95rem; }
}

/* compact: drop Mohammed/Enoch from the table — only GAME + AVG remain */
@media (max-width: 480px) {
  .row-main {
    grid-template-columns: 9px minmax(0, 1fr) 3.3rem;
  }
  .col-score { display: none; }
}

/* ── Transitions ─────────────────────────────────── */
.blurb-enter-active { transition: max-height 0.3s ease, opacity 0.25s ease; }
.blurb-leave-active { transition: max-height 0.22s ease, opacity 0.18s ease; }
.blurb-enter-from, .blurb-leave-to { max-height: 0; opacity: 0; overflow: hidden; }
.blurb-enter-to, .blurb-leave-from { max-height: 600px; opacity: 1; overflow: hidden; }
</style>
