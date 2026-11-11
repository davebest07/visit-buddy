// ---------------------------------------------------------------------------
// Gemini transport.
//
// The only place a key is read. Nothing else in the project touches
// GEMINI_API_KEY, and it never reaches the browser.
//
// Every failure is turned into an AIError with a `kind` the client already
// knows how to display (see AIShell.jsx): notconfigured, ratelimit, timeout,
// unavailable, invalid, empty.
// ---------------------------------------------------------------------------

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models'

// Defaults to a model that is on the free tier and that answered reliably when
// measured: gemini-3.8-flash was returning 503 "high demand" while 3.6 answered
// in about a second. Gemini 2.5 is not offered at all: Google now replies 404
// "no longer available to new users". Override with GEMINI_MODEL.
const MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash'
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 60000

export class AIError extends Error {
  constructor(kind, message, { status = 500, cause, retryable = false } = {}) {
    super(message)
    this.name = 'AIError'
    this.kind = kind
    this.status = status
    // Transient failures (capacity, gateway) are worth one more try; a bad key
    // or a rate limit is not.
    this.retryable = retryable
    this.cause = cause
  }
}

export function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

export function modelName() {
  return MODEL
}

function apiKey() {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) {
    throw new AIError(
      'notconfigured',
      'The AI is not configured yet. Add GEMINI_API_KEY to the server .env file.',
      { status: 503 },
    )
  }
  return key
}

// A bad key arrives as HTTP 400 INVALID_ARGUMENT with "API key not valid" in the
// message, not as a 401, so the message is checked as well as the status.
function looksLikeKeyProblem(apiStatus, apiMessage) {
  if (/api[\s_-]?key/i.test(apiMessage)) return true
  if (/API_KEY_INVALID|SERVICE_DISABLED/i.test(String(apiStatus))) return true
  return /not valid|expired|API has not been enabled|is disabled/i.test(apiMessage)
}

// Google reports the real reason in error.status / error.message. Map the ones
// a person can act on and keep the rest as a plain failure.
function errorFromResponse(status, payload, model) {
  const apiStatus = payload?.error?.status
  const apiMessage = payload?.error?.message ?? ''

  if (status === 429) {
    return new AIError('ratelimit', 'Too many requests. Please wait a minute and try again.', {
      status: 429,
    })
  }

  // A bad or missing key, a key without access, or a model that is not
  // available all mean "fix the configuration", not "try again later".
  if (
    status === 401 ||
    status === 403 ||
    apiStatus === 'PERMISSION_DENIED' ||
    apiStatus === 'UNAUTHENTICATED'
  ) {
    return new AIError(
      'notconfigured',
      'The AI key was rejected. Check that GEMINI_API_KEY is valid and has access to the Gemini API.',
      { status: 503 },
    )
  }

  // Must come before the generic 400 branch: an invalid key is reported as a
  // 400 by Google, and telling the user "that request could not be sent" would
  // send them looking in the wrong place.
  if (looksLikeKeyProblem(apiStatus, apiMessage)) {
    return new AIError(
      'notconfigured',
      'The AI key was rejected. Check that GEMINI_API_KEY in .env is correct, then restart the server.',
      { status: 503 },
    )
  }

  if (status === 404 || apiStatus === 'NOT_FOUND') {
    return new AIError(
      'notconfigured',
      `The model "${model}" was not found for this key. Set GEMINI_MODEL in .env to a model your key can use.`,
      { status: 503 },
    )
  }

  if (status === 400 || apiStatus === 'INVALID_ARGUMENT') {
    return new AIError('invalid', apiMessage || 'The request was not accepted by the AI service.', {
      status: 400,
    })
  }

  if (status >= 500) {
    return new AIError('unavailable', 'The AI service is unavailable right now.', {
      status: 502,
      retryable: true,
    })
  }

  return new AIError('unavailable', apiMessage || 'The AI request failed.', { status: 502 })
}

