/* The fixed tag list. One shared source for the filters, the game page and
   the About page. `id` is what goes in games.js (`tags: ['chill']`) and in
   the URL. */
export const TAGS = [
  { id: 'chill', label: 'Chill', meaning: 'Low pressure. Good for winding down and chatting while you play.' },
  { id: 'difficult', label: 'Difficult', meaning: 'Expect to fail, retry and get better. Not a relaxing evening.' },
  { id: 'non-gamer-friendly', label: 'Non-gamer friendly', meaning: 'Easy enough to pick up with someone who rarely plays games.' },
  { id: 'grindy', label: 'Grindy', meaning: 'A lot of repeating the same thing to progress or to get better gear.' },
  { id: 'replayable', label: 'Replayable', meaning: 'Worth going back to after you finish, or has no real end.' },
]

export const TAG_BY_ID = Object.fromEntries(TAGS.map((t) => [t.id, t]))
