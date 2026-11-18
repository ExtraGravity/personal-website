<template>
  <article class="about">
    <a class="back-link" :href="listHref" @click.prevent="goToList">
      <ArrowIcon />
      Back to list
    </a>

    <h1>About</h1>

    <section>
      <h2>What this is</h2>
      <p>We're {{ JELLY }} and {{ JUPITER }} and we like to play co-op games together.</p>
      <p>
        Finding a good co-op game is harder than it should be. Most reviews are written by people
        playing alone, and a game that's great solo can be a chore with a friend, or the other way
        round. So when we finish a game (or give up on it) we each score it and write down what we
        thought, in the hope it helps you and your friends find your next one.
      </p>
    </section>

    <section>
      <h2>How scores work</h2>
      <p>
        Each of us scores a game out of 10 for how much fun we had playing it together. <b>Score</b>
        is the average of the two.
      </p>
    </section>

    <section>
      <h2>Completed</h2>
      <p>
        A game's page says whether we finished it. What counts as finished can be subjective:
        sometimes it's the credits, sometimes it's when we felt we'd seen what the game has to offer.
        For games we didn't finish, the review is of what we played.
      </p>
    </section>

    <section>
      <h2>Early access</h2>
      <p>
        We try to avoid scoring early access games, since they can change a lot before release. When
        we do, the game's page says so, and the review is of the game as it was when we played it.
      </p>
    </section>

    <section>
      <h2>Devs</h2>
      <p>A game's page says who made it:</p>
      <ul class="devs">
        <li v-for="(d, id) in DEV_SIZES" :key="id"><b>{{ id }}</b> {{ d.label }}</li>
      </ul>
    </section>

    <section>
      <h2>Player-count colours</h2>
      <p>
        Each little person is one player count: the first is 1 player, the second is 2, and so on up to
        the most the game supports (we stop at 12).
      </p>
      <ul class="levels">
        <li v-for="(info, id) in LEVELS" :key="id">
          <PlayerIcons :players="[id]" decorative /> <b>{{ info.label }}</b> {{ levelText[id] }}
        </li>
      </ul>
    </section>

    <section>
      <h2>Tags</h2>
      <ul class="tag-list">
        <li v-for="t in TAGS" :key="t.id">
          <RouterLink class="tag" :to="{ name: 'list', query: { tags: t.id } }">{{ t.label }}</RouterLink>
          <span>{{ t.meaning }}</span>
        </li>
      </ul>
    </section>

    <section>
      <h2>Cost per person</h2>
      <p>
        The COST column is what each person pays for the cheapest way for the group to play, in
        Canadian dollars. We assume 2 players, or the smallest group you pick in the Players filter.
        If everyone needs their own copy, that's the full price each. If one copy is enough
        (a friend's pass, Remote Play Together, or a couch game), the price is split between the maximum
        number of players.
        Free games say Free. Prices are entered by hand and don't follow sales.
      </p>
    </section>

    <section>
      <h2>Why some games have less detail</h2>
      <p>
        We started with just scores and hours. We're slowly adding player counts, cost, co-op
        notes and tags to the older reviews. Until a game has them, the filters hide it (you can
        still show them anyway).
      </p>
    </section>
  </article>
</template>

<script setup>
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import PlayerIcons from '../components/PlayerIcons.vue'
import ArrowIcon from '../components/ArrowIcon.vue'
import { LEVELS, JELLY, JUPITER, DEV_SIZES } from '../lib/games.js'
import { TAGS } from '../data/tags.js'
import { navState } from '../lib/warp.js'

const router = useRouter()
const goToList = inject('goToList')
const listHref = computed(() => router.resolve({ name: 'list', query: navState.listQuery }).href)

const levelText = {
  green: 'the best way to experience the game.',
  yellow: 'works fine, but not the best way to play.',
  red: "technically supported, but we wouldn't recommend it.",
  grey: 'not officially supported by the game.',
}
</script>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
  max-width: 680px;
}
.back-link { align-self: flex-start; }
h1 {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 4.2rem;
  letter-spacing: 0.15em;
  line-height: 1;
}
h2 {
  margin-bottom: 0.5rem;
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 1.6rem;
  letter-spacing: 0.14em;
  color: var(--accent);
}
p, li {
  font-family: var(--font-body);
  font-size: 1.03rem;
  line-height: 1.65;
  color: var(--text-body);
}
b { font-weight: normal; color: var(--text); }
ul { list-style: none; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem; }
.devs b { display: inline-block; width: 1.5rem; font-family: var(--font-hud); color: var(--accent); }
.levels li { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.levels :deep(.player-icons) { --pi-w: 11px; }
/* one grid for the whole list, so every meaning starts at the same edge,
   just past the widest tag */
.tag-list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.35rem 0.8rem;
  align-items: baseline;
}
.tag-list li { display: contents; }
/* when a meaning wraps, split it evenly rather than leaving one word behind */
.tag-list li > span { text-wrap: balance; }
.tag {
  justify-self: start;
  padding: 0.25rem 0.6rem;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--accent);
  border: 1px solid rgba(42,245,255,0.35);
}
.tag:hover, .tag:focus-visible { color: var(--bg); background: var(--accent); }

@media (max-width: 600px) {
  h1 { font-size: 3rem; }
  .tag-list { grid-template-columns: 1fr; gap: 0.3rem; }
  .tag-list li > span { margin-bottom: 0.4rem; }
}
</style>
