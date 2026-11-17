/* Sublime-Text-style fuzzy match: every typed letter must appear in the name,
   in order (gaps allowed). Among all ways to place the letters we keep the
   highest-scoring one: letters at word starts and runs of consecutive letters
   score well, long gaps and late starts cost a little.
   Returns { score, positions } or null when there's no match. */

const isAlnum = (c) => /[a-z0-9]/i.test(c)

export function fuzzyMatch(query, text) {
  const q = query.toLowerCase().replace(/\s+/g, '')
  if (!q) return { score: 0, positions: [] }
  const t = text.toLowerCase()
  const n = t.length
  const m = q.length
  if (m > n) return null

  // quick reject: subsequence check
  let k = 0
  for (let i = 0; i < n && k < m; i++) if (t[i] === q[k]) k++
  if (k < m) return null

  const wordStart = (j) => j === 0 || !isAlnum(text[j - 1]) ||
    (/[0-9]/.test(text[j]) && !/[0-9]/.test(text[j - 1]))

  // best[i][j]: best score with query[i] matched at text[j]
  const NEG = -Infinity
  const best = Array.from({ length: m }, () => new Array(n).fill(NEG))
  const prev = Array.from({ length: m }, () => new Array(n).fill(-1))

  for (let j = 0; j < n; j++) {
    if (t[j] !== q[0]) continue
    best[0][j] = 1 + (wordStart(j) ? 8 : 0) - Math.min(j, 10) * 0.3 + (j === 0 ? 4 : 0)
  }
  for (let i = 1; i < m; i++) {
    for (let j = i; j < n; j++) {
      if (t[j] !== q[i]) continue
      const bonus = 1 + (wordStart(j) ? 8 : 0)
      let bestVal = NEG
      let bestK = -1
      for (let p = i - 1; p < j; p++) {
        if (best[i - 1][p] === NEG) continue
        const gap = j - p - 1
        const v = best[i - 1][p] + bonus + (gap === 0 ? 6 : -Math.min(gap, 12) * 0.25)
        if (v > bestVal) { bestVal = v; bestK = p }
      }
      best[i][j] = bestVal
      prev[i][j] = bestK
    }
  }

  let endJ = -1
  let score = NEG
  for (let j = 0; j < n; j++) {
    if (best[m - 1][j] > score) { score = best[m - 1][j]; endJ = j }
  }
  if (endJ < 0) return null

  const positions = new Array(m)
  for (let i = m - 1, j = endJ; i >= 0; i--) {
    positions[i] = j
    j = prev[i][j]
  }
  // shorter names win ties ("Helldivers 2" over "Helldivers 2: Something")
  return { score: score - n * 0.01, positions }
}

/* split a name into [{ text, hit }] runs for highlighting matched letters */
export function highlight(text, positions) {
  if (!positions || !positions.length) return [{ text, hit: false }]
  const set = new Set(positions)
  const out = []
  for (let i = 0; i < text.length; i++) {
    const hit = set.has(i)
    const last = out[out.length - 1]
    if (last && last.hit === hit) last.text += text[i]
    else out.push({ text: text[i], hit })
  }
  return out
}
