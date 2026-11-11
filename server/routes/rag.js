import { Router } from 'express'
import { createBm25Scorer, loadKnowledge, searchKnowledge } from '../rag/search.js'

// POST /api/rag/search
//
// Body:     { query: string, limit?: 1-50, use?: "interview" | "ask-doctor",
//             topics?: string[] }
// Response: { method, fallback, expandedWith, matchedTopics: [{ topic, score }],
//             results: [{ id, topic, category, use, question, keywords, replies?,
//                         source: { name, url }, score }] }
//
// The knowledge base holds questions only: no diagnoses, causes, treatments or
// drug information.

const chunks = loadKnowledge()
const scorer = createBm25Scorer(chunks)
const TOPIC_NAMES = [...new Set(chunks.map((chunk) => chunk.topic))]

const MAX_QUERY = 2000
const USES = ['interview', 'ask-doctor']

// Basic input validation with a message a person can act on.
function validateSearch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Send a search object.'
  }
  if (typeof body.query !== 'string' || !body.query.trim()) {
    return 'query must be some text.'
  }
  if (body.query.length > MAX_QUERY) {
    return `query must be ${MAX_QUERY} characters or fewer.`
  }
  if (
    body.limit !== undefined &&
    (!Number.isInteger(body.limit) || body.limit < 1 || body.limit > 50)
  ) {
    return 'limit must be a whole number from 1 to 50.'
  }
  if (body.use !== undefined && !USES.includes(body.use)) {
    return 'use must be "interview" or "ask-doctor".'
  }
  if (body.topics !== undefined) {
    if (!Array.isArray(body.topics) || !body.topics.every((t) => typeof t === 'string')) {
      return 'topics must be a list of topic names.'
    }
    const unknown = body.topics.find((topic) => !TOPIC_NAMES.includes(topic))
    if (unknown) return `"${unknown}" is not a known topic.`
  }
  return null
}

const router = Router()

router.post('/search', (req, res) => {
  const problem = validateSearch(req.body)
  if (problem) {
    res.status(400).json({ error: problem })
    return
  }

  const { query, limit = 12, use = null, topics = null } = req.body
  res.json(searchKnowledge(chunks, scorer, { query: query.trim(), limit, use, topics }))
})

router.get('/topics', (req, res) => {
  res.json({ topics: TOPIC_NAMES, chunks: chunks.length })
})

export default router
