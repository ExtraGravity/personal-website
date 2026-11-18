<template>
  <article v-if="game" :key="game.slug" class="game-page">
    <!-- 1. name + numbers -->
    <header class="game-head">
      <h1 class="game-title">{{ game.name }}</h1>
      <p class="stats">
        <span>Score <b :class="scoreClass(game.avg)">{{ game.avg }}</b></span>
        <span class="dot" aria-hidden="true">·</span>
        <span>{{ JELLY }} <b>{{ game.enoch }}</b></span>
        <span class="dot" aria-hidden="true">·</span>
        <span>{{ JUPITER }} <b>{{ game.mo }}</b></span>
        <template v-if="game.guest">
          <span class="dot" aria-hidden="true">·</span>
          <span title="Guest reviewer. Not counted in the score.">{{ game.guest.name }} <b v-if="game.guest.score != null">{{ game.guest.score }}</b> (guest)</span>
        </template>
        <span class="dot" aria-hidden="true">·</span>
        <span>{{ formatHours(game.hours) }} played</span>
        <template v-for="f in facts" :key="f.text">
          <span class="dot" aria-hidden="true">·</span>
          <span :title="f.title">{{ f.text }}</span>
        </template>
      </p>
    </header>

    <!-- 2. why play -->
    <p v-if="game.whyPlay" class="why">
      <span class="why-label">Why you should play this game</span>
      {{ game.whyPlay }}
    </p>

    <!-- 3–5. expandable details -->
    <div v-if="showPlayers || showCost" class="details">
      <Expander v-if="showPlayers">
        <template #header>
          Players
          <PlayerIcons v-if="hasPlayerData(game)" class="head-icons" :players="game.players" />
        </template>
        <ul v-if="playTags.length" class="tags play-tags" aria-label="Co-op support type">
          <li v-for="t in playTags" :key="t.label">
            <HeadTip v-if="t.query" v-slot="{ describedby }" :text="t.title" align="left" :focusable="false">
              <RouterLink class="tag" :to="{ name: 'list', query: t.query }" :aria-describedby="describedby">
                {{ t.label }}
              </RouterLink>
            </HeadTip>
            <span v-else class="tag tag-off">{{ t.label }}</span>
          </li>
        </ul>
        <p v-if="game.playersBlurb" class="prose">{{ game.playersBlurb }}</p>
        <p v-if="game.coopBlurb" class="prose">{{ game.coopBlurb }}</p>
      </Expander>

      <Expander v-if="showCost">
        <template #header>{{ costTitle }}</template>
        <p v-if="costFacts" class="facts">{{ costFacts }}</p>
        <p v-if="game.costBlurb" class="prose">{{ game.costBlurb }}</p>
      </Expander>
    </div>

    <!-- what the game is, said once so the reviews don't each repeat it -->
    <p v-if="game.gist" class="why">
      <span class="why-label">The gist</span>
      {{ game.gist }}
    </p>

    <!-- 6. reviews -->
    <p v-if="game.note" class="note">{{ game.note }}</p>
    <section v-for="r in reviews" :key="r.key" class="review">
      <div class="review-head">
        <h2>{{ r.name }}'s review</h2>
        <label v-if="r.spoiler" class="spoiler-toggle">
          <input v-model="spoilerFree[r.key]" type="checkbox" />
          <span class="box" aria-hidden="true"></span>
          Spoiler-free
        </label>
      </div>
      <p class="prose" aria-live="polite">
        <template v-if="!r.spoiler || spoilerFree[r.key]">
          {{ r.text || 'This review is all spoilers. Untick "Spoiler-free" to read it.' }}
        </template>
        <template v-else><template v-for="(p, i) in r.spoilerParts" :key="i"><mark v-if="p.added" class="spoiler-new">{{ p.text }}</mark><template v-else>{{ p.text }}</template></template></template>
      </p>
    </section>

    <!-- 7. if you liked this game -->
    <section v-if="recGroups.length" class="recs" aria-label="Games we recommend">
      <template v-for="grp in recGroups" :key="grp.key">
        <p class="prose">{{ grp.lead }}</p>
        <ul class="rec-boxes">
          <li v-for="r in grp.list" :key="r.slug">
            <RouterLink class="rec-box" :to="{ name: 'game', params: { slug: r.slug } }">
              <span class="rec-name">{{ r.name }}</span>
            </RouterLink>
          </li>
        </ul>
      </template>
    </section>

    <!-- 8. dates + Steam -->
    <p v-if="game.reviewed || game.updated || game.steamUrl" class="meta">
      <span v-if="game.reviewed">Reviewed {{ formatDate(game.reviewed) }}</span>
      <span v-if="game.updated">Updated {{ formatDate(game.updated) }}</span>
      <a v-if="game.steamUrl" :href="game.steamUrl" target="_blank" rel="noopener noreferrer">
        View on Steam <span aria-hidden="true">↗</span>
      </a>
    </p>

    <!-- 9. tags -->
    <ul v-if="tags.length" class="tags" aria-label="Tags">
      <li v-for="t in tags" :key="t.id">
        <HeadTip v-slot="{ describedby }" :text="t.meaning" align="left" :focusable="false">
          <RouterLink class="tag" :to="{ name: 'list', query: { tags: t.id } }" :aria-describedby="describedby">
            {{ t.label }}
          </RouterLink>
        </HeadTip>
      </li>
    </ul>
  </article>

