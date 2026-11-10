import { SETTINGS_STORAGE_KEY } from '../context/SettingsContext.jsx'

/*
 * Visit Buddy mock AI service.
 *
 * This is the ONLY file allowed to produce AI results. Components call these
 * functions and never import sample data themselves.
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
  // The interview questions come back faster than a full list.
  interview: 1200,
}

const MODES = ['success', 'slow', 'uncertain', 'empty', 'error', 'timeout', 'ratelimit']

export const SAMPLE_CONCERNS =
  "My knee has been hurting for two weeks, I get dizzy when I stand up, and I'm not sure my morning pill is working."

export const SAMPLE_TRANSCRIPT =
  "The doctor said my knee pain is probably from wear and to try gentle stretching twice a day. She started me on Bellaprin, one tablet every morning with food. I should keep taking my night pill, Norvelan, the same as before. She wants blood work done before the next visit in six weeks, and to call if the dizziness gets worse. I think she said ten milligrams for the Bellaprin but I didn't catch it clearly."

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
// AI-1: concerns -> a short interview -> questions to ask
// ---------------------------------------------------------------------------
//
// Both functions below are grounded in "chunks": questions retrieved from the
// knowledge base in server/knowledge/ by POST /api/rag/search. The mock really
// uses them: it picks chunks, puts them in order and lightly rewords them with
// the person's own words. It never writes a question that is not in a chunk.
//
// When a real model replaces the mock, the chunks go into the prompt as
// numbered grounding passages, for example:
//
//   [1] id: dizziness-02 | category: character | source: Standard clinical ...
//       "What does it feel like: the room spinning, feeling lightheaded, ...?"
//
// The model is told to choose and reword only from those passages, to return
// the chunk id with every question, and never to add a cause, a diagnosis, a
// treatment, or a word about whether something is safe. The server then drops
// any item whose id is not one of the passages it sent, and runs the red-flag
// check on the output before it reaches the page.

// The order a doctor usually asks things in. One question per slot, at most 5.
const INTERVIEW_SLOTS = [
  ['onset', 'duration'],
  ['character', 'location'],
  ['triggers/relief', 'timing'],
  ['impact on daily life', 'severity'],
  ['medicines'],
  ['goals for the visit'],
]
const FILLER_CATEGORIES = ['related symptoms', 'severity', 'history', 'timing']
const MAX_INTERVIEW = 5
const MIN_INTERVIEW = 3

const GENERAL_TOPICS = ['general symptom history', 'preparing for any visit']
const MEDICINE_TOPIC = 'medication review'

const TOPIC_ABOUT = {
  'chest discomfort': 'your chest discomfort',
  dizziness: 'the dizziness',
  'joint pain': 'your joint pain',
  'back pain': 'your back',
  headache: 'your headaches',
  cough: 'your cough',
  'stomach pain': 'your stomach',
  'skin and rash': 'your skin',
  tiredness: 'feeling tired',
  sleep: 'your sleep',
  'mood and stress': 'how you have been feeling',
  'medication review': 'your medicines',
}

const BODY_PARTS = ['knee', 'hip', 'shoulder', 'elbow', 'wrist', 'ankle', 'finger', 'hand', 'foot', 'neck']

// Why the interview asks each kind of question. Gathering facts only.
const CATEGORY_WHY = {
  onset: 'Doctors usually ask when something started.',
  duration: 'Doctors usually ask how long it lasts.',
  location: 'Doctors usually ask where you feel it.',
  character: 'Doctors usually ask what it feels like.',
  'triggers/relief': 'Doctors usually ask what makes it better or worse.',
  timing: 'Doctors usually ask when it happens.',
  severity: 'Doctors usually ask how bad it is.',
  'related symptoms': 'Doctors usually ask about anything else going on.',
  'impact on daily life': 'Doctors usually ask how it affects your day.',
  history: 'Doctors usually ask if this has happened before.',
  medicines: 'Doctors usually ask what you take or have tried.',
  'goals for the visit': 'It helps your doctor to know what you want from the visit.',
}

// Labels for "What to tell your doctor".
const CATEGORY_LABEL = {
  onset: 'When it started',
  duration: 'How long it lasts',
  location: 'Where I feel it',
  character: 'What it feels like',
  'triggers/relief': 'What makes it better or worse',
  timing: 'When it happens',
  severity: 'How bad it is',
  'related symptoms': 'Anything else going on',
  'impact on daily life': 'How it affects my day',
  history: 'Has it happened before',
  medicines: 'Medicines I take or have tried',
  'goals for the visit': 'What I want from this visit',
}

function sentencesOf(text) {
  return String(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

// Smaller pieces of what they said: "my knee hurts, and I get dizzy" gives
// two parts, so a quote points at the part a question is about.
function partsOf(text) {
  return sentencesOf(text)
    .flatMap((sentence) => sentence.split(/,\s*(?:and|but)?\s*|\s+(?:and|but)\s+(?=(?:I|I'm|I've|my|it)\b)/i))
    .map((part) => part.trim().replace(/^(and|but)\s+/i, ''))
    .filter((part) => part.split(/\s+/).length >= 3)
}

function hasWord(text, word) {
  return new RegExp(`\\b${word}s?\\b`, 'i').test(text)
}

function bodyPartIn(text) {
  return BODY_PARTS.find((part) => hasWord(text, part)) ?? null
}

// ---------------------------------------------------------------------------
// Their own words for the problem: "my chest is aching me" -> "the chest ache",
// "my elbow feels funny" -> "the funny feeling in your elbow". Used to make the
// general questions specific when no topic fits.
// ---------------------------------------------------------------------------

const BODY_WORDS = [
  'chest', 'heart', 'knee', 'hip', 'shoulder', 'elbow', 'wrist', 'ankle', 'finger', 'thumb',
  'hand', 'foot', 'feet', 'toe', 'neck', 'back', 'head', 'stomach', 'belly', 'tummy', 'ear',
  'eye', 'throat', 'nose', 'leg', 'arm', 'skin', 'jaw', 'mouth', 'tooth', 'teeth', 'side',
  'bladder', 'bowel', 'tongue', 'face', 'lip', 'heel', 'calf', 'thigh', 'groin',
]
const SYMPTOM_NOUNS = [
  [/^(ache|aches|aching|achy|achey)$/, 'ache'],
  [/^(pain|pains|painful|hurt|hurts|hurting|sore|soreness)$/, 'pain'],
  [/^(itch|itches|itching|itchy)$/, 'itch'],
  [/^(swell|swells|swelling|swollen)$/, 'swelling'],
  [/^(tight|tightness)$/, 'tightness'],
  [/^(numb|numbness)$/, 'numbness'],
  [/^(tingle|tingles|tingling|tingly)$/, 'tingling'],
  [/^(stiff|stiffness)$/, 'stiffness'],
  [/^(burn|burns|burning)$/, 'burning'],
  [/^(weak|weakness)$/, 'weakness'],
  [/^(clicks|clicking|cracking)$/, 'clicking'],
]
const ODD_FEELING = /^(funny|weird|strange|odd|off|wrong|different)$/

export function subjectOf(text) {
  const words = String(text).toLowerCase().replace(/[’]/g, "'").match(/[a-z']+/g) ?? []
  const singular = (word) => (word === 'feet' ? 'foot' : word === 'teeth' ? 'tooth' : word.replace(/s$/, ''))
  const isBody = (word) => BODY_WORDS.includes(word) || BODY_WORDS.includes(singular(word))
  // "my elbow" first, then any body word.
  let at = words.findIndex((word, i) => i > 0 && words[i - 1] === 'my' && isBody(word))
  if (at < 0) at = words.findIndex(isBody)
  if (at < 0) return null

  const body = BODY_WORDS.includes(words[at]) ? words[at] : singular(words[at])
  const nearby = words.slice(Math.max(0, at - 3), at + 5)
  const noun = nearby.map((word) => SYMPTOM_NOUNS.find(([pattern]) => pattern.test(word))?.[1]).find(Boolean)
  if (noun) return { you: `the ${body} ${noun}`, me: `the ${body} ${noun}`, part: `my ${body}`, body }
  const odd = nearby.find((word) => ODD_FEELING.test(word))
  if (odd) {
    return { you: `the ${odd} feeling in your ${body}`, me: `the ${odd} feeling in my ${body}`, part: `my ${body}`, body }
  }
  return { you: `the problem with your ${body}`, me: `the problem with my ${body}`, part: `my ${body}`, body }
}

// The general questions, made specific with their words ({s}).
const GENERAL_TEMPLATES = {
  'general-symptom-01': 'When did {s} first start?',
  'general-symptom-02': 'Did {s} start suddenly, or build up slowly?',
  'general-symptom-03': 'Where exactly do you feel {s}? Does it stay in one place or move around?',
  'general-symptom-04': 'How long does {s} last when it happens?',
  'general-symptom-05': 'How would you describe {s} in your own words?',
  'general-symptom-06': 'What makes {s} better or worse?',
  'general-symptom-07': 'Has anything made {s} better?',
  'general-symptom-08': 'Is {s} there all the time, or does it come and go?',
  'general-symptom-09': 'How bad is {s} at its worst, and how bad is it right now?',
  'general-symptom-10': 'Have you noticed anything else happening along with {s}?',
  'general-symptom-11': 'How is {s} affecting your day-to-day life?',
  'general-symptom-12': 'Has {s} happened before? What happened then?',
  'general-symptom-13': 'What have you tried for {s} so far, and did it help?',
  'general-symptom-14': 'What worries you most about {s}?',
}

function personalizeGeneral(chunk, subject) {
  if (!subject) return chunk.question
  const template = GENERAL_TEMPLATES[chunk.id]
  if (template) return template.replace('{s}', subject.you)
  return chunk.question.replace(/\bthis problem\b/g, subject.me)
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

// "your knee" instead of "your joint pain", when they said knee.
function aboutFor(topic, concerns) {
  if (topic === 'joint pain') {
    const part = bodyPartIn(concerns)
    if (part) return `your ${part}`
  }
  return TOPIC_ABOUT[topic] ?? null
}

// Light rewording: put their word in place of the knowledge base's general one.
function reword(question, topic, concerns) {
  if (topic !== 'joint pain') return question
  const part = bodyPartIn(concerns)
  if (!part) return question
  // "my elbow feels funny": do not call it pain.
  const subject = subjectOf(concerns)
  if (subject?.you.includes(' feeling in ')) {
    return question
      .replace(/\bthe (joint )?pain\b/gi, subject.you)
      .replace(/\b(my|the) joint\b/gi, `$1 ${part}`)
      .replace(/\bbefore the funny feeling[^?]*started\b/i, 'before this started')
  }
  return question
    .replace(/\bthe joint pain\b/gi, `the ${part} pain`)
    .replace(/\b(my|the) joint\b/gi, `$1 ${part}`)
    .replace(/\bWhich joints hurt\?/i, `Which joints hurt, apart from your ${part}?`)
    .replace(/\bmy joint pain\b/gi, `my ${part} pain`)
}

// The sentence of theirs that a chunk's topic came from, for the Quote button.
function quoteFor(chunk, concerns) {
  const sentences = partsOf(concerns)
  const words = (chunk.keywords ?? []).filter((keyword) => /^[a-z]+$/i.test(keyword))
  const synonyms = {
    'joint pain': BODY_PARTS,
    'medication review': ['pill', 'tablet', 'medicine', 'medication', 'meds', 'dose'],
    tiredness: ['tired', 'exhausted', 'energy'],
  }[chunk.topic] ?? []
  // Their everyday words for the topic first ("pill"), then the topic's keywords.
  const byWords = (list) => sentences.find((sentence) => list.some((word) => hasWord(sentence, word)))
  return byWords(synonyms) ?? byWords(words) ?? null
}

// Topics in the order retrieval ranked them (the chunks arrive best first).
function topicsInOrder(chunks) {
  const topics = []
  for (const chunk of chunks) {
    if (!GENERAL_TOPICS.includes(chunk.topic) && !topics.includes(chunk.topic)) {
      topics.push(chunk.topic)
    }
  }
  return topics
}

const SAYS_WHEN = /\b(since|yesterday|today|this morning|last night|(for|about|over|past|last|few|couple of|\d+|one|two|three|four|five|six|several) (days?|weeks?|months?|years?))\b/i

function toStep(chunk, concerns) {
  const general = chunk.topic === 'general symptom history'
  const subject = general ? subjectOf(concerns) : null
  const about = GENERAL_TOPICS.includes(chunk.topic)
    ? subject?.you ?? null
    : aboutFor(chunk.topic, concerns)
  const mentioned = about ? `You mentioned ${about}. ` : ''
  return {
    id: chunk.id,
    topic: chunk.topic,
    category: chunk.category,
    about,
    text: general ? personalizeGeneral(chunk, subject) : reword(chunk.question, chunk.topic, concerns),
    replies: [...(chunk.replies ?? [])],
    why: {
      reason: `${mentioned}${CATEGORY_WHY[chunk.category] ?? ''}`.trim(),
      source: chunk.source ?? null,
    },
  }
}

/*
 * interviewQuestions(concerns, retrievedChunks, answersSoFar, { signal })
 *   -> { steps: [{ id, topic, category, about, text, replies, why }] }
 *
 * Returns the questions still worth asking, in order: onset/duration,
 * character, triggers, impact, medicines, goals. Categories already answered
 * in answersSoFar, or already covered by their words ("for two weeks"), are
 * left out. The page calls it once, before the first question.
 *
 * `steps` is empty when nothing in the chunks fits; the page then goes
 * straight to the questions list.
 */
