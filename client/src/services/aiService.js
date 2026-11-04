/*
 * Visit Buddy AI client.
 *
 * The browser never holds a key and never talks to a model directly. Every
 * call goes to the server, which owns the key and the prompts.
 *
 * The exported shapes are unchanged from Phase 3, so the pages do not care
 * whether an answer came from a mock or a live model:
 *   buildQuestions  -> [{ text, quote }]
 *   transcribe      -> "text"
 *   summarizeVisit  -> { status, summary, todos, meds, flags }
 *   askAboutVisit   -> { found, answer, quote }
 *
 * Every function accepts an AbortSignal, so Cancel really stops the request.
 */

export class AIError extends Error {
  constructor(kind, message) {
    super(message || kind)
    this.name = 'AIError'
    this.kind = kind
  }
}

const BASE = '/api/ai'

async function readError(response) {
  try {
    const data = await response.json()
    if (data?.kind) return new AIError(data.kind, data.error)
    return new AIError('unavailable', data?.error)
  } catch {
    return new AIError('unavailable', 'The server could not be reached.')
  }
}

async function postJson(path, body, signal) {
  let response
  try {
    response = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    // Abort is a normal outcome (the user pressed Cancel); let it through.
    if (error?.name === 'AbortError') throw error
    throw new AIError('unavailable', 'Could not reach the server. Is it running?')
  }

  if (!response.ok) throw await readError(response)
  return response.json()
}

// AI-1: what worries you -> questions to ask the doctor
export async function buildQuestions(concerns, { signal } = {}) {
  const data = await postJson('/questions', { concerns }, signal)
  return Array.isArray(data?.questions) ? data.questions : []
}

// AI-2: a recording -> what was said.
// The blob is uploaded as-is; the server forwards it to the model.
export async function transcribe(audio, { signal } = {}) {
  if (!audio || typeof audio === 'string') {
    throw new AIError('invalid', 'There is no recording to turn into words.')
  }

  let response
  try {
    response = await fetch(`${BASE}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': audio.type || 'audio/webm' },
      body: audio,
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new AIError('unavailable', 'Could not reach the server. Is it running?')
  }

  if (!response.ok) throw await readError(response)

  const data = await response.json()
  return typeof data?.text === 'string' ? data.text : ''
}

// AI-3: what the doctor said -> summary, to-dos, medicines, things to check
export async function summarizeVisit(transcript, { signal } = {}) {
  const data = await postJson('/summarize', { transcript }, signal)

  return {
    status: data?.status === 'empty' ? 'empty' : 'success',
    summary: Array.isArray(data?.summary) ? data.summary : [],
    todos: Array.isArray(data?.todos) ? data.todos : [],
    meds: Array.isArray(data?.meds) ? data.meds : [],
    flags: Array.isArray(data?.flags) ? data.flags : [],
  }
}

// AI-4: ask about one visit
export async function askAboutVisit(transcript, question, { signal } = {}) {
  const data = await postJson('/ask', { transcript, question }, signal)

  return {
    found: Boolean(data?.found),
    answer: typeof data?.answer === 'string' ? data.answer : '',
    quote: typeof data?.quote === 'string' && data.quote ? data.quote : null,
  }
}
