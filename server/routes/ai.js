import { Router } from 'express'

// Phase 4 puts the real Gemini calls here. Nothing in the client holds a key.
const router = Router()

/*
 * TODO: POST /api/ai/read-document  (not built yet; the client uses the mock
 * readDocument() in client/src/services/aiService.js)
 *
 * What it would do:
 *   - Take one request with up to 10 pages (images or a PDF) as
 *     multipart/form-data, each under 25 MB. Reject anything else with 400.
 *   - Send the pages, in order, to a vision model with an instruction to copy
 *     the words exactly as printed, keep line breaks, never guess, never add
 *     advice, and wrap anything it cannot read as [unclear: best reading?].
 *   - Return { text } only: plain text, the same shape transcribe() returns.
 *   - Keep the images in memory for the length of the request only. Never
 *     write them to disk or to server/data, never log them, and ask the model
 *     provider not to retain them.
 *   - Map provider failures to the same errors the client already handles:
 *     503 unavailable, 504 timeout, 429 ratelimit.
 * The client then shows the text as "From your photo" for the person to check
 * before it goes through summarizeVisit.
 */

router.use((req, res) => {
  res.status(501).json({ error: 'AI is connected in Phase 4' })
})

export default router
