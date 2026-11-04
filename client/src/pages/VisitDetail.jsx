import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AIShell, { useAICall } from '../components/AIShell.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import FlaggedLine from '../components/FlaggedLine.jsx'
import QuoteLine from '../components/QuoteLine.jsx'
import Toast from '../components/Toast.jsx'
import { askAboutVisit } from '../services/aiService.js'
import { deleteVisit, getVisit, updateVisit } from '../services/api.js'

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function visitAsText(visit) {
  const lines = [formatDate(visit.createdAt), '']
  if (visit.concerns) lines.push(`Worries: ${visit.concerns}`, '')
  if (visit.questions?.length) {
    lines.push('Questions')
    // Questions are stored as { text, quote } now, but visits saved by the
    // earlier version hold plain strings, so both shapes are read here.
    visit.questions.forEach((question, index) => {
      const wording = typeof question === 'string' ? question : question?.text
      if (wording) lines.push(`${index + 1}. ${wording}`)
    })
    lines.push('')
  }
  if (visit.summary?.length) {
    lines.push('Summary')
    visit.summary.forEach((line) => lines.push(`- ${line.text}`))
    lines.push('')
  }
  if (visit.todos?.length) {
    lines.push('To-do')
    visit.todos.forEach((todo) => lines.push(`- [${todo.done ? 'x' : ' '}] ${todo.text}`))
    lines.push('')
  }
  if (visit.meds?.length) {
    lines.push('Medicines')
    visit.meds.forEach((med) =>
      lines.push(`- ${med.name}: ${med.dose ?? 'dose not clear'} (${med.time ?? 'time not clear'})`),
    )
    lines.push('')
  }
  if (visit.transcript) lines.push('What the doctor said', visit.transcript)
  return lines.join('\n')
}

