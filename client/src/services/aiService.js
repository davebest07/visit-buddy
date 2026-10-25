import { SETTINGS_STORAGE_KEY } from '../context/SettingsContext.jsx'

/*
 * Visit Buddy mock AI service.
 *
 * This is the ONLY file allowed to produce AI results. Components call these
 * five functions and never import sample data themselves.
 *
 * Phase 3: everything below is fake but behaves like the real thing, including
 * the delay, the failure modes and the AbortSignal. Phase 4 replaces the insides
 * of each function with a fetch to the server; the exported shapes stay the same.
 */

// ASSUMED, replace with measured values in Phase 4.
const DELAYS = {
  success: 2500,
  slow: 14000,
  uncertain: 2500,
  empty: 2500,
  timeout: 10000,
  ratelimit: 600,
  error: 600,
  transcribe: 1800,
  ask: 1800,
}

const MODES = ['success', 'slow', 'uncertain', 'empty', 'error', 'timeout', 'ratelimit']

export const SAMPLE_CONCERNS =
  "My knee has been hurting for two weeks, I get dizzy when I stand up, and I'm not sure my morning pill is working."

export const SAMPLE_TRANSCRIPT =
  "The doctor said my knee pain is probably from wear and to try gentle stretching twice a day. She started me on Bellaprin, one tablet every morning with food. I should keep taking my navy pill, Norvelan, the same as before. She wants blood work done before the next visit in six weeks, and to call if the dizziness gets worse. I think she said ten milligrams for the Bellaprin but I didn't catch it clearly."

export const SAMPLE_QUESTIONS = [
  'What should I know about my knee pain?',
  'Is dizziness when standing something to worry about?',
  'Is my morning pill still right for me?',
]

export class AIError extends Error {
  constructor(kind) {
    super(kind)
    this.name = 'AIError'
    this.kind = kind
  }
}

function currentMode() {
  // The URL wins over the saved setting so a demo link can force a state.
  const fromUrl = new URLSearchParams(window.location.search).get('ai')
  if (MODES.includes(fromUrl)) return fromUrl

  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
    if (MODES.includes(saved.aiMode)) return saved.aiMode
  } catch {
    // Ignore broken storage and fall through to the default.
  }

  return 'success'
}

function abortError() {
  return new DOMException('The request was cancelled.', 'AbortError')
}

// A delay that stops the moment the user cancels.
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    function onAbort() {
      clearTimeout(timer)
      reject(abortError())
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

// Regenerate returns a different phrasing on every second call.
const callCounts = new Map()
function nextVariant(key) {
  const count = callCounts.get(key) ?? 0
  callCounts.set(key, count + 1)
  return count % 2
}

function failIfBroken(mode) {
  if (mode === 'error') throw new AIError('unavailable')
  if (mode === 'timeout') throw new AIError('timeout')
  if (mode === 'ratelimit') throw new AIError('ratelimit')
}

// ---------------------------------------------------------------------------
// AI-1: concerns -> questions
// ---------------------------------------------------------------------------

const SAMPLE_QUESTION_SETS = [
  [
    {
      text: 'How long can knee pain like mine last, and what could be causing it?',
      quote: 'My knee has been hurting for two weeks',
    },
    { text: 'Why do I feel dizzy when I stand up?', quote: 'I get dizzy when I stand up' },
    {
      text: 'Is my morning pill still the right one for me?',
      quote: "I'm not sure my morning pill is working",
    },
    {
      text: 'What signs should make me call you before my next visit?',
      quote: null,
    },
  ],
  [
    {
      text: 'What could be causing the knee pain I have had for two weeks?',
      quote: 'My knee has been hurting for two weeks',
    },
    {
      text: 'Is my morning pill still the right one for me?',
      quote: "I'm not sure my morning pill is working",
    },
    { text: 'What makes me dizzy when I stand up?', quote: 'I get dizzy when I stand up' },
    {
      text: 'When should I call you instead of waiting for my next visit?',
      quote: null,
    },
  ],
]

// If someone types something other than the sample, build questions from their
// own sentences so the quotes still match what they wrote.
function questionsFromText(text) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 4)

  return sentences.map((sentence) => ({
    text: `What can you tell me about: ${sentence.replace(/[.!?]+$/, '')}?`,
    quote: sentence,
  }))
}

