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

  // A fresh result replaces the list and clears the undo history.
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

  return (
    <div className="vb-container py-8">
      <p className="text-small font-bold uppercase tracking-widest text-accent">Before a visit</p>
      <h1 className="mt-2 text-hero font-bold">What is worrying you?</h1>
      <p className="mt-2 max-w-measure text-body text-muted">
        Say it in your own words. One or two sentences is enough. You will get a short list of
        questions to ask the doctor.
      </p>

      <Card className="mt-6">
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
          rows={4}
          placeholder="For example: my knee has been hurting for two weeks."
          className="mt-2 w-full rounded border border-line bg-background p-4 text-body text-ink"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <RecorderButton onAudio={handleAudio} label="Record my worries" />
          {transcribing ? (
            <span className="text-small text-muted" aria-live="polite">
              Turning your recording into words…
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <p className="text-small font-bold text-muted">Or try one of these</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setConcerns(example)}
                className="min-h-tap rounded border border-line bg-surface px-4 py-2 text-left text-small text-ink hover:border-accent hover:bg-accent-soft"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-small text-muted">
          <strong className="text-ink">Demo only.</strong> Please do not enter real personal or
          medical information.
        </p>

        <div className="mt-6">
          <Button onClick={run} disabled={!concerns.trim() || busy}>
            {busy ? 'Working…' : 'Get my questions'}
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
            loadingTitle="Checking your worries"
            onCancel={cancel}
            onRetry={run}
            onTypeInstead={() => document.getElementById('concerns')?.focus()}
            onReset={reset}
          >
            {questions?.length ? (
              <>
                <h2 className="text-hero font-bold">Your questions</h2>
                <p className="mt-2 max-w-measure text-body text-muted">
                  Edit any line. Nothing is saved until you tap Save.
                </p>

                <div className="mt-4">
                  <EditableList items={questions} onChange={setQuestions} label="Question" />
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={handleSave} disabled={saving}>
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
