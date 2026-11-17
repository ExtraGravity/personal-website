<template>
  <span
    v-if="levels.length"
    class="player-icons"
    :role="decorative ? null : 'img'"
    :aria-label="decorative ? null : summary"
    :aria-hidden="decorative ? 'true' : null"
    :style="scale < 1 ? { '--pi-scale': scale } : null"
  >
    <span
      v-for="(lvl, i) in levels"
      :key="i"
      class="pi"
      :class="`lvl-${lvl}`"
      :title="decorative ? null : playerLabel(i + 1, lvl)"
    >
      <svg viewBox="0 0 10 14" aria-hidden="true" focusable="false">
        <circle cx="5" cy="3.2" r="2.4" />
        <path d="M0.6 14 V10.4 C0.6 7.9 2.5 6.6 5 6.6 C7.5 6.6 9.4 7.9 9.4 10.4 V14 Z" />
      </svg>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { MAX_PLAYERS, playerLabel } from '../lib/games.js'

const props = defineProps({
  players: { type: Array, default: () => [] },
  // legend use (a single sample icon next to its own text): no titles/labels
  decorative: Boolean,
})

// one icon per player count, first = 1 player, capped at MAX_PLAYERS
const levels = computed(() => (props.players || []).slice(0, MAX_PLAYERS))
// past 8 icons, shrink them so the row still fits the PLAYERS column
const scale = computed(() => Math.min(1, 8 / Math.max(levels.value.length, 1)))
const summary = computed(() => levels.value.map((l, i) => playerLabel(i + 1, l)).join(', '))
</script>

<style scoped>
.player-icons {
  display: inline-flex;
  align-items: flex-end;
  gap: calc(var(--pi-gap, 1px) * var(--pi-scale, 1));
  line-height: 0;
}
.pi { display: inline-block; }
.pi svg {
  display: block;
  width: calc(var(--pi-w, 9px) * var(--pi-scale, 1));
  height: calc(var(--pi-w, 9px) * var(--pi-scale, 1) * 1.4);
  fill: currentColor;
}
.lvl-green  { color: var(--lvl-green); filter: drop-shadow(0 0 3px rgba(160,240,160,0.35)); }
.lvl-yellow { color: var(--lvl-yellow); }
.lvl-red    { color: var(--lvl-red); }
.lvl-grey   { color: var(--lvl-grey); }
</style>