</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import Expander from '../components/Expander.vue'
import HeadTip from '../components/HeadTip.vue'
import PlayerIcons from '../components/PlayerIcons.vue'
import {
  gameBySlug, recommendedGames, scoreClass, formatHours, formatDate, hasPlayerData,
  costPerPerson, formatCost, hasCostData, DEFAULT_GROUP, JELLY, JUPITER, DEV_SIZES,
} from '../lib/games.js'
import { TAG_BY_ID } from '../data/tags.js'
import { spoilerParts } from '../lib/spoilers.js'

const route = useRoute()

const game = computed(() => gameBySlug.get(route.params.slug) || null)

/* completed / early access / dev size, after the numbers (same as the list's
   DONE, EA and DEVS columns, which phones don't show) */
const facts = computed(() => {
  const g = game.value
  const out = [g.completed === false
    ? { text: 'Not finished', title: "We stopped before finishing it. What counts as finished can be subjective." }
    : { text: 'Completed', title: 'We finished it. What counts as finished can be subjective.' }]
  if (g.earlyAccess) out.push({ text: 'Played in early access', title: 'We played and reviewed it during early access, so the game may have changed since.' })
  const d = DEV_SIZES[g.devs]
  if (d) out.push({ text: d.page, title: `Devs: ${g.devs}` })
  return out
})

/* Players */
/* online / couch / crossplay: tags that open the list filtered that way
   (same query keys as lib/filters.js) */
const playTags = computed(() => {
  const g = game.value
  const out = []
  for (const m of Array.isArray(g.mode) ? g.mode : []) {
    if (m === 'couch') out.push({ label: 'Couch', query: { mode: 'couch' }, title: 'Games you can play on one couch' })
    else if (m === 'online') out.push({ label: 'Online', query: { mode: 'online' }, title: 'Games you can play online' })
  }
  if (g.crossplay === true) out.push({ label: 'Crossplay', query: { xplay: '1' }, title: 'Games with crossplay' })
  else if (g.crossplay === false) out.push({ label: 'No crossplay' })
  return out
})
const showPlayers = computed(() => {
  const g = game.value
  return hasPlayerData(g) || !!g.playersBlurb || !!g.coopBlurb || playTags.value.length > 0
})

/* Cost */
const showCost = computed(() => {
  const g = game.value
  return hasCostData(g) || !!g.costHeader || !!g.costBlurb
})
const costTitle = computed(() => {
  const g = game.value
  if (g.costHeader) return g.costHeader
  const c = costPerPerson(g, DEFAULT_GROUP)
  if (c === null) return 'Cost'
  return c === 0 ? 'Cost: Free' : `Cost: ${formatCost(c)} per person`
})
const costFacts = computed(() => {
  const g = game.value
  if (g.whoBuys === 'free') return 'Free to play.'
  if (typeof g.price !== 'number') return ''
  const price = formatCost(g.price)
  if (g.whoBuys === 'everyone') return `Everyone needs their own copy (${price} CAD each).`
  if (g.whoBuys === 'one') return `One copy (${price} CAD) is enough for the group.`
  return ''
})

/* Reviews, with the spoiler-free switch (ticked by default) */
const allSpoilerFree = () => ({ enoch: true, mo: true, guest: true })
const spoilerFree = reactive(allSpoilerFree())
watch(() => route.params.slug, () => Object.assign(spoilerFree, allSpoilerFree()))
const reviews = computed(() => {
  const g = game.value
  const out = []
  if (g.enochBlurb || g.enochSpoiler) out.push({ key: 'enoch', name: JELLY, text: g.enochBlurb, spoiler: g.enochSpoiler })
  if (g.moBlurb || g.moSpoiler) out.push({ key: 'mo', name: JUPITER, text: g.moBlurb, spoiler: g.moSpoiler })
  // guest reviewer: a review on the page only, never in the score
  if (g.guest?.blurb || g.guest?.spoiler) out.push({ key: 'guest', name: g.guest.name, text: g.guest.blurb, spoiler: g.guest.spoiler })
  // the spoiler version with its new and changed words marked
  for (const r of out) r.spoilerParts = spoilerParts(r.text, r.spoiler)
  return out
})

/* Recommendations: names in the data, resolved to games that have an entry */
const recs = computed(() => recommendedGames(game.value))
/* the top pick, then the others, each with its lead sentence */
const recGroups = computed(() => {
  const { top, also } = recs.value
  const name = game.value.name
  const out = []
  if (top.length) out.push({ key: 'top', list: top, lead: `If you liked ${name} we'd most recommend playing` })
  if (also.length) out.push({ key: 'also', list: also, lead: `${top.length ? 'But we' : `If you liked ${name} we`}'d also recommend you try` })
  return out
})