function Section({ label, children }) {
  return (
    <section className="mt-12">
      <p className="text-small font-bold uppercase tracking-[0.14em] text-accent">{label}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function VisitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [visit, setVisit] = useState(null)
  const [state, setState] = useState('loading')
  const [question, setQuestion] = useState('')
  const [toast, setToast] = useState(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    let active = true
    setState('loading')

    getVisit(id)
      .then((data) => {
        if (!active) return
        setVisit(data)
        setState('ready')
      })
      .catch(() => {
        if (active) setState('error')
      })

    return () => {
      active = false
    }
  }, [id])

  const askRequest = useCallback(
    (signal) => askAboutVisit(visit?.transcript ?? '', question, { signal }),
    [visit, question],
  )
  const ask = useAICall(askRequest)

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  async function toggleTodo(index) {
    const todos = visit.todos.map((todo, todoIndex) =>
      todoIndex === index ? { ...todo, done: !todo.done } : todo,
    )
    const previous = visit
    setVisit({ ...visit, todos })

    try {
      await updateVisit(visit.id, { todos })
    } catch (caught) {
      setVisit(previous)
      setToast(caught.message)
    }
  }

  async function handleDelete() {
    try {
      await deleteVisit(visit.id)
      navigate('/app/history')
    } catch (caught) {
      setToast(caught.message)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(visitAsText(visit))
      setToast('Visit copied')
    } catch {
      setToast('Copying did not work. You can select the text instead.')
    }
  }

  if (state === 'loading') {
    return (
      <div className="vb-container pt-10">
        <p className="text-body text-muted" aria-live="polite">
          Opening this visit…
        </p>
      </div>
    )
  }

  if (state === 'error' || !visit) {
    return (
      <div className="vb-container pt-10">
        <h1 className="text-hero font-bold">That visit is not here</h1>
        <p className="mt-3 text-body text-muted">
          It may have been deleted, or the little server is not running.
        </p>
        <p className="mt-6">
          <Link to="/app/history" className="font-bold text-primary underline underline-offset-4">
            Back to History
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="vb-container max-w-4xl pt-10">
      <header className="border-b border-line pb-8">
        <h1 className="mt-4 font-display text-display font-semibold">{formatDate(visit.createdAt)}</h1>

        <div className="mt-6 flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            Copy
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            Print
          </Button>

          {confirming ? (
            <>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Yes, delete this visit
              </Button>
              <Button variant="quiet" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="quiet" size="sm" onClick={() => setConfirming(true)}>
              Delete
            </Button>
          )}
        </div>
      </header>

      {visit.concerns ? (
        <Section label="What was worrying you">
          <p className="max-w-measure text-body">{visit.concerns}</p>
        </Section>
      ) : null}

      {visit.questions?.length ? (
        <Section label="Your questions">
          <ol className="grid gap-3">
            {visit.questions.map((item, index) => (
              <li key={index} className="flex gap-4 border-t border-line pt-3 text-body">
                <span className="font-display text-subhead text-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <span className="block">{typeof item === 'string' ? item : item?.text}</span>
                  {typeof item === 'string' ? null : <QuoteLine quote={item?.quote} />}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {visit.summary?.length ? (
        <Section label="Summary">
          <ul className="grid gap-4">
            {visit.summary.map((line, index) => (
              <li key={index} className="rounded-card border border-line bg-surface p-5">
                <FlaggedLine flagged={line.flagged}>
                  <p className="text-body">{line.text}</p>
                  <QuoteLine quote={line.quote} />
                </FlaggedLine>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {visit.todos?.length ? (
        <Section label="To-do">
          <ul className="grid gap-3">
            {visit.todos.map((todo, index) => (
              <li key={index} className="flex items-start gap-4">
                <input
                  id={`todo-${index}`}
                  type="checkbox"
                  checked={Boolean(todo.done)}
                  onChange={() => toggleTodo(index)}
                  className="mt-2 h-6 w-6 shrink-0 accent-primary"
                />
                <label
                  htmlFor={`todo-${index}`}
                  className={`text-body ${todo.done ? 'text-muted line-through' : ''}`}
                >
                  {todo.text}
                </label>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {visit.meds?.length ? (
        <Section label="Medicines">
          <ul className="grid gap-4">
            {visit.meds.map((med, index) => (
              <li key={index}>
                <FlaggedLine flagged={med.needsCheck}>
                  <p className="text-body font-bold">
                    {med.name}
                    {med.dose ? ` · ${med.dose}` : ' · dose not clear'}
                  </p>
                  {med.time ? <p className="text-small text-muted">When: {med.time}</p> : null}
                  <QuoteLine quote={med.quote} />
                </FlaggedLine>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {visit.transcript ? (
        <Section label="What the doctor said">
          <p className="max-w-measure rounded-card border border-line bg-surface-2 p-6 text-body text-muted">
            {visit.transcript}
          </p>
        </Section>
      ) : null}

      {visit.transcript ? (
        <section className="mt-12 rounded-xl bg-navy p-6 text-paper md:p-8">
          <p className="text-small font-bold uppercase tracking-[0.14em] text-accent-bright">
            Ask about this visit
          </p>
          <h2 className="mt-3 font-display text-heading font-semibold">
            Answers only from these words.
          </h2>

          <label htmlFor="ask" className="mt-5 block text-small font-bold text-paper-muted">
            Your question
          </label>
          <input
            id="ask"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="mt-2 w-full rounded-full border border-white/20 bg-white/5 px-5 py-3 text-body text-paper placeholder:text-paper-muted"
          />

          <div className="mt-4">
            <Button
              onClick={ask.run}
              disabled={!question.trim() || ask.status === 'loading'}
              variant="onDark"
            >
              {ask.status === 'loading' ? 'Asking…' : 'Ask'}
            </Button>
          </div>

          {ask.status !== 'empty' ? (
            <div className="mt-6">
              <AIShell
                status={ask.status}
                error={ask.error}
                elapsed={ask.elapsed}
                steps={['Reading this visit', 'Finding the line']}
                loadingTitle="Looking in this visit"
                onCancel={ask.cancel}
                onRetry={ask.run}
                onReset={ask.reset}
              >
                {ask.data?.answer ? (
                  <div className="rounded-card border border-white/15 bg-white/5 p-5">
                    <p className="text-body text-paper">{ask.data.answer}</p>
                    <QuoteLine quote={ask.data.quote} />
                  </div>
                ) : null}
              </AIShell>
            </div>
          ) : null}
        </section>
      ) : null}

      <Toast message={toast} />
    </div>
  )
}
