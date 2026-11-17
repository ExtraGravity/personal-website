import { createRouter, createWebHistory } from 'vue-router'
import AboutView from './views/AboutView.vue'
import { gameBySlug, SITE_TITLE, HOME_TITLE, ABOUT_TITLE, gameTitle } from './lib/games.js'
import { installWarp } from './lib/warp.js'

// The list is always mounted by App.vue, and a game's page is its own row
// grown open (GameRow.vue), so neither route renders anything of its own.
const Empty = { render: () => null }

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'list', component: Empty },
    {
      path: '/games/:slug',
      name: 'game',
      component: Empty,
      // no such game: back to the list
      beforeEnter: (to) => gameBySlug.has(to.params.slug) || { name: 'list' },
    },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/:rest(.*)*', redirect: '/' },
  ],
  // scrolling is handled by the page transition (lib/warp.js) so it can
  // restore the list's scroll position before animating back to the row
})

router.afterEach((to) => {
  if (to.name === 'game') {
    const g = gameBySlug.get(to.params.slug)
    document.title = g ? gameTitle(g) : `Not found · ${SITE_TITLE}`
  } else if (to.name === 'about') {
    document.title = ABOUT_TITLE
  } else {
    document.title = HOME_TITLE
  }
})

installWarp(router)

export default router
