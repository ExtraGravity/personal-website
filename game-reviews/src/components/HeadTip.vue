<template>
  <!-- Something with an explanation that shows on hover (or focus, which is
       also what a tap does on a phone): column headings, filter chips. If what
       it wraps is a button, pass focusable=false and use the slot's
       describedby so the button carries the focus and the description. -->
  <span
    class="tip"
    :class="`tip-${align}`"
    :tabindex="focusable ? 0 : null"
    :aria-describedby="focusable ? id : null"
    @mouseenter="keepOnScreen"
    @focusin="keepOnScreen"
  >
    <slot :describedby="id" />
    <span :id="id" ref="pop" role="tooltip" class="tip-pop">{{ text }}</span>
  </span>
</template>

<script setup>
import { ref, useId } from 'vue'

defineProps({
  text: { type: String, required: true },
  // which edge of the heading the box lines up with
  align: { type: String, default: 'right' },
  focusable: { type: Boolean, default: true },
})
const id = useId()

/* Nudge the box sideways if it would hang off either edge of the screen.
   It's laid out even while hidden, so it can be measured before it shows. */
const EDGE = 8
const pop = ref(null)
function keepOnScreen() {
  const el = pop.value
  if (!el) return
  el.style.translate = ''
  const r = el.getBoundingClientRect()
  const vw = document.documentElement.clientWidth
  let dx = 0
  if (r.right > vw - EDGE) dx = vw - EDGE - r.right
  if (r.left + dx < EDGE) dx = EDGE - r.left
  if (dx) el.style.translate = `${Math.round(dx)}px 0`
}
</script>

<style scoped>
.tip {
  position: relative;
  display: inline-block;
  outline: none;
  cursor: help;
}
.tip:focus-visible { color: var(--accent); }

.tip-pop {
  position: absolute;
  top: calc(100% + 0.5rem);
  z-index: 30;
  width: 17rem;
  padding: 0.7rem 0.8rem;
  font-family: var(--font-hud);
  font-size: 0.78rem;
  line-height: 1.45;
  letter-spacing: 0.03em;
  text-transform: none;
  text-align: left;
  /* \n in the text starts a new line */
  white-space: pre-line;
  color: var(--text);
  background: rgba(7, 11, 24, 0.97);
  border: 1px solid rgba(42,245,255,0.4);
  box-shadow: 0 6px 24px rgba(0,0,0,0.5);
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s;
}
.tip-right .tip-pop { right: -0.5rem; }
.tip-left .tip-pop { left: -0.5rem; }

.tip:hover .tip-pop,
.tip:focus-within .tip-pop {
  opacity: 1;
  visibility: visible;
  transition-delay: 0.15s;
}

@media (max-width: 600px) {
  .tip-pop { width: 14rem; }
}
</style>
