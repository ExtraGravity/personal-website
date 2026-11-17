/* The fixed tag list. One shared source for the filters, the game page and
   the About page. `id` is what goes in games.js (`tags: ['chill']`) and in
   the URL; `group` decides which filter panel the tag sits in. */
export const TAGS = [
  { id: 'chill', label: 'Chill', group: 'common', meaning: 'Low pressure. Good for winding down and chatting while you play.' },
  { id: 'difficult', label: 'Difficult', group: 'common', meaning: 'Expect to fail, retry and get better. Not a relaxing evening.' },
  { id: 'non-gamer-friendly', label: 'Non-gamer friendly', group: 'common', meaning: 'Easy enough to pick up with someone who rarely plays games.' },
  { id: 'grindy', label: 'Grindy', group: 'niche', meaning: 'A lot of repeating the same thing to progress or to get better gear.' },
  { id: 'replayable', label: 'Replayable', group: 'niche', meaning: 'Worth going back to after you finish, or has no real end.' },
]

export const TAG_BY_ID = Object.fromEntries(TAGS.map((t) => [t.id, t]))
export const COMMON_TAGS = TAGS.filter((t) => t.group === 'common')
export const NICHE_TAGS = TAGS.filter((t) => t.group === 'niche')
