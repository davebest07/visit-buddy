import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SYNONYMS } from './synonyms.js'

/*
 * Retrieval over the question knowledge base in server/knowledge/.
 *
 * Today the scoring is BM25 keyword search with a synonym list, so it needs no
 * API key. The scorer is one object with a single method:
 *
 *   scorer.score(query) -> [{ id, score }]   (any order, any positive scores)
 *
 * To switch to embeddings later, write a scorer that embeds the query and
 * returns cosine similarities with the same shape, and pass it to
 * `searchKnowledge`. The HTTP response does not change.
 */

const here = path.dirname(fileURLToPath(import.meta.url))
export const KNOWLEDGE_DIR = path.join(here, '..', 'knowledge')

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export function loadKnowledge(dir = KNOWLEDGE_DIR) {
  const chunks = []
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.json')).sort()) {
    const parsed = JSON.parse(readFileSync(path.join(dir, file), 'utf8'))
    for (const chunk of parsed.chunks ?? []) chunks.push(chunk)
  }
  return chunks
}

// ---------------------------------------------------------------------------
// Text processing
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(
  `a an and are as at be been being but by can could did do does doing for from had has have
  having he her hers him his how i i'm im if in into is it it's its just me my myself no nor not
  of off on once only or other our ours out over own same she should so some such than that the
  their them then there these they this those through to too under until up very was we were
  what when where which while who whom why will with would you your yours also about again
  really lot lots bit thing things get got getting since ago been feel feeling felt think
  sure like keep keeps kind`.split(/\s+/),
)

