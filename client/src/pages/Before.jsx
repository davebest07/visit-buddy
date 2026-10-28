import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AIShell, { useAICall } from '../components/AIShell.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import EditableList from '../components/EditableList.jsx'
import RecorderButton from '../components/RecorderButton.jsx'
import Toast from '../components/Toast.jsx'
import useUndo from '../hooks/useUndo.js'
import { buildQuestions, transcribe } from '../services/aiService.js'
import { createVisit } from '../services/api.js'

const EXAMPLES = [
  'My knee has been hurting for two weeks.',
  'I get dizzy when I stand up.',
  "I'm not sure my morning pill is working.",
]

const STEPS = ['Listening', 'Writing it in plain words', 'Checking each line against what you said']

export default function Before() {
  const navigate = useNavigate()

  const [concerns, setConcerns] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const {
    value: questions,
    setValue: setQuestions,
    undo,
    reset: resetQuestions,
    canUndo,
  } = useUndo(null)

  const request = useCallback((signal) => buildQuestions(concerns, { signal }), [concerns])
  const { status, data, error, elapsed, run, cancel, reset } = useAICall(request)

  useEffect(() => {
    if (Array.isArray(data)) resetQuestions(data.map((question) => ({ ...question })))
  }, [data, resetQuestions])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  async function handleAudio(blob) {
    setTranscribing(true)
    try {
      const text = await transcribe(blob)
      setConcerns(text)
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

  async function handleSave() {
    if (!questions?.length) return
    setSaving(true)
    try {
      const created = await createVisit({
        type: 'before',
        concerns,
        questions: questions.map((question) => question.text),
        approved: true,
      })
      navigate(`/app/visits/${created.id}`)
    } catch (caught) {
      setToast(caught.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy() {
    const text = questions.map((question, index) => `${index + 1}. ${question.text}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setToast('Questions copied')
    } catch {
      setToast('Copying did not work. You can select the text instead.')
    }
  }

  const busy = transcribing || status === 'loading'
  const step = status === 'empty' ? 1 : status === 'loading' ? 2 : 3

  return (
    <div className="vb-container max-w-5xl pt-10">
      <header>
        <h1 className="mt-4 max-w-[18ch] text-hero font-bold">What is worrying you?</h1>
        <p className="mt-3 max-w-measure text-body text-muted">
          Say it in your own words. One or two sentences is enough. You will get a short list of
          questions to ask the doctor.
        </p>
      </header>

      <ol className="mt-8 flex flex-wrap gap-2 text-small font-bold" aria-label="Steps">
        {['Your words', 'Checking', 'Your questions'].map((label, index) => {
          const active = step === index + 1
          const done = step > index + 1
          return (
            <li
              key={label}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 ${
                active
                  ? 'border-primary bg-primary-solid text-paper'
                  : done
                    ? 'border-line bg-primary-soft text-primary'
                    : 'border-line bg-surface text-muted'
              }`}
            >
              <span className="font-display">{done ? '✓' : `0${index + 1}`}</span>
              {label}
            </li>
          )
        })}
      </ol>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="grid lg:grid-cols-12">
          <div className="p-6 md:p-8 lg:col-span-7">
            <label htmlFor="concerns" className="text-subhead font-bold">
              Your worries
            </label>
            <p id="concerns-help" className="mt-1 text-small text-muted">
              Type here, or use the record button.
            </p>

            <textarea
              id="concerns"
              aria-describedby="concerns-help"
              value={concerns}
              onChange={(event) => setConcerns(event.target.value)}
              rows={5}
              placeholder="For example: my knee has been hurting for two weeks."
              className="mt-3 w-full resize-y rounded-card border border-line bg-canvas p-4 text-body text-ink placeholder:text-muted"
            />

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <RecorderButton onAudio={handleAudio} label="Record my worries" />
              {transcribing ? (
                <span className="text-small text-muted" aria-live="polite">
                  Turning your recording into words…
                </span>
              ) : null}
            </div>

            <div className="mt-5">
              <p className="text-small font-bold text-muted">Or try one of these</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setConcerns(example)}
                    className="min-h-tap rounded-full border border-line bg-surface px-4 py-2 text-left text-small text-ink transition-colors duration-fast hover:border-primary hover:text-primary"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Button onClick={run} disabled={!concerns.trim() || busy} magnetic>
                {busy ? 'Working…' : 'Get my questions'}
              </Button>
            </div>
          </div>

          <aside className="border-t border-line bg-surface-2 p-6 md:p-8 lg:col-span-5 lg:border-l lg:border-t-0">
            <p className="text-small font-bold uppercase tracking-[0.14em] text-accent">
              What you will get
            </p>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3 text-body">
                <span aria-hidden="true" className="text-primary">✦</span>
                A short, ordered list of questions.
              </li>
              <li className="flex gap-3 text-body">
                <span aria-hidden="true" className="text-primary">✦</span>
                The exact words each question came from.
              </li>
              <li className="flex gap-3 text-body">
                <span aria-hidden="true" className="text-primary">✦</span>
                Nothing saved until you tap Save.
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
            loadingTitle="Checking your worries"
            onCancel={cancel}
            onRetry={run}
            onTypeInstead={() => document.getElementById('concerns')?.focus()}
            onReset={reset}
          >
            {questions?.length ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="vb-eyebrow text-accent">Step 03</p>
                    <h2 className="mt-3 text-hero font-bold">Your questions</h2>
                  </div>
                  <p className="max-w-[34ch] text-small text-muted">
                    Edit any line. Nothing is saved until you tap Save.
                  </p>
                </div>

                <div className="mt-6">
                  <EditableList items={questions} onChange={setQuestions} label="Question" />
                </div>

                <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6">
                  <Button onClick={handleSave} disabled={saving} magnetic>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="secondary" onClick={() => window.print()}>
                    Print
                  </Button>
                  <Button variant="secondary" onClick={handleCopy}>
                    Copy
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="quiet" onClick={handleUndo} disabled={!canUndo}>
                    Undo
                  </Button>
                  <Button variant="quiet" onClick={run}>
                    Regenerate
                  </Button>
                  <Button variant="quiet" onClick={reset}>
                    Reject this list
                  </Button>
                </div>
              </>
            ) : null}
          </AIShell>
        </div>
      ) : null}

      <Toast message={toast} />
    </div>
  )
}
