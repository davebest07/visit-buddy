import cors from 'cors'
import express from 'express'
import ai from './routes/ai.js'
import rag from './routes/rag.js'
import visits from './routes/visits.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api/visits', visits)
app.use('/api/ai', ai)
app.use('/api/rag', rag)

// Bad JSON and anything unexpected land here with a readable message.
app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'That request was not valid JSON.' })
    return
  }

  console.error(error)
  res.status(500).json({ error: 'Something went wrong on the server.' })
})

// Listen on this computer only. Without a host, Node accepts connections from
// every network interface, so anyone on the same Wi-Fi could read the visits.
const HOST = process.env.HOST || '127.0.0.1'

app.listen(PORT, HOST, () => {
  console.log(`Visit Buddy server listening on http://${HOST}:${PORT}`)
})
