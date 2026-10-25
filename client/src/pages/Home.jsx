import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import Reveal from '../components/Reveal.jsx'
import { listVisits } from '../services/api.js'

function summaryLine(visit) {
  if (visit.type === 'before') return visit.concerns || 'Questions for your doctor'
  return visit.summary?.[0]?.text || 'A saved visit'
}

export default function Home() {
  const [recent, setRecent] = useState(null)
  const [state, setState] = useState('loading')
  const reduce = useReducedMotion()

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
    <div className="vb-container pt-10">
      <header className="grid items-end gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="vb-eyebrow text-ember">{greeting}</p>
          <h1 className="mt-4 text-hero font-bold">What would you like to do?</h1>
        </div>
        <p className="max-w-[38ch] text-body text-muted lg:col-span-5">
          Two ways in. Both take about a minute, and you can change every word before it is
          saved.
        </p>
      </header>

      <div className="mt-10 grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-7" y={20}>
          <Link
            to="/app/before"
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl bg-sage p-8 transition-transform duration-calm hover:-translate-y-1"
          >
            <div>
              <span className="font-display text-hero text-evergreen">01</span>
              <h2 className="mt-4 text-heading font-bold">Before a visit</h2>
              <p className="mt-2 max-w-[38ch] text-body text-muted">
                Turn what worries you into questions to ask the doctor.
              </p>
            </div>

            <span className="mt-8 inline-flex items-center gap-2 text-body font-bold text-evergreen">
              Start
              <motion.span
                aria-hidden="true"
                className="inline-block"
                initial={false}
                whileHover={reduce ? undefined : { x: 4 }}
              >
                →
              </motion.span>
            </span>
          </Link>
        </Reveal>

        <Reveal className="lg:col-span-5" y={20} delay={0.08}>
          <Link
            to="/app/after"
            className="group flex h-full flex-col justify-between rounded-xl bg-night p-8 text-cream transition-transform duration-calm hover:-translate-y-1"
          >
            <div>
              <span className="font-display text-hero text-ember-bright">02</span>
              <h2 className="mt-4 text-heading font-bold">After a visit</h2>
              <p className="mt-2 text-body text-cream-muted">
                Turn what the doctor said into a summary, to-dos and medicines.
              </p>
            </div>

            <span className="mt-8 inline-flex items-center gap-2 text-body font-bold text-cream">
              Start
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        </Reveal>
      </div>

      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-subhead font-bold">Your last visit</h2>
          <Link
            to="/app/history"
            className="flex min-h-tap items-center text-small font-bold text-evergreen underline underline-offset-4"
          >
            All visits
          </Link>
        </div>

        {state === 'loading' ? (
          <p className="mt-4 text-body text-muted" aria-live="polite">
            Loading your visits…
          </p>
        ) : null}

        {state === 'error' ? (
          <p className="mt-4 text-body text-muted">
            Your visits could not be loaded. Check that the little server is running, then
            reload.
          </p>
        ) : null}

        {state === 'ready' && !recent ? (
          <div className="mt-4 rounded-card border border-dashed border-line bg-surface-2 p-8">
            <p className="text-body text-muted">
              Nothing saved yet. Start with a visit, and it will show up here.
            </p>
          </div>
        ) : null}

        {recent ? (
          <Link
            to={`/app/visits/${recent.id}`}
            className="mt-4 flex items-center justify-between gap-6 rounded-card border border-line bg-surface p-6 shadow-soft transition-colors duration-calm hover:border-evergreen"
          >
            <div className="min-w-0">
              <p className="text-small font-bold uppercase tracking-[0.12em] text-ember">
                {new Date(recent.createdAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="mt-2 truncate text-subhead font-bold">{summaryLine(recent)}</p>
            </div>
            <span aria-hidden="true" className="text-heading text-muted">
              →
            </span>
          </Link>
        ) : null}
      </section>
    </div>
  )
}
