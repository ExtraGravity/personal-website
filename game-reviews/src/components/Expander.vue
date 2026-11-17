<template>
  <section class="exp" :class="{ open }">
    <h2 class="exp-head">
      <button
        type="button"
        class="exp-btn"
        :aria-expanded="open"
        :aria-controls="bodyId"
        @click="open = !open"
      >
        <svg class="caret" viewBox="0 0 87 100" aria-hidden="true"><path d="M86.6,50 L0,0 L0,100 L86.6,50 Z" /></svg>
        <span class="exp-title"><slot name="header" /></span>
      </button>
    </h2>
    <!-- the wrapper's grid row animates from 0 to the body's full height, so
         the content below slides instead of jumping; inert while closed keeps
         the hidden content out of tab order and screen readers -->
    <div class="exp-wrap" :inert="!open">
      <div :id="bodyId" class="exp-body">
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, useId } from 'vue'

const bodyId = `exp-${useId()}`
const open = ref(false) // closed by default
</script>

<style scoped>
.exp {
  border-top: 1px solid rgba(42,245,255,0.12);
}
.exp:last-child { border-bottom: 1px solid rgba(42,245,255,0.12); }
.exp-head { font-weight: normal; }
.exp-btn {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem 0.6rem;
  text-align: left;
  overflow: hidden;
}
/* same sweep feel as the list rows */
.exp-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(42,245,255,0.03), rgba(42,245,255,0.12) 85%, rgba(42,245,255,0.22));
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}
.exp-btn:hover::before,
.exp-btn:focus-visible::before,
.exp.open .exp-btn::before { transform: scaleX(1); }
.caret {
  position: relative;
  width: 9px; height: 11px;
  flex: none;
  fill: var(--accent-dim);
  transition: transform 0.22s ease, fill 0.2s;
}
.exp-btn:hover .caret, .exp.open .caret { fill: var(--accent); }
.exp.open .caret { transform: rotate(90deg); }
.exp-title {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.9rem;
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.12em;
  line-height: 1.1;
  color: var(--text);
}
.exp-wrap {
  display: grid;
  grid-template-rows: 0fr;
  visibility: hidden;
  /* closing: shrink, then hide once it's shut */
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s linear 0.3s;
}
.exp.open .exp-wrap {
  grid-template-rows: 1fr;
  visibility: visible;
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s;
}
.exp-body {
  min-height: 0;
  overflow: hidden;
  padding: 0 0.6rem 0 2.05rem;
  font-size: 0.95rem;
  line-height: 1.55;
  letter-spacing: 0.03em;
  color: rgba(221, 238, 255, 0.78);
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
/* the spacing lives inside the clipped box so it grows with it */
.exp-body > :first-child { margin-top: 0.2rem; }
.exp-body > :last-child { margin-bottom: 1.1rem; }
.exp.open .exp-body {
  opacity: 1;
  transform: none;
  transition: opacity 0.25s ease 0.08s, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
@media (prefers-reduced-motion: reduce) {
  .exp-wrap, .exp.open .exp-wrap, .exp-body, .exp.open .exp-body { transition: none; }
}

@media (max-width: 600px) {
  .exp-title { font-size: 1.3rem; }
  .exp-body { padding-left: 1.4rem; }
}
</style>
