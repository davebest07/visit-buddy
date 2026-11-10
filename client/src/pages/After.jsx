import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AIShell, { useAICall } from '../components/AIShell.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import FlaggedLine from '../components/FlaggedLine.jsx'
import MedRow from '../components/MedRow.jsx'
import QuoteLine from '../components/QuoteLine.jsx'
import LiveTranscriber from '../components/LiveTranscriber.jsx'
import ScanPaper from '../components/ScanPaper.jsx'
import Tabs from '../components/Tabs.jsx'
import Toast from '../components/Toast.jsx'
import useUndo from '../hooks/useUndo.js'
import { SAMPLE_TRANSCRIPT, findUnclear, summarizeVisit } from '../services/aiService.js'
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
  const [listening, setListening] = useState(false)
  const [scanning, setScanning] = useState(false)
  // How the words got in the box: "typed", "recording" or "scan". Saved on the visit.
  const [source, setSource] = useState('typed')
  const [tab, setTab] = useState('summary')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const {
    value: result,
    setValue: setResult,
    endGroup,
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

  // The spoken words join whatever is already typed, then the box gets focus
  // so mistakes can be fixed before continuing.
  function handleSpoken(text) {
    setSource('recording')
    setTranscript((current) => (current.trim() ? `${current.trim()} ${text}` : text))
    setToast('Your words are in the box. Fix anything that is wrong before you continue.')
    requestAnimationFrame(() => document.getElementById('transcript')?.focus())
  }

  // Words read from a photo go in the same box, to be checked before anything
  // is summarized. The photo itself is never kept.
  const handleScanned = useCallback((text) => {
    setSource('scan')
    setTranscript((current) => (current.trim() ? `${current.trim()}\n\n${text}` : text))
    setToast('The words from your photo are in the box. Check them against your paper.')
    requestAnimationFrame(() => document.getElementById('transcript')?.focus())
  }, [])

  function handleUndo() {
    if (undo()) setToast('Change undone')
  }

  // Typing passes a group (one field), so Undo takes back the whole edit.
  // Removing a line or ticking a box is its own step.
  function updateSummary(index, patch) {
    setResult(
      (current) => ({
        ...current,
        summary: current.summary.map((line, lineIndex) =>
          lineIndex === index ? { ...line, ...patch } : line,
        ),
      }),
      { group: `summary:${index}` },
    )
  }

  function removeSummary(index) {
    setResult((current) => ({ ...current, summary: current.summary.filter((_, i) => i !== index) }))
  }

  function updateTodo(index, patch, group) {
    setResult(
      (current) => ({
        ...current,
        todos: current.todos.map((todo, todoIndex) =>
          todoIndex === index ? { ...todo, ...patch } : todo,
        ),
      }),
      { group },
    )
  }

  function removeTodo(index) {
    setResult((current) => ({ ...current, todos: current.todos.filter((_, i) => i !== index) }))
  }

  function updateMed(index, patch) {
    setResult(
      (current) => ({
        ...current,
        meds: current.meds.map((med, medIndex) =>
          medIndex === index ? { ...med, ...patch } : med,
        ),
      }),
      { group: `med:${index}:${Object.keys(patch).join(',')}` },
    )
  }

  async function handleApprove() {
    // If someone taps before the result is hydrated, save the raw data.
    const saved =
      result.summary.length || result.todos.length || result.meds.length ? result : data ?? result
    const wordsFrom = source

    setSaving(true)
    try {
      const created = await createVisit({
        type: 'after',
        transcript,
        source: wordsFrom,
        summary: saved.summary,
        todos: saved.todos,
        meds: saved.meds,
        flags: saved.flags,
        approved: true,
      })
      navigate(`/app/visits/${created.id}`)
    } catch (caught) {
      setToast(caught.message)
    } finally {
      setSaving(false)
    }
  }

  const busy = listening || scanning || status === 'loading'
  const fromPhoto = source === 'scan'
  const quoteFrom = fromPhoto ? 'From your photo' : null
  const unclearLines = fromPhoto ? findUnclear(transcript) : []

  return (
    <div className="vb-container max-w-5xl pt-10">
      <header>
        <h1 className="mt-4 max-w-[18ch] text-hero font-bold">What did the doctor say?</h1>
        <p className="mt-3 max-w-measure text-body text-muted">
          Record or type what you remember, or scan the paper you were given. You will see a
          plain summary, a to-do list and a medicine schedule, with the words behind each line.
        </p>
      </header>

      <Card className="mt-8 overflow-hidden p-0">
        <div className="grid lg:grid-cols-12">
          <div className="p-6 md:p-8 lg:col-span-7">
            <label htmlFor="transcript" className="text-subhead font-bold">
              {fromPhoto ? 'From your photo' : 'What the doctor said'}
            </label>
            <p id="transcript-help" className="mt-1 text-small text-muted">
              {fromPhoto
                ? 'Check this against your paper and fix anything that is wrong.'
                : 'Type what you remember, tap the microphone and talk, or scan a paper.'}
            </p>

            <textarea
              id="transcript"
              aria-describedby="transcript-help"
              value={transcript}
              onChange={(event) => {
                setTranscript(event.target.value)
                if (!event.target.value.trim()) setSource('typed')
              }}
              rows={7}
              placeholder="For example: the doctor said my knee pain is probably from wear…"
              className="mt-3 w-full resize-y rounded-card border border-line bg-canvas p-4 text-body text-ink placeholder:text-muted"
            />

            {unclearLines.length ? (
              <div className="mt-3 rounded-card border-2 border-uncertain bg-uncertain p-4 text-uncertain-ink">
                <p className="text-small font-bold">
                  {unclearLines.length === 1
                    ? 'One line was hard to read.'
                    : `${unclearLines.length} lines were hard to read.`}{' '}
                  Check them against your paper, fix the words, and delete the [unclear: …] mark.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-small">
                  {unclearLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-4">
              <LiveTranscriber
                label="Record the visit"
                note="Ask your doctor before recording."
                onFinish={handleSpoken}
                onListeningChange={setListening}
              />
            </div>

            <div className="mt-6 border-t border-line pt-6">
              <ScanPaper
                onRead={handleScanned}
                onBusyChange={setScanning}
                onTypeInstead={() => document.getElementById('transcript')?.focus()}
                disabled={listening || status === 'loading'}
              />
            </div>

            <div className="mt-4">
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  setTranscript(SAMPLE_TRANSCRIPT)
                  setSource('typed')
                }}
                disabled={listening || scanning}
              >
                Use the sample conversation
              </Button>
            </div>

            <div className="mt-6">
              <Button onClick={run} disabled={!transcript.trim() || busy} magnetic>
                {status === 'loading' ? 'Working…' : 'Check what the doctor said'}
              </Button>
            </div>
          </div>

          <aside className="border-t border-line bg-surface-2 p-6 md:p-8 lg:col-span-5 lg:border-l lg:border-t-0">
            <p className="text-small font-bold uppercase tracking-[0.14em] text-accent">
              How it behaves
            </p>
            <ul className="mt-4 space-y-4 text-body">
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-primary">✦</span>
                Every line carries the words it came from.
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-primary">✦</span>
                Anything unclear says "ask your doctor or pharmacist".
              </li>
              <li className="flex gap-3">
                <span aria-hidden="true" className="text-primary">✦</span>
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
            {/* Leaving a field ends that edit, so Undo takes back the whole edit. */}
            <div onBlur={endGroup}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="vb-eyebrow text-accent">Step 03</p>
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
                                <QuoteLine quote={line.quote} from={quoteFrom} />
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
                      <div className="mt-8 rounded-card bg-tint-sky p-6">
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
                            className="mt-2 h-6 w-6 shrink-0 accent-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <label htmlFor={`todo-text-${index}`} className="sr-only">
                              To-do {index + 1}
                            </label>
                            <textarea
                              id={`todo-text-${index}`}
                              value={todo.text}
                              rows={2}
                              onChange={(event) =>
                                updateTodo(index, { text: event.target.value }, `todo:${index}`)
                              }
                              className="w-full resize-y border-0 bg-transparent p-0 text-body text-ink focus:outline-none"
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <QuoteLine quote={todo.quote} from={quoteFrom} />
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
                          quoteFrom={quoteFrom}
                        />
                      ))}
                    </ul>
                  )
                ) : null}
              </div>

              <div className="mt-10 rounded-xl bg-navy p-6 text-paper md:p-8">
                <p className="text-small font-bold uppercase tracking-[0.14em] text-accent-bright">
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
                    className="min-h-tap text-small font-bold text-paper-muted underline underline-offset-4 disabled:opacity-50"
                  >
                    Undo
                  </button>
                  <button
                    type="button"
                    onClick={run}
                    className="min-h-tap text-small font-bold text-paper-muted underline underline-offset-4"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="min-h-tap text-small font-bold text-paper-muted underline underline-offset-4"
                  >
                    Reject this result
                  </button>
                </div>
              </div>
            </div>
          </AIShell>
        </div>
      ) : null}

      <Toast message={toast} />
    </div>
  )
}
