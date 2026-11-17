/* Spoiler version of a review, split into parts so the bits that aren't in
   the spoiler-free version can be marked. Word-level diff (longest common
   subsequence), so added and edited words both come out as `added`.

   spoilerParts(plain, full) -> [{ text, added }] that joins back to `full`. */
export function spoilerParts(plain, full) {
  if (!full) return []
  if (!plain) return [{ text: full, added: true }]

  const tokenize = (s) => s.match(/\s+|\S+/g) || []
  const isSpace = (t) => /^\s/.test(t)
  const a = tokenize(plain)
  const b = tokenize(full)

  // lcs[i][j] = length of the longest common subsequence of a[i..] and b[j..]
  const lcs = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const added = new Array(b.length).fill(true)
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (a[i] === b[j]) { added[j] = false; i++; j++ }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) i++
    else j++
  }

  // A gap of one or two common words ("and", "the was") inside a changed
  // passage is a coincidence of the diff: fold it into the passage so the
  // mark reads as one run. Line breaks always stay plain.
  const words = []
  for (let j = 0; j < b.length; j++) if (!isSpace(b[j])) words.push(j)
  for (let w = 0; w < words.length;) {
    if (added[words[w]]) { w++; continue }
    let end = w
    while (end < words.length && !added[words[end]]) end++
    const gap = end - w
    const between = w > 0 && end < words.length
    const crossesLine = b.slice(words[Math.max(w - 1, 0)], words[Math.min(end, words.length - 1)]).some((t) => t.includes('\n'))
    if (between && gap <= 2 && !crossesLine) for (let k = w; k < end; k++) added[words[k]] = true
    w = end
  }

  // whitespace on its own isn't a change: it belongs to the words around it.
  // A space between two added words joins them into one run; anything else
  // (including line breaks) stays plain.
  for (let j = 0; j < b.length; j++) {
    if (!isSpace(b[j])) continue
    added[j] = !b[j].includes('\n') && j > 0 && j < b.length - 1 && added[j - 1] && added[j + 1]
  }

  const parts = []
  for (let j = 0; j < b.length; j++) {
    const last = parts[parts.length - 1]
    if (last && last.added === added[j]) last.text += b[j]
    else parts.push({ text: b[j], added: added[j] })
  }
  return parts
}
