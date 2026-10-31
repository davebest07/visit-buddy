import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
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
  let raw
  try {
    raw = await readFile(DATA_FILE, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // A damaged file used to make every request fail. Move it aside so nothing
    // is lost, and carry on with an empty store.
    const backup = path.join(DATA_DIR, `visits.corrupt-${Date.now()}.json`)
    await rename(DATA_FILE, backup)
    console.error(`visits.json could not be read. It was moved to ${backup}`)
    return []
  }
}

// Write to a temporary file, then rename it over the real one. A rename is
// atomic, so a crash halfway through can never leave a half-written file.
async function writeVisits(visits) {
  await mkdir(DATA_DIR, { recursive: true })
  const temp = `${DATA_FILE}.tmp`
  await writeFile(temp, JSON.stringify(visits, null, 2), 'utf8')
  await rename(temp, DATA_FILE)
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

// Only these fields can come from the client. id and createdAt are always set
// by the server, and anything else is dropped.
const EDITABLE = ['type', 'concerns', 'transcript', 'approved', ...LISTS]

function pickEditable(body) {
  const picked = {}
  if (!body || typeof body !== 'object' || Array.isArray(body)) return picked
  for (const key of EDITABLE) {
    if (body[key] !== undefined) picked[key] = body[key]
  }
  return picked
}

function isListItem(item) {
  if (typeof item === 'string') return true
  return item !== null && typeof item === 'object' && !Array.isArray(item)
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
    if (body[key] === undefined) continue
    if (!Array.isArray(body[key])) {
      return `${key} must be a list.`
    }
    if (!body[key].every(isListItem)) {
      return `Every item in ${key} must be text or an object.`
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
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({ error: 'Send a visit object.' })
    return
  }

  const fields = pickEditable(req.body)
  const problem = validateVisit(fields)
  if (problem) {
    res.status(400).json({ error: problem })
    return
  }

  try {
    const visit = {
      ...blankVisit(),
      ...fields,
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
      // A visit's type is fixed once it is created.
      const changes = pickEditable(req.body)
      delete changes.type
      const current = visits[index]
      const merged = { ...current, ...changes, id: current.id, createdAt: current.createdAt }
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
