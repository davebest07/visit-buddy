import { Router } from 'express'

// Phase 4 puts the real Gemini calls here. Nothing in the client holds a key.
const router = Router()

router.use((req, res) => {
  res.status(501).json({ error: 'AI is connected in Phase 4' })
})

export default router
