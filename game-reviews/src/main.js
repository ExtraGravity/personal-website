import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router.js'
import { initIntro } from './lib/intro.js'

// decide the intro length before anything mounts (counts this visit)
initIntro(window.location.pathname)
// the page transition restores the list's scroll position itself
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

createApp(App).use(router).mount('#app')