export async function interviewQuestions(concerns, retrievedChunks = [], answersSoFar = [], { signal } = {}) {
  const mode = currentMode()
  await wait(mode === 'success' || mode === 'uncertain' || mode === 'empty' ? DELAYS.interview : DELAYS[mode], signal)
  failIfBroken(mode)

  if (mode === 'empty') return { steps: [] }

  const pool = retrievedChunks.filter((chunk) => chunk.use === 'interview')
  const topics = topicsInOrder(pool)
  const symptomTopics = topics.filter((topic) => topic !== MEDICINE_TOPIC)

  const covered = new Set(answersSoFar.map((answer) => answer.category).filter(Boolean))
  if (SAYS_WHEN.test(concerns)) {
    covered.add('onset')
    covered.add('duration')
  }

  const used = new Set()
  const perTopic = new Map()
  const picked = []

  // The least-asked topic goes first, so two worries share the questions.
  function take(categories, topicChoices) {
    const ordered = [...topicChoices].sort(
      (a, b) => (perTopic.get(a) ?? 0) - (perTopic.get(b) ?? 0) || topics.indexOf(a) - topics.indexOf(b),
    )
    for (const topic of ordered) {
      for (const category of categories) {
        const chunk = pool.find(
          (candidate) =>
            candidate.topic === topic && candidate.category === category && !used.has(candidate.id),
        )
        if (chunk) {
          used.add(chunk.id)
          perTopic.set(topic, (perTopic.get(topic) ?? 0) + 1)
          return chunk
        }
      }
    }
    return null
  }

  for (const slot of INTERVIEW_SLOTS) {
    const categories = slot.filter((category) => !covered.has(category))
    if (categories.length === 0) continue

    let choices = symptomTopics
    if (slot.includes('medicines')) {
      choices = topics.includes(MEDICINE_TOPIC) ? [MEDICINE_TOPIC] : symptomTopics
    }
    if (slot.includes('goals for the visit')) choices = ['preparing for any visit']

    // Nothing specific? Use the general symptom questions.
    const chunk =
      take(categories, choices) ??
      (choices.length === 0 || slot.includes('goals for the visit')
        ? take(categories, ['general symptom history'])
        : null)
    if (chunk) picked.push(chunk)
  }

  // Keep the goals question when trimming to five: it shapes the list.
  while (picked.length > MAX_INTERVIEW) {
    const dropAt = picked.findIndex((chunk) =>
      ['impact on daily life', 'severity'].includes(chunk.category),
    )
    picked.splice(dropAt >= 0 ? dropAt : picked.length - 2, 1)
  }

  // Too few? Add related questions, before the medicines and goals ones.
  while (picked.length < MIN_INTERVIEW) {
    const extra = take(
      FILLER_CATEGORIES,
      symptomTopics.length ? symptomTopics : ['general symptom history'],
    )
    if (!extra) break
    const before = picked.findIndex((chunk) =>
      ['medicines', 'goals for the visit'].includes(chunk.category),
    )
    picked.splice(before >= 0 ? before : picked.length, 0, extra)
  }

  if (picked.length < MIN_INTERVIEW) return { steps: [] }
  return { steps: picked.map((chunk) => toStep(chunk, concerns)) }
}

