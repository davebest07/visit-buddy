import express, { Router } from 'express'
import { AIError, isConfigured, modelName, transcribeAudio } from '../services/gemini.js'
import {
  answerAboutVisit,
  questionsFromConcerns,
  summariseVisit,
} from '../services/aiTasks.js'

const router = Router()

// Recordings are short (a visit answer, not a whole appointment), so 20 MB is
// generous. Anything larger is rejected before it reaches the model.
const MAX_AUDIO = '20mb'

const LIMITS = {
  concerns: 4000,
  transcript: 20000,
  question: 500,
}

function readText(body, field, { required = true } = {}) {
  const value = body?.[field]
  if (typeof value !== 'string') {
    if (required) throw new AIError('invalid', `${field} must be text.`, { status: 400 })
    return ''
  }

  const trimmed = value.trim()
  if (required && !trimmed) {
    throw new AIError('invalid', `${field} cannot be empty.`, { status: 400 })
  }
  if (trimmed.length > LIMITS[field]) {
    throw new AIError(
      'invalid',
      `${field} is too long. Keep it under ${LIMITS[field].toLocaleString()} characters.`,
      { status: 413 },
    )
  }
  return trimmed
}

// Turns a thrown AIError into the JSON shape the client understands. The client
// maps `kind` onto the same messages it already shows for each state.
function fail(res, error, next) {
  if (error instanceof AIError) {
    const status = error.status ?? 502
    res.status(status).json({ error: error.message, kind: error.kind })
    return
  }
  next(error)
}

// Everything AI needs a key; say so plainly instead of failing at the model.
router.use((req, res, next) => {
  if (req.method === 'GET') {
    next()
    return
  }
  if (!isConfigured()) {
    res.status(503).json({
      error: 'The AI is not configured yet. Add GEMINI_API_KEY to the server .env file.',
      kind: 'notconfigured',
    })
    return
  }
  next()
})

// A small status endpoint so the app can explain itself when no key is set.
router.get('/status', (req, res) => {
  res.json({ configured: isConfigured(), model: modelName() })
})

// AI-1 — worries -> questions to ask
router.post('/questions', async (req, res, next) => {
  try {
    const concerns = readText(req.body, 'concerns')
    const result = await questionsFromConcerns(concerns)
    res.json(result)
  } catch (error) {
    fail(res, error, next)
  }
})

// AI-2 — recording -> text. The audio arrives as a raw body, never as JSON.
router.post('/transcribe', express.raw({ type: ['audio/*', 'video/webm'], limit: MAX_AUDIO }), async (req, res, next) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new AIError('invalid', 'No audio was received.', { status: 400 })
    }

    // "audio/webm;codecs=opus" -> "audio/webm"
    const header = String(req.headers['content-type'] ?? 'audio/webm')
    const mimeType = header.split(';')[0].trim() || 'audio/webm'

    const transcript = await transcribeAudio({
      base64: req.body.toString('base64'),
      mimeType,
      prompt: 'Transcribe this recording of a doctor visit word for word.',
    })

    if (!transcript) {
      throw new AIError('empty', 'Nothing could be heard in that recording.', { status: 422 })
    }

    res.json({ text: transcript })
  } catch (error) {
    fail(res, error, next)
  }
})

// AI-3 — what the doctor said -> summary, to-dos, medicines, things to check
router.post('/summarize', async (req, res, next) => {
  try {
    const transcript = readText(req.body, 'transcript')
    const result = await summariseVisit(transcript)
    res.json(result)
  } catch (error) {
    fail(res, error, next)
  }
})

// AI-4 — ask about one visit
router.post('/ask', async (req, res, next) => {
  try {
    const transcript = readText(req.body, 'transcript')
    const question = readText(req.body, 'question')
    const result = await answerAboutVisit(transcript, question)
    res.json(result)
  } catch (error) {
    fail(res, error, next)
  }
})

export default router
