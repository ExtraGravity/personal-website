# Co-op Reviews (game-reviews)

Jelly and Jupiter's co-op game review site. Vue 3 + Vite + vue-router (history
mode), no backend. Part of the `personal-website` repo; this folder is the
whole app. Live at https://bettertogethergaming.com, staging copy at
https://staging.bettertogethergaming.com.

Display names: **Jelly** = Enoch = data key `enoch`; **Jupiter** = Mohammed =
data key `mo`. Use the display names in anything a visitor sees.

## Working here

- Keep changes small and to what was asked. Don't race ahead.
- Don't commit unless asked. Work has been on branch `coop-reviews-public`.
- Don't deploy unless asked; show changes on the local dev server instead.
  `bash deploy-staging.sh` builds and updates the staging copy (one tar
  stream over ssh, then swaps `dist`). `bash deploy.sh` runs
  `deploy-staging.sh` first, then copies staging's `dist` to live on the
  server: live always gets exactly what staging has, with no second build.
- `npm run build` must pass. Dev server: preview config `game-reviews`
  (port 5173) in `.claude/launch.json`.
- To add or fill in a game from a review transcript, use the `add-game` skill
  (`.claude/skills/add-game/SKILL.md`).

## Data

- `src/data/games.js`: one entry per game. **Array order is the ranking**, best
  first. The comment at the top lists every field. Entries with
  `placeholder: true` hold made-up sample values waiting for real answers.
- `src/data/tags.js`: the fixed tag list. Don't add tags without asking.
- `src/lib/games.js`: slugs, score bands, player ratings, cost per person.
- `src/lib/filters.js`: filter state, URL query keys, search and sort.

## How the pages fit together

- Routes: `/` list, `/games/:slug` game, `/about`. The list and game routes
  render nothing themselves: `App.vue` keeps `ListView` mounted, and a game's
  page is its own row grown open.
- `GameRow.vue`: the row keeps its slot in the table; the `.piece` div inside
  it is what stretches and grows into the page. Row and page are **one div
  with one background**. Don't split them into separate elements or overlays:
  that caused visible seams more than once.
- `GameView.vue` is only the page's text, rendered inside the piece.
- `src/lib/warp.js`: all open/close animation (Web Animations API, driven by
  router guards) and the geometry in `geom()`: where the table edge and page
  sit, panning the dimmed list behind an open game, centring on wide screens.
  A direct game link plays the same opening as a click.
- `src/lib/intro.js`: load-in intro. It always plays on the list; only the
  cursor blink before the title types gets shorter on later visits.
- No tilt effect: it was removed on purpose.

## SEO build

`scripts/postbuild.js` runs after `vite build`: it writes `dist/sitemap.xml`
and one `index.html` per route (`dist/about/`, `dist/games/<slug>/`) with that
page's title, description, canonical and Open Graph tags. `#app` stays empty,
so the app and its intro start exactly as from `dist/index.html`. The site's
URL is the `SITE` constant there and in `public/robots.txt`.

Plausible analytics is in `index.html` (self-hosted at
analytics.betweenspacescounselling.com). It doesn't load on the staging host,
so test visits don't count.

## Server and nginx

The user edits nginx themselves: give them the config text, don't change the
server. Read-only checks (`nginx -T`, curl) are fine. Server is
`root@enochtsang.com` (198.199.70.199); DNS is on DigitalOcean.

- One file per site in `/etc/nginx/sites-available/`, symlinked into
  `sites-enabled/`. This site is `bettertogethergaming` (staging and live
  blocks); `enochtsang` is now only redirects.
- `bettertogethergaming.com` serves `/var/www/enochtsang/dist` (`deploy.sh`);
  `www` 301s to the bare domain. `staging.` serves
  `/var/www/bettertogethergaming-staging/dist` (`deploy-staging.sh`) with
  `X-Robots-Tag: noindex, nofollow`.
- Both use `rewrite ^/(.+)/$ /$1 permanent;` and
  `try_files $uri $uri/index.html =404;`: no-slash URLs serve the prerendered
  folder directly, slash URLs 301 to no-slash, unknown paths are real 404s.
  Canonicals and the sitemap use the no-slash form; keep them matching.
- `enochtsang.com` and `www.enochtsang.com` 301 every path (and query) to the
  same path on bettertogethergaming.com. The old 8443 review copy is gone.

- `scripts/nginx-bettertogethergaming.conf` is a reference copy of the
  server's `bettertogethergaming` file: 404 page (`error_page 404
  /404.html`, written by postbuild with `noindex` and no app script), gzip for
  CSS/JS/XML/SVG, and `Cache-Control` by path (`/assets/` a year and
  `immutable`, everything else `no-cache`). Keep it in sync when the server
  file changes. `add_header` stays at server level: one inside a `location`
  drops all the inherited headers.

Still to do:

1. **Search Console.** bettertogethergaming.com is a property with the
   sitemap submitted. enochtsang.com never had one, so the change of address
   is optional; the 301s carry the move.
2. **AI crawlers.** `robots.txt` allows every bot; blocking training crawlers
   (GPTBot, CCBot, Google-Extended, ...) is the user's call.
3. **Sitemap dates.** `lastmod` comes from each game's `updated`/`reviewed`;
   most games don't have those yet, so they go without.

Test on staging first (`deploy-staging.sh`, then curl each route for status,
redirects, title and canonical), then live.

## Checking animations

The preview pane is often hidden, so animations freeze and
`requestAnimationFrame` never fires. Check by finishing or stepping animations
(`a.finish()`, `currentTime`) and measuring rects, at phone and desktop widths.
Say so when something was only checked that way: the real test is a phone.
