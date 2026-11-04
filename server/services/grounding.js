// ---------------------------------------------------------------------------
// Text helpers shared by the AI tasks, kept separate so they can be tested
// without a network call or an API key.
//
// The important one is groundQuote. The model is asked to copy the words it
// used, but model output is never trusted: a paraphrased quote would silently
// misrepresent what a clinician said, which is the one failure this app must
// not have.
// ---------------------------------------------------------------------------

// Straighten quotes, collapse whitespace, drop case. Lets a model that adds a
// capital letter or a newline still match the words the person actually wrote.
export function normalise(value) {
  return String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Return the quote only if it really appears in the source text.
 *
 * Matching is layered and deliberately conservative:
 *   1. exact match after normalising case/whitespace/quotes
 *   2. the same, with trailing punctuation removed
 * Anything else — a paraphrase, a stitched-together sentence, an invention —
 * returns null, and the caller marks the line for checking instead.
 *
 * There is no fuzzy scoring on purpose: a near-match is exactly the case where
 * attaching a quote would do harm.
 */
export function groundQuote(quote, source) {
  const raw = String(quote ?? '').trim()
  if (!raw) return null

  const haystack = normalise(source)
  if (!haystack) return null

  const needle = normalise(raw)
  if (!needle) return null

  if (haystack.includes(needle)) return raw

  const withoutEndPunctuation = needle.replace(/[.,;:!?]+$/, '')
  if (withoutEndPunctuation && haystack.includes(withoutEndPunctuation)) return raw

  return null
}

// One trimmed, single-spaced line, capped for storage and display.
export function cleanText(value, max = 600) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

// Models sometimes return a string or an object where a list belongs.
export function takeList(value, max) {
  return Array.isArray(value) ? value.slice(0, max) : []
}
