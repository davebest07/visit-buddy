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

const EXAMPLE_QUESTIONS = ['What did she say about my knee?', 'When is my next visit?']

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'long',
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
    visit.questions.forEach((question, index) => lines.push(`${index + 1}. ${question}`))
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
      <div className="vb-container py-8">
        <p className="text-body text-muted" aria-live="polite">
          Opening this visit…
        </p>
      </div>
    )
  }

  if (state === 'error' || !visit) {
    return (
      <div className="vb-container py-8">
        <h1 className="text-hero font-bold">That visit is not here</h1>
        <p className="mt-2 text-body text-muted">
          It may have been deleted, or the little server is not running.
        </p>
        <p className="mt-6">
          <Link to="/app/history" className="font-bold text-accent underline underline-offset-4">
            Back to History
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="vb-container py-8">
      <p className="text-small font-bold uppercase tracking-widest text-accent">
        {visit.type === 'before' ? 'Before a visit' : 'After a visit'}
      </p>
      <h1 className="mt-2 text-hero font-bold">{formatDate(visit.createdAt)}</h1>

      {visit.concerns ? (
        <Card className="mt-6">
          <h2 className="text-subhead font-bold">What was worrying you</h2>
          <p className="mt-2 text-body">{visit.concerns}</p>
        </Card>
      ) : null}

      {visit.questions?.length ? (
        <section className="mt-8">
          <h2 className="text-heading font-bold">Your questions</h2>
          <ol className="mt-4 space-y-2">
            {visit.questions.map((question, index) => (
              <li key={index} className="flex gap-4 text-body">
                <span className="font-bold text-accent">{index + 1}</span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {visit.summary?.length ? (
        <section className="mt-8">
          <h2 className="text-heading font-bold">Summary</h2>
          <ul className="mt-4 space-y-4">
            {visit.summary.map((line, index) => (
              <li key={index}>
                <FlaggedLine flagged={line.flagged}>
                  <p className="text-body">{line.text}</p>
                  <QuoteLine quote={line.quote} />
                </FlaggedLine>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {visit.todos?.length ? (
        <section className="mt-8">
          <h2 className="text-heading font-bold">To-do</h2>
          <ul className="mt-4 space-y-2">
            {visit.todos.map((todo, index) => (
              <li key={index} className="flex items-start gap-4">
                <input
                  id={`todo-${index}`}
                  type="checkbox"
                  checked={Boolean(todo.done)}
                  onChange={() => toggleTodo(index)}
                  className="mt-2 h-6 w-6 shrink-0 accent-accent"
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
        </section>
      ) : null}

      {visit.meds?.length ? (
        <section className="mt-8">
          <h2 className="text-heading font-bold">Medicines</h2>
          <ul className="mt-4 space-y-4">
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
        </section>
      ) : null}

      {visit.transcript ? (
        <section className="mt-8">
          <h2 className="text-heading font-bold">What the doctor said</h2>
          <p className="mt-2 max-w-measure rounded border border-line bg-surface p-4 text-body text-muted">
            {visit.transcript}
          </p>
        </section>
      ) : null}

      {visit.transcript ? (
        <section className="mt-8">
          <h2 className="text-heading font-bold">Ask about this visit</h2>
          <p className="mt-2 max-w-measure text-body text-muted">
            It answers only from the words above, and shows the line it used.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuestion(example)}
                className="min-h-tap rounded border border-line bg-surface px-4 py-2 text-left text-small hover:border-accent hover:bg-accent-soft"
              >
                {example}
              </button>
            ))}
          </div>

          <label htmlFor="ask" className="mt-4 block text-small font-bold">
            Your question
          </label>
          <input
            id="ask"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="mt-2 w-full rounded border border-line bg-surface p-4 text-body"
          />

          <div className="mt-4">
            <Button onClick={ask.run} disabled={!question.trim() || ask.status === 'loading'}>
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
                  <Card>
                    <p className="text-body">{ask.data.answer}</p>
                    <QuoteLine quote={ask.data.quote} />
                  </Card>
                ) : null}
              </AIShell>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6 print:hidden">
        <Button variant="secondary" onClick={handleCopy}>
          Copy
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>

        {confirming ? (
          <>
            <Button variant="danger" onClick={handleDelete}>
              Yes, delete this visit
            </Button>
            <Button variant="quiet" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="quiet" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        )}
      </div>

      <Toast message={toast} />
    </div>
  )
}