export async function buildQuestions(text, { signal } = {}) {
  const mode = currentMode()
  await wait(DELAYS[mode] ?? DELAYS.success, signal)
  failIfBroken(mode)

  if (mode === 'empty') return []

  const variant = nextVariant('questions')
  const looksLikeSample = /knee/i.test(text) && /dizzy/i.test(text)

  if (!looksLikeSample) {
    const generated = questionsFromText(text)
    if (generated.length === 0) return []
    return generated
  }

  return SAMPLE_QUESTION_SETS[variant].map((question) => ({ ...question }))
}

// ---------------------------------------------------------------------------
// AI-2: speech -> text
// ---------------------------------------------------------------------------

export async function transcribe(audioBlobOrText, { signal } = {}) {
  const mode = currentMode()

  if (typeof audioBlobOrText === 'string') {
    return audioBlobOrText.trim()
  }

  await wait(DELAYS.transcribe, signal)
  failIfBroken(mode)

  if (mode === 'empty') return ''
  return SAMPLE_TRANSCRIPT
}

// ---------------------------------------------------------------------------
// AI-3: transcript -> summary, to-dos and medicines
// ---------------------------------------------------------------------------

const SAMPLE_VISIT = {
  status: 'success',
  summary: [
    {
      text: 'Your knee pain is probably from wear.',
      quote: 'my knee pain is probably from wear',
    },
    {
      text: 'Gentle stretching twice a day may help.',
      quote: 'try gentle stretching twice a day',
    },
    {
      text: 'You need blood work before your next visit in six weeks.',
      quote: 'blood work done before the next visit in six weeks',
    },
  ],
  todos: [
    {
      text: 'Do gentle knee stretches twice a day',
      done: false,
      quote: 'try gentle stretching twice a day',
    },
    {
      text: 'Get blood work before the next visit in six weeks',
      done: false,
      quote: 'blood work done before the next visit in six weeks',
    },
    {
      text: 'Call the clinic if the dizziness gets worse',
      done: false,
      quote: 'call if the dizziness gets worse',
    },
  ],
  meds: [
    {
      name: 'Bellaprin',
      dose: '10 mg',
      time: 'morning, with food',
      quote: 'Bellaprin, one tablet every morning with food',
      needsCheck: true,
    },
    {
      name: 'Norvelan',
      dose: null,
      time: 'navy',
      note: 'same as before',
      quote: 'keep taking my navy pill, Norvelan, the same as before',
      needsCheck: false,
    },
  ],
  flags: [
    {
      line: 'Bellaprin dose',
      reason: 'The dose was not clear in what you said. Ask your doctor or pharmacist.',
      quote: 'ten milligrams for the Bellaprin',
    },
  ],
}

const SAMPLE_VISIT_VARIANT = {
  ...SAMPLE_VISIT,
  summary: [
    {
      text: 'Your knee pain is probably caused by wear.',
      quote: 'my knee pain is probably from wear',
    },
    {
      text: 'You should try gentle stretching twice a day.',
      quote: 'try gentle stretching twice a day',
    },
    {
      text: 'Blood work is needed before the next visit, in six weeks.',
      quote: 'blood work done before the next visit in six weeks',
    },
  ],
}