// When retrieval found nothing, build questions from their own sentences so
// the quotes still match what they wrote.
function questionsFromText(text) {
  const parts = partsOf(text)
  return (parts.length ? parts : sentencesOf(text))
    .slice(0, 4)
    .map((sentence) => ({
      text: `What can you tell me about this: ${sentence.replace(/[.!?]+$/, '')}?`,
      quote: sentence,
      why: { reason: 'You wrote this in your worries.', source: null },
    }))
}

// Ask-doctor questions that fit what they want from the visit.
const GOAL_QUESTIONS = {
  "understand what's going on": 'preparing-02',
  'know what to do next': 'preparing-07',
  'feel better day to day': 'preparing-05',
}

// "You said it started in the last few days." Honest about which answer.
const ASKED_ABOUT = {
  onset: 'when it started',
  duration: 'how long it lasts',
  location: 'where you feel it',
  character: 'what it feels like',
  'triggers/relief': 'what makes it better or worse',
  timing: 'when it happens',
  severity: 'how bad it is',
  'related symptoms': 'anything else going on',
  'impact on daily life': 'how it affects your day',
  history: 'whether it has happened before',
  medicines: 'what you have tried',
}

function saidBecause(answer) {
  const value = String(answer.value).trim().replace(/[.!?]+$/, '')
  const lower = value.charAt(0).toLowerCase() + value.slice(1)
  if (answer.category === 'onset' && /^(today|in the|a few|months|yesterday|last|since|about|over)/i.test(value)) {
    return `You said it started ${lower}.`
  }
  if (answer.category === 'character' && value.split(/\s+/).length <= 3) {
    return `You said it feels ${lower}.`
  }
  return `You answered “${value}” when asked ${ASKED_ABOUT[answer.category] ?? 'about it'}.`
}

