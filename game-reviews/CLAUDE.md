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

## Checking animations

The preview pane is often hidden, so animations freeze and
`requestAnimationFrame` never fires. Check by finishing or stepping animations
(`a.finish()`, `currentTime`) and measuring rects, at phone and desktop widths.
Say so when something was only checked that way: the real test is a phone.