/* Tags */
const tags = computed(() => (game.value?.tags || []).map((id) => TAG_BY_ID[id]).filter(Boolean))
</script>

<style scoped>
/* The page's text. It sits inside the row's .piece (GameRow.vue), under the
   band and to the right of the row; the piece draws the background. */
.game-page {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  margin-left: var(--row-w, 0px);
  width: var(--page-w, auto);
  padding: 1.6rem 1.8rem 2.4rem;
}

.game-head { display: flex; flex-direction: column; gap: 0.5rem; }
.game-title {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 4.2rem;
  letter-spacing: 0.1em;
  line-height: 1;
  color: #fff;
  text-shadow: 0 0 22px rgba(42,245,255,0.3);
  overflow-wrap: anywhere;
}
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.6rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  color: var(--text-dim);
}
.stats b { font-weight: normal; color: var(--text); }
.stats b.avg-great, .stats b.avg-good, .stats b.avg-ok, .stats b.avg-bad { font-weight: bold; }
.dot { color: var(--accent-dim); }

.why {
  font-family: var(--font-body);
  font-size: 1.12rem;
  line-height: 1.55;
  color: var(--text);
  padding-left: 0.9rem;
  border-left: 2px solid var(--accent);
}
.why-label {
  display: block;
  margin-bottom: 0.2rem;
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.details { display: flex; flex-direction: column; }
.head-icons { --pi-w: 11px; --pi-gap: 2px; }

.play-tags { margin-bottom: 0.7rem; }
.details .prose + .prose { margin-top: 0.7rem; }
/* a fact with no filter behind it: looks like a tag, isn't a link */
.tag-off {
  color: var(--accent-dim);
  border-color: rgba(42,245,255,0.15);
  background: none;
}
.tag-off:hover { color: var(--accent-dim); background: none; box-shadow: none; }
.facts {
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  color: var(--accent-dim);
}

.prose {
  font-family: var(--font-body);
  font-size: 1.03rem;
  line-height: 1.65;
  color: var(--text-body);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.note {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--accent-dim);
  font-style: italic;
}

.review { display: flex; flex-direction: column; gap: 0.5rem; }
.review-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem 1.2rem;
}
.review-head h2 {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 1.7rem;
  letter-spacing: 0.14em;
  color: var(--accent);
}

/* custom checkbox, still a real <input> for keyboard + screen readers */
.spoiler-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-dim);
  cursor: pointer;
}
.spoiler-toggle input {
  position: absolute;
  opacity: 0;
  width: 1px; height: 1px;
}
.spoiler-toggle .box {
  width: 0.95rem; height: 0.95rem;
  border: 1px solid rgba(42,245,255,0.5);
  display: inline-grid;
  place-items: center;
}
.spoiler-toggle input:checked + .box::after {
  content: '';
  width: 0.5rem; height: 0.5rem;
  background: var(--accent);
  box-shadow: 0 0 6px rgba(42,245,255,0.6);
}
.spoiler-toggle input:focus-visible + .box { outline: 1px solid var(--accent); outline-offset: 2px; }
.spoiler-toggle:hover { color: var(--text); }
/* words that only appear in the spoiler version */
.spoiler-new {
  background: none;
  color: #f0d080;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.4rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(42,245,255,0.12);
  font-size: 0.82rem;
  letter-spacing: 0.1em;
  color: var(--text-dim);
}
.meta a { text-decoration: none; }
.meta a:hover { text-decoration: underline; }

.tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
/* .tag and .rec-box share their colours, border and hover */
.tag, .rec-box {
  text-decoration: none;
  color: var(--accent);
  border: 1px solid rgba(42,245,255,0.35);
  background: rgba(42,245,255,0.04);
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}
.tag:hover, .tag:focus-visible, .rec-box:hover, .rec-box:focus-visible {
  color: var(--bg);
  background: var(--accent);
  box-shadow: 0 0 12px rgba(42,245,255,0.35);
}
.tag {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.recs {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(42,245,255,0.12);
}
.recs .prose + .rec-boxes + .prose { margin-top: 0.6rem; }
/* same colour as the "Reviewed …" line */
.recs .prose { color: var(--text-dim); }
.rec-boxes {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.rec-box {
  display: inline-flex;
  align-items: baseline;
  gap: 0.7rem;
  padding: 0.55rem 0.9rem;
}
.rec-name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: 0.1em;
}

@media (max-width: 600px) {
  .game-page { padding: 1.2rem 0.9rem 2rem; gap: 1.3rem; }
  .game-title { font-size: 2.8rem; }
  .stats { font-size: 0.9rem; }
  .review-head h2 { font-size: 1.5rem; }
}
</style>