function tellDoctorFrom(concerns, answers) {
  const parts = partsOf(concerns)
  const items = (parts.length ? parts : sentencesOf(concerns))
    .slice(0, 4)
    .map((sentence) => ({
      text: sentence,
      quote: sentence,
      why: { reason: 'What you wrote at the start, in your own words.', source: null },
    }))

  for (const answer of answers) {
    const value = String(answer.value ?? '').trim()
    if (answer.skipped || !value) continue
    const label = CATEGORY_LABEL[answer.category] ?? 'My answer'
    const about = answer.about ? ` (${answer.about.replace(/\byour\b/g, 'my')})` : ''
    items.push({
      text: `${label}${about}: ${value}`,
      quote: value,
      why: { reason: `Your answer to “${answer.question}”`, source: answer.source ?? null },
    })
  }
  return items
}

/*
 * buildQuestions(text, { chunks, answers, signal })
 *   -> { status, questions: [{ text, quote, why }], tellDoctor: [{ text, quote, why }] }
 *
 * `chunks` are the retrieved knowledge-base entries. `answers` are the
 * interview answers: [{ id, question, category, topic, about, value, skipped, source }].
 * Every question comes from an "ask-doctor" chunk, lightly reworded. Its quote
 * is the sentence of theirs it relates to, and `why` names the source.
 * "What to tell your doctor" is only their own words, put in order.
 */
