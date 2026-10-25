import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, FileText, Mic } from 'lucide-react'
import { listVisits } from '../services/api.js'

function summaryLine(visit) {
  if (visit.type === 'before') return visit.concerns || 'Questions for your doctor'
  return visit.summary?.[0]?.text || 'A saved visit'
}

function ActionCard({ to, icon: Icon, tint, title, description, cta }) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col rounded-card border border-line bg-surface p-6 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lift md:p-8"
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tint}`}>
        <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
      </span>

      <h2 className="mt-5 text-heading font-bold">{title}</h2>
      <p className="mt-2 max-w-[34ch] text-body text-muted">{description}</p>

      <span className="mt-auto flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-body font-bold text-paper shadow-soft transition-colors duration-200 group-hover:bg-primary-deep">
        {cta}
        <ArrowRight
          size={20}
          strokeWidth={2}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </span>
    </Link>
  )
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
    <div className="vb-container pt-8 md:pt-10">
      <header className="max-w-2xl">
        <p className="text-small font-bold uppercase tracking-[0.14em] text-accent">{greeting}</p>
        <h1 className="mt-3 text-hero font-bold">What would you like to do?</h1>
        <p className="mt-3 text-body text-muted">Let&rsquo;s make your next doctor visit easier.</p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <ActionCard
          to="/app/before"
          icon={ClipboardList}
          tint="bg-primary-soft text-primary"
          title="Before a visit"
          description="Turn what worries you into questions to ask your doctor."
          cta="Get prepared"
        />

        <ActionCard
          to="/app/after"
          icon={Mic}
          tint="bg-tint-sky text-medical-cyan"
          title="After a visit"
          description="Turn what the doctor said into a summary, to-dos, and medicines."
          cta="Summarize a visit"
        />
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-subhead font-bold">Your recent visit</h2>
          <Link
            to="/app/history"
            className="flex min-h-tap items-center text-small font-bold text-primary underline underline-offset-4"
          >
            View all visits
          </Link>
        </div>

        {state === 'loading' ? (
          <p className="mt-4 text-body text-muted" aria-live="polite">
            Loading your visits...
          </p>
        ) : null}

        {state === 'error' ? (
          <p className="mt-4 text-body text-muted">
            Your visits could not be loaded. Check that the little server is running, then
            reload.
          </p>
        ) : null}

        {state === 'ready' && !recent ? (
          <div className="mt-4 flex items-center gap-4 rounded-card border border-dashed border-line bg-surface-2 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-muted">
              <FileText size={24} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <p className="text-body text-muted">
              Nothing saved yet. Start with a visit, and it will show up here.
            </p>
          </div>
        ) : null}

        {recent ? (
          <Link
            to={`/app/visits/${recent.id}`}
            className="group mt-4 flex items-center gap-5 rounded-card border border-line bg-surface p-6 shadow-soft transition-colors duration-200 hover:border-primary"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <FileText size={24} strokeWidth={1.8} aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-small font-bold uppercase tracking-[0.12em] text-muted">
                {new Date(recent.createdAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {' · '}
                {recent.type === 'before' ? 'Before a visit' : 'After a visit'}
              </span>
              <span className="mt-1 block truncate text-subhead font-bold text-ink">
                {summaryLine(recent)}
              </span>
            </span>

            <ArrowRight
              size={22}
              strokeWidth={2}
              aria-hidden="true"
              className="shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        ) : null}
      </section>
    </div>
  )
}
