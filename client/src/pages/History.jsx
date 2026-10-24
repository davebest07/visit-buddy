import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listVisits } from '../services/api.js'

function oneLine(visit) {
  if (visit.type === 'before') return visit.concerns || 'Questions for your doctor'
  return visit.summary?.[0]?.text || 'A saved visit'
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function History() {
  const [visits, setVisits] = useState([])
  const [state, setState] = useState('loading')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    listVisits()
      .then((list) => {
        if (!active) return
        setVisits(list)
        setState('ready')
      })
      .catch(() => {
        if (active) setState('error')
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return visits
    return visits.filter((visit) =>
      [oneLine(visit), visit.transcript, visit.concerns, formatDate(visit.createdAt)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    )
  }, [visits, search])

  return (
    <div className="vb-container py-8">
      <h1 className="text-hero font-bold">History</h1>
      <p className="mt-2 text-body text-muted">Every visit you saved, newest first.</p>

      <label htmlFor="search" className="mt-6 block text-small font-bold">
        Search your visits
      </label>
      <input
        id="search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="A word from the visit"
        className="mt-2 w-full rounded border border-line bg-surface p-4 text-body"
      />

      {state === 'loading' ? (
        <p className="mt-6 text-body text-muted" aria-live="polite">
          Loading your visits…
        </p>
      ) : null}

      {state === 'error' ? (
        <p className="mt-6 text-body text-muted">
          Your visits could not be loaded. Check that the little server is running, then
          reload.
        </p>
      ) : null}

      {state === 'ready' && visits.length === 0 ? (
        <p className="mt-6 text-body text-muted">
          No visits yet. Use Before a visit or After a visit to make one.
        </p>
      ) : null}

      {state === 'ready' && visits.length > 0 && filtered.length === 0 ? (
        <p className="mt-6 text-body text-muted">Nothing matches “{search}”.</p>
      ) : null}

      {filtered.length > 0 ? (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {filtered.map((visit) => (
            <li key={visit.id}>
              <Link
                to={`/app/visits/${visit.id}`}
                className="flex min-h-tap flex-col gap-1 py-4 hover:text-accent"
              >
                <span className="text-small text-muted">
                  {formatDate(visit.createdAt)} ·{' '}
                  {visit.type === 'before' ? 'Before a visit' : 'After a visit'}
                </span>
                <span className="text-body">{oneLine(visit)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