export async function buildQuestions(text, { signal, chunks = [], answers = [] } = {}) {
  const mode = currentMode()
  await wait(DELAYS[mode] ?? DELAYS.success, signal)
  failIfBroken(mode)

  if (mode === 'empty') return { status: 'empty', questions: [], tellDoctor: [] }

  const variant = nextVariant('questions')
  const tellDoctor = tellDoctorFrom(text, answers)

  const askPool = chunks.filter((chunk) => chunk.use === 'ask-doctor')
  if (askPool.length === 0) {
    return { status: 'success', questions: questionsFromText(text), tellDoctor }
  }

  const subject = subjectOf(text)
  const generalAsk = askPool.filter((chunk) => chunk.topic === 'general symptom history')
  const aboutMyWorry = generalAsk
    .filter((chunk) => chunk.category === 'about my worry')
    .sort((a, b) => a.id.localeCompare(b.id))
  const followUps = generalAsk.filter((chunk) => chunk.category !== 'about my worry')
  const findChunk = (id) => chunks.find((chunk) => chunk.id === id)
  const used = new Set()
  const sameText = new Set()

  // One question per idea: no "Do I need tests?" next to "Are there tests…?".
  const IDEAS = [
    ['tests', /\btests?\b/i],
    ['sooner', /sooner|call you|call 911|straight away|watch for/i],
    ['avoid', /\bavoid\b|check with you about/i],
  ]
  const ideas = new Set()
  function item(chunk, wording, quote, reason) {
    // Only questions the person asks the doctor. Interview prompts (questions
    // for the person) never reach this list.
    if (!chunk || chunk.use !== 'ask-doctor') return null
    const text = capitalize(wording ?? reword(chunk.question, chunk.topic, text0))
    if (used.has(chunk.id) || sameText.has(text)) return null
    const idea = IDEAS.find(([, pattern]) => pattern.test(text))?.[0]
    if (idea && ideas.has(idea)) return null
    if (idea) ideas.add(idea)
    used.add(chunk.id)
    sameText.add(text)
    return { text, quote, why: { reason, source: chunk.source ?? null } }
  }
  const text0 = text

  // How their worry is said in a question, in their words where possible:
  // "the funny feeling in my elbow" / "my elbow"; else the topic ("my headaches").
  function wordsFor(topic) {
    const about = topic ? aboutFor(topic, text) : null
    const sameThing = subject && (!about || about.includes(subject.body) || topic === 'chest discomfort')
    if (sameThing) return { problem: subject.me, part: subject.part, said: subject.you }
    if (!about) return null
    const mine = about.replace(/\byour\b/g, 'my')
    return { problem: mine, part: mine, said: about }
  }
  // Templates read naturally with "my elbow", "the chest ache" or "my headaches".
  const plural = (phrase) => /s$/.test(phrase) && !/ss$/.test(phrase)
  const fill = (chunk, words) =>
    words && chunk.template
      ? chunk.template
          .replace('{problem}', words.problem)
          .replace('{part}', words.part)
          .replace('{feels}', plural(words.part) ? 'feel' : 'feels')
      : null

  // 1. About their worry: questions from its topic, and patient-to-doctor
  //    questions in their own words. The "why" names what they said.
  const topics = topicsInOrder(askPool)
  const worries = topics.length ? topics : subject ? [null] : []
  const fromTopics = []
  const personal = []
  const personalOrder = variant === 0 ? [0, 1, 2, 3] : [0, 3, 1, 2]
  for (const topic of worries) {
    const words = wordsFor(topic)
    const quote = topic ? quoteFor(askPool.find((chunk) => chunk.topic === topic), text) : partsOf(text)[0] ?? text
    // Honest: quote what they said when we can.
    const mentioned = quote
      ? `You said “${quote.replace(/[.!?]+$/, '')}”.`
      : words
        ? `You mentioned ${words.said}.`
        : null
    const options = topic ? askPool.filter((chunk) => chunk.topic === topic) : []
    const fromTopic = options.length ? options[variant % options.length] : null
    const why = mentioned ?? `Your worry matches the topic “${topic}”.`
    if (fromTopic) fromTopics.push(item(fromTopic, null, quote, why))
    // Medicines are not "a problem" to find a cause for.
    if (topic !== MEDICINE_TOPIC && words) {
      const count = worries.length === 1 ? 3 : 1
      for (const index of personalOrder.slice(0, count)) {
        const chunk = aboutMyWorry[index]
        if (chunk) personal.push(item(chunk, fill(chunk, words), quote, mentioned))
      }
    }
  }
  // Every worry gets its own question before any extras.
  const specific = [...fromTopics, ...personal]

  // 2. From their interview answers. The "why" says which answer.
  const fromAnswers = []
  // "Nothing" or "Not much" is no reason for a follow-up question.
  const NOTHING = /^(no|none|nothing|not much|not sure|nothing yet|nothing i've noticed|rarely)\b/i
  const answered = answers.filter(
    (answer) => !answer.skipped && answer.value && !NOTHING.test(String(answer.value).trim()),
  )
  for (const answer of variant === 1 ? [...answered].reverse() : answered) {
    if (fromAnswers.length >= 1) break
    if (answer.topic === MEDICINE_TOPIC) continue
    const chunk = followUps.find((entry) => entry.category === answer.category)
    if (!chunk) continue
    const words = wordsFor(GENERAL_TOPICS.includes(answer.topic) ? null : answer.topic) ?? wordsFor(topics[0])
    fromAnswers.push(item(chunk, fill(chunk, words), answer.value, saidBecause(answer)))
  }
  const goal = answers.find((answer) => answer.category === 'goals for the visit' && !answer.skipped && answer.value)
  const goalId = goal ? GOAL_QUESTIONS[String(goal.value).trim().toLowerCase()] : null
  // "What do you think is going on" is not needed next to a cause question.
  const coversCause = [...fromTopics, ...personal].some(
    (entry) => entry && /causing|going on|making me/i.test(entry.text),
  )
  if (goalId && !(goalId === 'preparing-02' && coversCause)) {
    fromAnswers.push(
      item(findChunk(goalId), null, goal.value, `You said you want to ${goal.value.charAt(0).toLowerCase()}${goal.value.slice(1)}.`),
    )
  }

  // 3. At most two general questions, at the end.
  const general = []
  const asksSooner = [...specific, ...fromAnswers].some((entry) => entry && /sooner|call you|watch for/i.test(entry.text))
  const closingIds = asksSooner ? ['preparing-09', 'preparing-08'] : ['preparing-07', 'preparing-09']
  general.push(item(findChunk(closingIds[variant % 2]), null, null, 'A good question for any visit.'))

  const answerItems = fromAnswers.filter(Boolean)
  const mine = [...specific.filter(Boolean).slice(0, Math.min(4, 5 - answerItems.length)), ...answerItems]
  // Fewer than four? Add another general question.
  if (mine.length + general.length < 4) {
    for (const id of ['preparing-03', 'preparing-05', 'preparing-10']) {
      if (mine.length + general.filter(Boolean).length >= 4) break
      general.unshift(item(findChunk(id), null, null, 'A good question for any visit.'))
    }
  }

  const questions = [...mine, ...general.filter(Boolean).slice(-2)].slice(0, 6)
  return { status: 'success', questions, tellDoctor }
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
      time: 'night',
      note: 'same as before',
      quote: 'keep taking my night pill, Norvelan, the same as before',
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
      'You were started on Bellaprin, one tablet every morning with food. Keep taking Norvelan at night, the same as before. The dose of Bellaprin was not clear, so ask your doctor or pharmacist.',
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
