import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/Card.jsx'
import { listVisits } from '../services/api.js'

function summaryLine(visit) {
  if (visit.type === 'before') return visit.concerns || 'Questions for your doctor'
  return visit.summary?.[0]?.text || 'A saved visit'
}

export default function Home() {
  const [recent, setRecent] = useState(null)
  const [state, setState] = useState('loading')

  useEffect(() => {
    let active = true
    listVisits()
      .then((visits) => {
        if (!active) return
        setRecent(visits[0] ?? null)
        setState('ready')
      })
      .catch(() => {
        if (active) setState('error')
      })
    return () => {
      active = false
    }
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="vb-container py-8">
      <p className="text-small font-bold uppercase tracking-widest text-accent">{greeting}</p>
      <h1 className="mt-2 text-hero font-bold">What would you like to do?</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card
          as={Link}
          to="/app/before"
          className="block min-h-tap p-6 hover:border-accent hover:bg-accent-soft"
        >
          <h2 className="text-heading font-bold">Before a visit</h2>
          <p className="mt-2 text-body text-muted">
            Turn what worries you into questions to ask the doctor.
          </p>
        </Card>

        <Card
          as={Link}
          to="/app/after"
          className="block min-h-tap p-6 hover:border-accent hover:bg-accent-soft"
        >
          <h2 className="text-heading font-bold">After a visit</h2>
          <p className="mt-2 text-body text-muted">
            Turn what the doctor said into a summary, to-dos and medicines.
          </p>
        </Card>
      </div>

      <h2 className="mt-8 text-subhead font-bold">Your last visit</h2>

      {state === 'loading' ? (
        <p className="mt-2 text-body text-muted" aria-live="polite">
          Loading your visits…
        </p>
      ) : null}

      {state === 'error' ? (
        <p className="mt-2 text-body text-muted">
          Your visits could not be loaded. Check that the little server is running, then
          reload.
        </p>
      ) : null}

      {state === 'ready' && !recent ? (
        <p className="mt-2 text-body text-muted">
          Nothing saved yet. Start with a visit, and it will show up here.
        </p>
      ) : null}

      {recent ? (
        <Card as={Link} to={`/app/visits/${recent.id}`} className="mt-2 block hover:border-accent">
          <p className="text-small text-muted">
            {new Date(recent.createdAt).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="mt-1 text-subhead font-bold">{summaryLine(recent)}</p>
        </Card>
      ) : null}
    </div>
  )
}
