import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AIShell, { useAICall } from '../components/AIShell.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import FlaggedLine from '../components/FlaggedLine.jsx'
import MedRow from '../components/MedRow.jsx'
import QuoteLine from '../components/QuoteLine.jsx'
import RecorderButton from '../components/RecorderButton.jsx'
import Toast from '../components/Toast.jsx'
import useUndo from '../hooks/useUndo.js'
import { SAMPLE_TRANSCRIPT, summarizeVisit, transcribe } from '../services/aiService.js'
import { createVisit } from '../services/api.js'

const STEPS = ['Listening', 'Writing it in plain words', 'Checking each line against what you said']

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'todos', label: 'To-do' },
  { id: 'meds', label: 'Medicines' },
]

const EMPTY_RESULT = { summary: [], todos: [], meds: [], flags: [] }

export default function After() {
  const navigate = useNavigate()

  const [transcript, setTranscript] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [tab, setTab] = useState('summary')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const tabRefs = useRef([])

  const {
    value: result,
    setValue: setResult,
    undo,
    reset: resetResult,
    canUndo,
  } = useUndo(EMPTY_RESULT)

  const request = useCallback((signal) => summarizeVisit(transcript, { signal }), [transcript])
  const { status, data, error, elapsed, run, cancel, reset } = useAICall(request)

  useEffect(() => {
    if (data && !Array.isArray(data)) {
      resetResult({
        summary: (data.summary ?? []).map((line) => ({ ...line })),
        todos: (data.todos ?? []).map((todo) => ({ ...todo })),
        meds: (data.meds ?? []).map((med) => ({ ...med })),
        flags: (data.flags ?? []).map((flag) => ({ ...flag })),
      })
    }
  }, [data, resetResult])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  async function handleAudio(blob) {
    setTranscribing(true)
    try {
      const text = await transcribe(blob)
      setTranscript(text)
      setToast('Recording turned into words. Check it before you continue.')
    } catch {
      setToast('That recording could not be turned into words. You can type instead.')
    } finally {
      setTranscribing(false)
    }
  }

  function handleUndo() {
    if (undo()) setToast('Change undone')
  }

  function updateSummary(index, patch) {
    setResult({
      ...result,
      summary: result.summary.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    })
  }

  function removeSummary(index) {
    setResult({ ...result, summary: result.summary.filter((_, i) => i !== index) })
  }

  function updateTodo(index, patch) {
    setResult({
      ...result,
      todos: result.todos.map((todo, todoIndex) =>
        todoIndex === index ? { ...todo, ...patch } : todo,
      ),
    })
  }

  function removeTodo(index) {
    setResult({ ...result, todos: result.todos.filter((_, i) => i !== index) })
  }

  function updateMed(index, patch) {
    setResult({
      ...result,
      meds: result.meds.map((med, medIndex) =>
        medIndex === index ? { ...med, ...patch } : med,
      ),
    })
  }

  async function handleApprove() {
    setSaving(true)
    try {
      const created = await createVisit({
        type: 'after',
        transcript,
        summary: result.summary,
        todos: result.todos,
        meds: result.meds,
        flags: result.flags,
        approved: true,
      })
      navigate(`/app/visits/${created.id}`)
    } catch (caught) {
      setToast(caught.message)
    } finally {
      setSaving(false)
    }
  }

  function handleTabKey(event, index) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % TABS.length
        : (index - 1 + TABS.length) % TABS.length
    setTab(TABS[next].id)
    tabRefs.current[next]?.focus()
  }

  const busy = transcribing || status === 'loading'

  return (
    <div className="vb-container py-8">
      <p className="text-small font-bold uppercase tracking-widest text-accent">After a visit</p>
      <h1 className="mt-2 text-hero font-bold">What did the doctor say?</h1>
      <p className="mt-2 max-w-measure text-body text-muted">
        Record or type what you remember. You will see a plain summary, a to-do list and a
        medicine schedule, with the words behind each line.
      </p>

      <Card className="mt-6">
        <label htmlFor="transcript" className="text-subhead font-bold">
          What the doctor said
        </label>
        <p id="transcript-help" className="mt-1 text-small text-muted">
          Only record with permission.
        </p>

        <textarea
          id="transcript"
          aria-describedby="transcript-help"
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={6}
          placeholder="For example: the doctor said my knee pain is probably from wear…"
          className="mt-2 w-full rounded border border-line bg-background p-4 text-body text-ink"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <RecorderButton onAudio={handleAudio} label="Record the visit" />
          <Button variant="quiet" onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}>
            Use the sample conversation
          </Button>
        </div>

        {transcribing ? (
          <p className="mt-2 text-small text-muted" aria-live="polite">
            Turning your recording into words…
          </p>
        ) : null}

        <p className="mt-4 text-small text-muted">
          <strong className="text-ink">Demo only.</strong> Please do not enter real personal or
          medical information.
        </p>

        <div className="mt-6">
          <Button onClick={run} disabled={!transcript.trim() || busy}>
            {busy ? 'Working…' : 'Check what the doctor said'}
          </Button>
        </div>
      </Card>

      {status !== 'empty' ? (
        <div className="mt-8">
          <AIShell
            status={status}
            error={error}
            elapsed={elapsed}
            steps={STEPS}
            loadingTitle="Writing up the visit"
            onCancel={cancel}
            onRetry={run}
            onTypeInstead={() => document.getElementById('transcript')?.focus()}
            onReset={reset}
          >
            <h2 className="text-hero font-bold">Check this before you save</h2>
            <p className="mt-2 max-w-measure text-body text-muted">
              Every line shows the words it came from. Nothing is saved until you tap Approve
              and save.
            </p>

            <div
              role="tablist"
              aria-label="Visit result"
              className="mt-6 flex gap-2 border-b border-line"
            >
              {TABS.map((entry, index) => (
                <button
                  key={entry.id}
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  role="tab"
                  id={`tab-${entry.id}`}
                  aria-selected={tab === entry.id}
                  aria-controls={`panel-${entry.id}`}
                  tabIndex={tab === entry.id ? 0 : -1}
                  onClick={() => setTab(entry.id)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                  className={`min-h-tap px-4 py-2 text-body font-bold ${
                    tab === entry.id
                      ? 'border-b-4 border-accent text-accent'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              className="mt-6"
            >
              {tab === 'summary' ? (
                <>
                  {result.summary.length === 0 ? (
                    <p className="text-body text-muted">No summary lines.</p>
                  ) : (
                    <ul className="space-y-4">
                      {result.summary.map((line, index) => (
                        <li key={index}>
                          <FlaggedLine flagged={line.flagged}>
                            <label htmlFor={`summary-${index}`} className="sr-only">
                              Summary line {index + 1}
                            </label>
                            <textarea
                              id={`summary-${index}`}
                              value={line.text}
                              rows={2}
                              onChange={(event) =>
                                updateSummary(index, { text: event.target.value })
                              }
                              className="w-full rounded border border-line bg-background p-2 text-body"
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <QuoteLine quote={line.quote} />
                              <button
                                type="button"
                                onClick={() => removeSummary(index)}
                                className="min-h-tap px-2 text-small font-bold text-error underline underline-offset-4"
                              >
                                Remove
                              </button>
                            </div>
                          </FlaggedLine>
                        </li>
                      ))}
                    </ul>
                  )}

                  {result.flags.length > 0 ? (
                    <div className="mt-6 rounded border border-line bg-surface p-4">
                      <h3 className="text-subhead font-bold">Needs checking</h3>
                      <ul className="mt-2 space-y-2">
                        {result.flags.map((flag) => (
                          <li key={flag.line} className="text-body">
                            <strong>{flag.line}:</strong> {flag.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : null}

              {tab === 'todos' ? (
                result.todos.length === 0 ? (
                  <p className="text-body text-muted">No to-dos.</p>
                ) : (
                  <ul className="space-y-4">
                    {result.todos.map((todo, index) => (
                      <li
                        key={index}
                        className="flex gap-4 rounded border border-line bg-surface p-4"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(todo.done)}
                          onChange={(event) => updateTodo(index, { done: event.target.checked })}
                          id={`todo-done-${index}`}
                          className="mt-2 h-6 w-6 shrink-0 accent-accent"
                        />
                        <div className="min-w-0 flex-1">
                          <label htmlFor={`todo-text-${index}`} className="sr-only">
                            To-do {index + 1}
                          </label>
                          <textarea
                            id={`todo-text-${index}`}
                            value={todo.text}
                            rows={2}
                            onChange={(event) => updateTodo(index, { text: event.target.value })}
                            className="w-full rounded border border-line bg-background p-2 text-body"
                          />
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <QuoteLine quote={todo.quote} />
                            <button
                              type="button"
                              onClick={() => removeTodo(index)}
                              className="min-h-tap px-2 text-small font-bold text-error underline underline-offset-4"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}

              {tab === 'meds' ? (
                result.meds.length === 0 ? (
                  <p className="text-body text-muted">No medicines were mentioned.</p>
                ) : (
                  <ul className="space-y-4">
                    {result.meds.map((med, index) => (
                      <MedRow
                        key={`${med.name}-${index}`}
                        med={med}
                        onChange={(patch) => updateMed(index, patch)}
                      />
                    ))}
                  </ul>
                )
              ) : null}
            </div>

            <div className="mt-8 border-t border-line pt-6">
              <Button onClick={handleApprove} disabled={saving}>
                {saving ? 'Saving…' : 'Approve and save'}
              </Button>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="quiet" onClick={handleUndo} disabled={!canUndo}>
                  Undo
                </Button>
                <Button variant="quiet" onClick={run}>
                  Regenerate
                </Button>
                <Button variant="quiet" onClick={reset}>
                  Reject this result
                </Button>
              </div>
            </div>
          </AIShell>
        </div>
      ) : null}

      <Toast message={toast} />
    </div>
  )
}
