// The only place the app talks to the server.
const BASE = '/api'

async function request(path, { method = 'GET', body, signal } = {}) {
  const init = { method, signal }

  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }

  const response = await fetch(BASE + path, init)

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.'
    try {
      const data = await response.json()
      if (data?.error) message = data.error
    } catch {
      // Keep the plain message.
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export const listVisits = () => request('/visits')

export const getVisit = (id) => request(`/visits/${id}`)

export const createVisit = (visit) => request('/visits', { method: 'POST', body: visit })

export const updateVisit = (id, patch) =>
  request(`/visits/${id}`, { method: 'PATCH', body: patch })

export const deleteVisit = (id) => request(`/visits/${id}`, { method: 'DELETE' })

export const deleteAllVisits = () => request('/visits', { method: 'DELETE' })

// Finds questions in the knowledge base that fit what the person said.
// options: { limit, use: 'interview' | 'ask-doctor', topics: [...], signal }
export const searchKnowledge = (query, { signal, ...options } = {}) =>
  request('/rag/search', { method: 'POST', body: { query, ...options }, signal })

const GENERAL_TOPICS = ['general symptom history', 'preparing for any visit']

/*
 * Everything the Before a visit interview needs, in one call:
 * interview prompts and ask-the-doctor questions for their worries, plus the
 * general questions every visit can use (goals, when to call back).
 *
 * Returns a list of chunks, best first. If the search is down it returns an
 * empty list, and the page carries on without the knowledge base.
 */
export async function findQuestionChunks(query, { signal } = {}) {
  const text = query.slice(0, 2000)
  try {
    const [interview, askDoctor, general] = await Promise.all([
      searchKnowledge(text, { use: 'interview', limit: 40, signal }),
      searchKnowledge(text, { use: 'ask-doctor', limit: 10, signal }),
      searchKnowledge(text, { topics: GENERAL_TOPICS, limit: 50, signal }),
    ])
    const seen = new Set()
    return [...interview.results, ...askDoctor.results, ...general.results].filter((chunk) => {
      if (seen.has(chunk.id)) return false
      seen.add(chunk.id)
      return true
    })
  } catch (caught) {
    if (caught.name === 'AbortError') throw caught
    return []
  }
}
