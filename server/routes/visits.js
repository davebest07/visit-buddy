import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Router } from 'express'

const here = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(here, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'visits.json')

// One write at a time, so two quick saves cannot clobber each other.
let queue = Promise.resolve()
function withStore(task) {
  const run = queue.then(task, task)
  queue = run.catch(() => {})
  return run
}

async function readVisits() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function writeVisits(visits) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(DATA_FILE, JSON.stringify(visits, null, 2), 'utf8')
}

const TYPES = ['before', 'after']
const LISTS = ['questions', 'summary', 'todos', 'meds', 'flags']

function blankVisit() {
  return {
    concerns: '',
    questions: [],
    transcript: '',
    summary: [],
    todos: [],
    meds: [],
    flags: [],
    approved: true,
  }
}

// Basic input validation with a message a person can act on.
function validateVisit(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Send a visit object.'
  }
  if (!TYPES.includes(body.type)) {
    return 'type must be "before" or "after".'
  }
  if (body.concerns !== undefined && typeof body.concerns !== 'string') {
    return 'concerns must be text.'
  }
  if (body.transcript !== undefined && typeof body.transcript !== 'string') {
    return 'transcript must be text.'
  }
  for (const key of LISTS) {
    if (body[key] !== undefined && !Array.isArray(body[key])) {
      return `${key} must be a list.`
    }
  }
  if (body.approved !== undefined && typeof body.approved !== 'boolean') {
    return 'approved must be true or false.'
  }
  return null
}

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const visits = await withStore(readVisits)
    const newestFirst = [...visits].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    res.json(newestFirst)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  const problem = validateVisit(req.body)
  if (problem) {
    res.status(400).json({ error: problem })
    return
  }

  try {
    const visit = {
      ...blankVisit(),
      ...req.body,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    }

    const saved = await withStore(async () => {
      const visits = await readVisits()
      visits.push(visit)
      await writeVisits(visits)
      return visit
    })

    res.status(201).json(saved)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const visits = await withStore(readVisits)
    const visit = visits.find((entry) => entry.id === req.params.id)
    if (!visit) {
      res.status(404).json({ error: 'That visit was not found.' })
      return
    }
    res.json(visit)
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const result = await withStore(async () => {
      const visits = await readVisits()
      const index = visits.findIndex((entry) => entry.id === req.params.id)
      if (index === -1) return { missing: true }

      // Merge first, then validate, so a patch can send only the fields it changes.
      const merged = { ...visits[index], ...req.body, id: visits[index].id }
      const problem = validateVisit(merged)
      if (problem) return { problem }

      visits[index] = merged
      await writeVisits(visits)
      return { visit: merged }
    })

    if (result.missing) {
      res.status(404).json({ error: 'That visit was not found.' })
      return
    }

    if (result.problem) {
      res.status(400).json({ error: result.problem })
      return
    }

    res.json(result.visit)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await withStore(async () => {
      const visits = await readVisits()
      const nextVisits = visits.filter((entry) => entry.id !== req.params.id)
      if (nextVisits.length === visits.length) return false
      await writeVisits(nextVisits)
      return true
    })

    if (!removed) {
      res.status(404).json({ error: 'That visit was not found.' })
      return
    }

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

// Delete everything, used by "Delete all my data".
router.delete('/', async (req, res, next) => {
  try {
    await withStore(async () => {
      await writeVisits([])
    })
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

export default router
