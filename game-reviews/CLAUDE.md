# Co-op Reviews (game-reviews)

Jelly and Jupiter's co-op game review site. Vue 3 + Vite + vue-router (history
mode), no backend. Part of the `personal-website` repo; this folder is the
whole app. Live at enochtsang.com, review copy at https://enochtsang.com:8443.

Display names: **Jelly** = Enoch = data key `enoch`; **Jupiter** = Mohammed =
data key `mo`. Use the display names in anything a visitor sees.

## Working here

- Keep changes small and to what was asked. Don't race ahead.
- Don't commit unless asked. Work has been on branch `coop-reviews-public`.
- Don't deploy unless asked; show changes on the local dev server instead.
  `bash deploy-review.sh` updates the review copy (builds, uploads, swaps
  `dist`); `deploy.sh` is the live site.
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

## Domain move and nginx: do it all at once

The site is moving to a new domain (planned: Better Together Gaming). Leave
the server config alone until then and make all of these changes in one go.
Config is on `root@enochtsang.com` (`nginx -T` shows it); the enochtsang.com
block on 443 and the review block on 8443 both currently use
`try_files $uri $uri/ /index.html`.

1. **Trailing slash.** The per-route folders make nginx 301 `/games/x` to
   `/games/x/`, so every canonical and sitemap URL points at a redirect. Use
   `try_files $uri $uri/index.html =404;` (no bare `$uri/`) and redirect slash
   URLs to no-slash: `rewrite ^/(.+)/$ /$1 permanent;`.
2. **Real 404s.** Unknown paths currently get 200 plus the home page (soft
   404). With every route a real file, drop the `/index.html` fallback and add
   `error_page 404 /404.html` (postbuild would need to write a `404.html`
   with `noindex`).
3. **www.** `https://www.enochtsang.com` serves a separate, older build with
   200 (it shows real names). Make www 301 to the bare domain; check where its
   DNS points.
4. **Compression.** Only HTML is gzipped. Add `gzip_types text/css
   application/javascript application/json text/xml application/xml
   image/svg+xml image/x-icon; gzip_vary on;`.
5. **Caching.** `Cache-Control: no-cache` on HTML; `public, max-age=31536000,
   immutable` on `/assets/`. Deploys swap `dist` wholesale, so a cached HTML
   file can point at a deleted bundle.
6. **Review copy.** Keep `X-Robots-Tag: noindex, nofollow` on 8443 (already
   there) and give it the same `try_files` as live.
7. **The domain itself.** Update `SITE` in `scripts/postbuild.js` and the
   sitemap URL in `public/robots.txt`; 301 every old enochtsang.com URL to the
   same path on the new domain (path preserved, not all to `/`); then use
   Search Console's change of address.

Test on 8443 first (`deploy-review.sh`, then curl each route for status,
redirects, title and canonical), then live.

## Checking animations

The preview pane is often hidden, so animations freeze and
`requestAnimationFrame` never fires. Check by finishing or stepping animations
(`a.finish()`, `currentTime`) and measuring rects, at phone and desktop widths.
Say so when something was only checked that way: the real test is a phone.
