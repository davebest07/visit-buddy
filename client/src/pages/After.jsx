import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AIShell, { useAICall } from '../components/AIShell.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import FlaggedLine from '../components/FlaggedLine.jsx'
import MedRow from '../components/MedRow.jsx'
import QuoteLine from '../components/QuoteLine.jsx'
import RecorderButton from '../components/RecorderButton.jsx'
import Tabs from '../components/Tabs.jsx'
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
    // If someone taps before the result is hydrated, save the raw data.
    const source =
      result.summary.length || result.todos.length || result.meds.length ? result : data ?? result

    setSaving(true)
    try {
      const created = await createVisit({
        type: 'after',
        transcript,
        summary: source.summary,
        todos: source.todos,
        meds: source.meds,
        flags: source.flags,
        approved: true,
      })
      navigate(`/app/visits/${created.id}`)
    } catch (caught) {
      setToast(caught.message)
    } finally {
      setSaving(false)
    }
  }

  const busy = transcribing || status === 'loading'

  return (
    <div className="vb-container max-w-5xl pt-10">
      <header>
        <p className="vb-eyebrow text-ember">After a visit</p>
        <h1 className="mt-4 max-w-[18ch] text-hero font-bold">What did the doctor say?</h1>
        <p className="mt-3 max-w-measure text-body text-muted">
          Record or type what you remember. You will see a plain summary, a to-do list and a
          medicine schedule, with the words behind each line.
        </p>
      </header>

      <Card className="mt-8 overflow-hidden p-0">
        <div className="grid lg:grid-cols-12">
          <div className="p-6 md:p-8 lg:col-span-7">
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
              rows={7}
              placeholder="For example: the doctor said my knee pain is probably from wear…"
              className="mt-3 w-full resize-y rounded-card border border-line bg-canvas p-4 text-body text-ink placeholder:text-muted"
            />

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <RecorderButton onAudio={handleAudio} label="Record the visit" />
              <Button variant="quiet" size="sm" onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}>
                Use the sample conversation
              </Button>
            </div>

            {transcribing ? (
              <p className="mt-2 text-small text-muted" aria-live="polite">
                Turning your recording into words…
              </p>
            ) : null}

            <div className="mt-6">
              <Button onClick={run} disabled={!transcript.trim() || busy} magnetic>
                {busy ? 'Working…' : 'Check what the doctor said'}
              </Button>
            </div>
          </div>

          <aside className="border-t border-line bg-surface-2 p-6 md:p-8 lg:col-span-5 lg:border-l lg:border-t-0">
            <p className="text-small font-bold uppercase tracking-[0.14em] text-ember">
              How it behaves
            </p>
            <ul className="mt-4 space-y-4 text-body">
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-evergreen">✦</span>
                Every line carries the words it came from.
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-evergreen">✦</span>
                Anything unclear says "ask your doctor or pharmacist".
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-evergreen">✦</span>
                Nothing is saved until you approve it.
              </li>
            </ul>

            <p className="mt-6 rounded-card border border-line bg-surface p-4 text-small text-muted">
              <strong className="text-ink">Demo only.</strong> Please do not enter real personal
              or medical information.
            </p>
          </aside>
        </div>
      </Card>

      {status !== 'empty' ? (
        <div className="mt-10">
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
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="vb-eyebrow text-ember">Step 03</p>
                <h2 className="mt-3 text-hero font-bold">Check this before you save</h2>
              </div>
              <p className="max-w-[32ch] text-small text-muted">
                Nothing is saved until you tap Approve and save.
              </p>
            </div>

            <div className="mt-6">
              <Tabs tabs={TABS} value={tab} onChange={setTab} label="Visit result" />
            </div>

            <div
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              className="mt-8"
            >
              {tab === 'summary' ? (
                <>
                  {result.summary.length === 0 ? (
                    <p className="text-body text-muted">No summary lines.</p>
                  ) : (
                    <ul className="border-t border-line">
                      {result.summary.map((line, index) => (
                        <li key={index} className="border-b border-line py-6">
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
                              className="w-full resize-y border-0 bg-transparent p-0 text-subhead text-ink focus:outline-none"
                            />
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
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
                    <div className="mt-8 rounded-card bg-sand p-6">
                      <h3 className="text-subhead font-bold">Needs checking</h3>
                      <ul className="mt-3 space-y-2">
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
                  <ul className="grid gap-4">
                    {result.todos.map((todo, index) => (
                      <li
                        key={index}
                        className="flex gap-4 rounded-card border border-line bg-surface p-5"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(todo.done)}
                          onChange={(event) => updateTodo(index, { done: event.target.checked })}
                          id={`todo-done-${index}`}
                          className="mt-2 h-6 w-6 shrink-0 accent-evergreen"
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
                            className="w-full resize-y border-0 bg-transparent p-0 text-body text-ink focus:outline-none"
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

            <div className="mt-10 rounded-xl bg-night p-6 text-cream md:p-8">
              <p className="text-small font-bold uppercase tracking-[0.14em] text-ember-bright">
                Final step
              </p>
              <h3 className="mt-2 font-display text-heading font-semibold">
                Happy with it? Save it to this visit.
              </h3>
              <div className="mt-5">
                <Button onClick={handleApprove} disabled={saving} variant="onDark" magnetic>
                  {saving ? 'Saving…' : 'Approve and save'}
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="min-h-tap text-small font-bold text-cream-muted underline underline-offset-4 disabled:opacity-50"
                >
                  Undo
                </button>
                <button
                  type="button"
                  onClick={run}
                  className="min-h-tap text-small font-bold text-cream-muted underline underline-offset-4"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="min-h-tap text-small font-bold text-cream-muted underline underline-offset-4"
                >
                  Reject this result
                </button>
              </div>
            </div>
          </AIShell>
        </div>
      ) : null}

      <Toast message={toast} />
    </div>
  )
}