// One place that builds the request, applies the timeout and normalises errors.
async function callOnce(body, { signal } = {}) {
  const key = apiKey()
  const url = `${API_ROOT}/${encodeURIComponent(MODEL)}:generateContent`

  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const composite = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      // Key travels in a header rather than the query string so it stays out
      // of server logs and error messages.
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: composite,
    })
  } catch (cause) {
    if (cause?.name === 'TimeoutError' || cause?.name === 'AbortError') {
      throw new AIError('timeout', 'The AI took too long to answer.', { status: 504, cause })
    }
    throw new AIError('unavailable', 'Could not reach the AI service.', {
      status: 502,
      cause,
      retryable: true,
    })
  }

  if (!response.ok) {
    let payload = null
    try {
      payload = await response.json()
    } catch {
      // Non-JSON error body; the status code is enough.
    }
    throw errorFromResponse(response.status, payload, MODEL)
  }

  let payload
  try {
    payload = await response.json()
  } catch (cause) {
    throw new AIError('unavailable', 'The AI returned a response that could not be read.', {
      status: 502,
      cause,
    })
  }

  const candidate = payload?.candidates?.[0]
  const text = (candidate?.content?.parts ?? [])
    .filter((part) => typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim()

  const finish = candidate?.finishReason

  // SAFETY, RECITATION and PROHIBITED_CONTENT carry no usable text.
  if (!text) {
    if (finish === 'SAFETY' || finish === 'PROHIBITED_CONTENT' || finish === 'RECITATION') {
      throw new AIError('empty', 'The AI would not produce that answer.', { status: 502 })
    }
    throw new AIError('empty', 'The AI returned an empty answer.', { status: 502 })
  }

  return text
}

// Capacity on the Flash models genuinely comes and goes: a 503 with "high
// demand" is Google telling you to try again shortly. Two short pauses turn a
// dead-end error into a served request most of the time.
const RETRY_DELAYS_MS = [800, 2000]

function pause(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AIError('timeout', 'The request was cancelled.', { status: 504 }))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new AIError('timeout', 'The request was cancelled.', { status: 504 }))
      },
      { once: true },
    )
  })
}

async function callGemini(body, { signal } = {}) {
  let lastError

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await callOnce(body, { signal })
    } catch (error) {
      lastError = error
      const canRetry =
        error instanceof AIError && error.retryable && attempt < RETRY_DELAYS_MS.length
      if (!canRetry) throw error
      await pause(RETRY_DELAYS_MS[attempt], signal)
    }
  }

  throw lastError
}

/**
 * Ask for JSON matching `schema` and return the parsed object.
 * Gemini is told to emit JSON directly (responseMimeType) and the shape is
 * constrained by responseSchema, so a parse failure is a genuine anomaly.
 */
export async function generateJson({ systemInstruction, prompt, schema, temperature = 0.2, signal }) {
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  }

  const text = await callGemini(body, { signal })

  try {
    return JSON.parse(text)
  } catch (cause) {
    throw new AIError('empty', 'The AI answer was not readable.', { status: 502, cause })
  }
}

/**
 * Turn a recording into text. Audio is sent inline as base64, which suits the
 * short recordings this app makes (well under the inline request limit).
 */
export async function transcribeAudio({ base64, mimeType, prompt, signal }) {
  const body = {
    systemInstruction: {
      parts: [
        {
          text:
            'You are a careful medical-visit transcriptionist. Write down exactly what is said, ' +
            'including the patient and the clinician. Do not summarise, do not add anything, and ' +
            'do not fix the speaker\'s wording. If a word is unclear, write [unclear] in its place.',
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }, { inlineData: { mimeType, data: base64 } }],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: 4096 },
  }

  const text = await callGemini(body, { signal })
  return text.trim()
}


/**
 * Read the words off a photographed page (or a PDF). The image is sent inline
 * as base64 and only text comes back, so nothing but words reaches the client.
 */
export async function readDocument({ base64, mimeType, signal }) {
  const body = {
    systemInstruction: {
      parts: [
        {
          text:
            'You read printed medical papers. Copy every word exactly as it appears, in reading ' +
            'order, keeping line breaks. Do not summarise, explain, correct spelling or add ' +
            'anything. If a word or number cannot be made out, write it as [unclear: best guess] ' +
            'where the guess is optional. Output plain text only.',
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Read this page.' }, { inlineData: { mimeType, data: base64 } }],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: 4096 },
  }

  const text = await callGemini(body, { signal })
  return text.trim()
}