export async function summarizeVisit(transcript, { signal } = {}) {
  const mode = currentMode()
  await wait(DELAYS[mode] ?? DELAYS.success, signal)
  failIfBroken(mode)

  if (mode === 'empty') {
    return { status: 'empty', summary: [], todos: [], meds: [], flags: [] }
  }

  const variant = nextVariant('summarize')
  const base = variant === 0 ? SAMPLE_VISIT : SAMPLE_VISIT_VARIANT

  const result = {
    status: 'success',
    summary: base.summary.map((line) => ({ ...line })),
    todos: SAMPLE_VISIT.todos.map((todo) => ({ ...todo })),
    meds: SAMPLE_VISIT.meds.map((med) => ({ ...med })),
    flags: SAMPLE_VISIT.flags.map((flag) => ({ ...flag })),
  }

  if (mode === 'uncertain') {
    result.meds[0] = {
      ...result.meds[0],
      dose: null,
      needsCheck: true,
      flagged: true,
      note: 'The dose was not clear',
    }
    result.flags = [
      {
        line: 'Bellaprin dose',
        reason: 'I could not hear the dose clearly. Ask your doctor or pharmacist.',
        quote: "I think she said ten milligrams for the Bellaprin but I didn't catch it clearly.",
      },
      {
        line: 'Knee stretching',
        reason: 'I could not tell how long to stretch for. Ask your doctor or pharmacist.',
        quote: 'try gentle stretching twice a day',
      },
    ]
    result.summary[1] = { ...result.summary[1], flagged: true }
  }

  return result
}

// ---------------------------------------------------------------------------
// AI-4: uncertain lines
// ---------------------------------------------------------------------------

export async function flagUncertain(transcript, { signal } = {}) {
  const mode = currentMode()
  await wait(Math.min(DELAYS[mode] ?? DELAYS.success, 1200), signal)
  failIfBroken(mode)

  if (mode === 'empty') return []

  return SAMPLE_VISIT.flags.map((flag) => ({ ...flag }))
}

// ---------------------------------------------------------------------------
// AI-5: ask about one visit
// ---------------------------------------------------------------------------

const ANSWERS = [
  {
    match: ['medicine', 'medication', 'pill', 'dose', 'bellaprin', 'norvelan'],
    answer:
      'You were started on Bellaprin, one tablet every morning with food. Keep taking Norvelan at navy, the same as before. The dose of Bellaprin was not clear, so ask your doctor or pharmacist.',
    quote: 'She started me on Bellaprin, one tablet every morning with food.',
  },
  {
    match: ['knee', 'pain', 'stretch'],
    answer: 'Your knee pain is probably from wear. Try gentle stretching twice a day.',
    quote: 'my knee pain is probably from wear',
  },
  {
    match: ['blood', 'test', 'lab', 'work'],
    answer: 'You need blood work done before your next visit, in six weeks.',
    quote: 'blood work done before the next visit in six weeks',
  },
  {
    match: ['dizzy', 'dizziness', 'faint'],
    answer: 'Call the clinic if the dizziness gets worse.',
    quote: 'call if the dizziness gets worse',
  },
  {
    match: ['next', 'follow', 'again', 'weeks'],
    answer: 'Your next visit is in six weeks.',
    quote: 'before the next visit in six weeks',
  },
]

const NOT_FOUND = {
  found: false,
  answer:
    'I could not find that in this visit. Ask your doctor or pharmacist if you are not sure.',
  quote: null,
}

export async function askAboutVisit(transcript, question, { signal } = {}) {
  const mode = currentMode()
  await wait(DELAYS.ask, signal)
  failIfBroken(mode)

  if (mode === 'empty') {
    return { found: false, answer: '', quote: null }
  }

  const asked = String(question || '').toLowerCase()
  const match = ANSWERS.find((entry) => entry.match.some((word) => asked.includes(word)))

  if (!match) return { ...NOT_FOUND }

  const variant = nextVariant('ask')
  return {
    found: true,
    answer:
      variant === 0
        ? match.answer
        : match.answer.replace('You ', 'The doctor said you ').replace('Your ', 'The doctor said your '),
    quote: match.quote,
  }
}
