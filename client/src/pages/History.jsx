import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listVisits } from '../services/api.js'

function oneLine(visit) {
  if (visit.type === 'before') return visit.concerns || 'Questions for your doctor'
  return visit.summary?.[0]?.text || 'A saved visit'
}

// Questions are searchable too, in either the current { text, quote } shape or
// the plain strings saved by the earlier version.
function questionText(visit) {
  return (visit.questions ?? [])
    .map((question) => (typeof question === 'string' ? question : question?.text))
    .filter(Boolean)
    .join(' ')
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
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
      [oneLine(visit), visit.transcript, visit.concerns, questionText(visit), formatDate(visit.createdAt)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    )
  }, [visits, search])

  return (
    <div className="vb-container max-w-4xl pt-10">
      <header>
        <h1 className="mt-4 text-hero font-bold">Every visit, newest first.</h1>
      </header>

      <div className="mt-8">
        <label htmlFor="search" className="sr-only">
          Search your visits
        </label>
        <div className="relative">
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="A word from the visit"
            className="min-h-tap w-full rounded-full border border-line bg-surface py-3 pl-12 pr-6 text-body text-ink placeholder:text-muted"
          />
        </div>
      </div>

      {state === 'loading' ? (
        <p className="mt-8 text-body text-muted" aria-live="polite">
          Loading your visits...
        </p>
      ) : null}

      {state === 'error' ? (
        <p className="mt-8 text-body text-muted">
          Your visits could not be loaded. Check that the little server is running, then reload.
        </p>
      ) : null}

      {state === 'ready' && visits.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-line bg-surface-2 p-8">
          <p className="text-body text-muted">
            No visits yet. Use Before a visit or After a visit to make one.
          </p>
        </div>
      ) : null}

      {state === 'ready' && visits.length > 0 && filtered.length === 0 ? (
        <p className="mt-8 text-body text-muted">Nothing matches "{search}".</p>
      ) : null}

      {filtered.length > 0 ? (
        <ul className="mt-8 border-t border-line">
          {filtered.map((visit) => (
            <li key={visit.id} className="border-b border-line">
              <Link
                to={`/app/visits/${visit.id}`}
                className="group flex items-center gap-6 py-6 transition-colors duration-fast hover:text-primary"
              >
                <span className="w-24 shrink-0 text-small font-bold uppercase tracking-[0.12em] text-accent">
                  {formatDate(visit.createdAt)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-subhead font-bold">{oneLine(visit)}</span>
                  <span className="mt-1 block text-small text-muted">
                    {visit.type === 'before' ? 'Before a visit' : 'After a visit'}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-heading text-muted transition-transform duration-calm group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