// A deliberately small stemmer: enough to match "hurting" with "hurt" and
// "headaches" with "headache" without pulling in a library.
export function stem(word) {
  if (word.length <= 4) return word
  if (word.endsWith('ies') && word.length > 5) return `${word.slice(0, -3)}y`
  if (word.endsWith('ing') && word.length > 6) return word.slice(0, -3)
  if (word.endsWith('ed') && word.length > 5) return word.slice(0, -2)
  if (word.endsWith('es') && /(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[’']/g, "'")
    .split(/[^a-z0-9']+/)
    .map((word) => word.replace(/^'+|'+$/g, ''))
    .filter((word) => word && !STOPWORDS.has(word))
    .map(stem)
}

const SYNONYM_PHRASES = Object.keys(SYNONYMS).sort((a, b) => b.length - a.length)

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const SYNONYM_PATTERNS = SYNONYM_PHRASES.map((phrase) => ({
  phrase,
  pattern: new RegExp(`(^|[^a-z])${escapeRegExp(phrase)}(?=$|[^a-z])`, 'i'),
}))

// The query plus the knowledge-base words its everyday phrases stand for.
// A multi-word phrase is replaced by its meaning, so "light headed" does not
// leave a stray "head" behind to match headaches. Single words are kept and
// the meaning is added.
export function expandQuery(query) {
  let text = ` ${String(query).toLowerCase().replace(/[’]/g, "'")} `
  const added = []
  for (const { phrase, pattern } of SYNONYM_PATTERNS) {
    if (!pattern.test(text)) continue
    added.push(SYNONYMS[phrase])
    if (/[\s-]/.test(phrase)) {
      text = text.replace(new RegExp(pattern.source, 'gi'), '$1 ')
    }
  }
  return { tokens: tokenize(`${text} ${added.join(' ')}`), expandedWith: added }
}

// ---------------------------------------------------------------------------
// BM25 scorer
// ---------------------------------------------------------------------------

// Topic keywords say what a chunk is about, so they count more than the
// wording of the question itself.
function chunkTokens(chunk) {
  const keywords = tokenize([chunk.topic, ...(chunk.keywords ?? [])].join(' '))
  return [...keywords, ...keywords, ...tokenize(chunk.question), ...tokenize(chunk.category)]
}

export function createBm25Scorer(chunks, { k1 = 1.2, b = 0.75 } = {}) {
  const docs = chunks.map((chunk) => {
    const terms = new Map()
    const tokens = chunkTokens(chunk)
    for (const token of tokens) terms.set(token, (terms.get(token) ?? 0) + 1)
    return { id: chunk.id, terms, length: tokens.length }
  })

  const averageLength = docs.reduce((sum, doc) => sum + doc.length, 0) / Math.max(docs.length, 1)

  const documentFrequency = new Map()
  for (const doc of docs) {
    for (const term of doc.terms.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
    }
  }

  function idf(term) {
    const n = documentFrequency.get(term) ?? 0
    return Math.log(1 + (docs.length - n + 0.5) / (n + 0.5))
  }

  return {
    method: 'bm25',
    score(query) {
      const queryTerms = [...new Set(expandQuery(query).tokens)]
      const results = []
      for (const doc of docs) {
        let score = 0
        for (const term of queryTerms) {
          const frequency = doc.terms.get(term)
          if (!frequency) continue
          const norm = frequency + k1 * (1 - b + (b * doc.length) / averageLength)
          score += idf(term) * ((frequency * (k1 + 1)) / norm)
        }
        if (score > 0) results.push({ id: doc.id, score })
      }
      return results
    },
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

// Used when nothing in the query matches a specific topic.
export const FALLBACK_TOPICS = ['general symptom history', 'preparing for any visit']

const round = (value) => Math.round(value * 1000) / 1000

// The single-word keywords every chunk of a topic shares: what the topic is
// about. Phrases like "light-headed" or "head pain" are left out here, because
// split into words they would match the wrong topic ("head" -> headache).
function topicKeywordSets(chunks) {
  const sets = new Map()
  for (const chunk of chunks) {
    const singleWords = (chunk.keywords ?? []).filter((keyword) => /^[a-z]+$/i.test(keyword))
    const tokens = new Set(tokenize(singleWords.join(' ')))
    const current = sets.get(chunk.topic)
    sets.set(
      chunk.topic,
      current ? new Set([...current].filter((token) => tokens.has(token))) : tokens,
    )
  }
  return sets
}

const keywordCache = new WeakMap()

// Best first, but take turns between topics so a query about two things
// ("my knee hurts and I get dizzy") returns questions about both.
function interleaveByTopic(ranked, topicOrder) {
  const queues = new Map(topicOrder.map((topic) => [topic, []]))
  for (const entry of ranked) queues.get(entry.chunk.topic)?.push(entry)
  const mixed = []
  let added = true
  while (added) {
    added = false
    for (const queue of queues.values()) {
      const next = queue.shift()
      if (next) {
        mixed.push(next)
        added = true
      }
    }
  }
  return mixed
}

/*
 * Returns the best chunks for a query.
 *
 * - `use` limits results to "interview" prompts or "ask-doctor" questions.
 * - A topic only counts as matched when the query (after synonyms) contains
 *   one of that topic's own keywords. A stray shared word like "week" or
 *   "morning" does not pull in a topic.
 * - Results take turns between matched topics, strongest topic first.
 * - If no topic matches, the general fallback set is returned instead.
 */
export function searchKnowledge(
  chunks,
  scorer,
  { query, limit = 12, use = null, topics = null } = {},
) {
  if (!keywordCache.has(chunks)) keywordCache.set(chunks, topicKeywordSets(chunks))
  const topicKeywords = keywordCache.get(chunks)

  const byId = new Map(chunks.map((chunk) => [chunk.id, chunk]))
  const allowed = (chunk) =>
    (!use || chunk.use === use) && (!topics || topics.includes(chunk.topic))

  const expanded = expandQuery(query)
  const queryTokens = new Set(expanded.tokens)

  const scored = scorer
    .score(query)
    .map(({ id, score }) => ({ chunk: byId.get(id), score }))
    .filter(({ chunk }) => chunk && allowed(chunk))

  // Best score per topic orders the topics the query is about.
  const topicScores = new Map()
  for (const { chunk, score } of scored) {
    topicScores.set(chunk.topic, Math.max(topicScores.get(chunk.topic) ?? 0, score))
  }
  const matchedTopics = [...topicScores.entries()]
    .filter(([topic]) => !FALLBACK_TOPICS.includes(topic))
    .filter(([topic]) => [...(topicKeywords.get(topic) ?? [])].some((t) => queryTokens.has(t)))
    .sort((a, b) => b[1] - a[1])
    .map(([topic, score]) => ({ topic, score: round(score) }))

  const matchedNames = matchedTopics.map((entry) => entry.topic)
  let fallback = false
  let ranked

  if (matchedNames.length > 0) {
    ranked = interleaveByTopic(
      scored
        .filter(({ chunk }) => matchedNames.includes(chunk.topic))
        .sort((a, b) => b.score - a.score),
      matchedNames,
    )
  } else {
    fallback = true
    const scoreFor = new Map(scored.map(({ chunk, score }) => [chunk.id, score]))
    ranked = chunks
      .filter((chunk) => FALLBACK_TOPICS.includes(chunk.topic) && allowed(chunk))
      .map((chunk) => ({ chunk, score: scoreFor.get(chunk.id) ?? 0 }))
      .sort((a, b) => b.score - a.score)
  }

  return {
    method: scorer.method,
    fallback,
    expandedWith: expanded.expandedWith,
    matchedTopics,
    results: ranked.slice(0, limit).map(({ chunk, score }) => ({ ...chunk, score: round(score) })),
  }
}
