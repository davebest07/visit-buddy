import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AIShell, { useAICall } from '../components/AIShell.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import CrisisLineBanner from '../components/CrisisLineBanner.jsx'
import EditableList from '../components/EditableList.jsx'
import EmergencyCard from '../components/EmergencyCard.jsx'
import GuidedInterview from '../components/GuidedInterview.jsx'
import LiveTranscriber from '../components/LiveTranscriber.jsx'
import StepHeader from '../components/StepHeader.jsx'
import Toast from '../components/Toast.jsx'
import useUndo from '../hooks/useUndo.js'
import { buildQuestions, interviewQuestions } from '../services/aiService.js'
import { createVisit, findQuestionChunks } from '../services/api.js'
import { crisisLineWanted, dismissRedFlag, findRedFlag } from '../services/redFlags.js'

const EXAMPLES = [
  'My knee has been hurting for two weeks.',
  'I get dizzy when I stand up.',
  "I'm not sure my morning pill is working.",
]

const STEP_LABELS = ['Describe', 'A few questions', 'Your questions']

const FINDING_STEPS = ['Reading what you wrote', 'Finding questions a doctor may ask', 'Putting them in order']
const BUILDING_STEPS = ['Reading your answers', 'Choosing questions to ask', 'Checking each line against your words']

const HOW_IT_WORKS = [
  ['Tell us what is worrying you', 'Type it or say it. A sentence or two is enough.'],
  ['Answer a few short questions', 'Three to five, one at a time. Skip any you like.'],
  ['Take your list to the visit', 'Questions to ask, and what to tell your doctor.'],
]

function listAsText(result) {
  const lines = ['Questions to ask']
  result.questions.forEach((item, index) => lines.push(`${index + 1}. ${item.text}`))
  if (result.tellDoctor.length) {
    lines.push('', 'What to tell your doctor')
    result.tellDoctor.forEach((item) => lines.push(`- ${item.text}`))
  }
  return lines.join('\n')
}

export default function Before() {
  const navigate = useNavigate()

  const [concerns, setConcerns] = useState('')
  const [listening, setListening] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // describe -> interview -> result. A red flag stops the flow at any point.
  const [stage, setStage] = useState('describe')
  const [redFlag, setRedFlag] = useState(null)
  const [showCrisisLine, setShowCrisisLine] = useState(crisisLineWanted)
  const [steps, setSteps] = useState([])
  const [answers, setAnswers] = useState([])
  const [interviewStart, setInterviewStart] = useState(0)
  const [interviewRun, setInterviewRun] = useState(0)

  // Read when the questions are built, so the request never sees stale values.
  const chunksRef = useRef([])
  const answersRef = useRef([])
  const resultHeadingRef = useRef(null)

  const {
    value: result,
    setValue: setResult,
    endGroup,
    undo,
    reset: resetResult,
    canUndo,
  } = useUndo(null)

  const findRequest = useCallback(
    async (signal) => {
      const chunks = await findQuestionChunks(concerns, { signal })
      const { steps: found } = await interviewQuestions(concerns, chunks, [], { signal })
      return { steps: found, chunks }
    },
    [concerns],
  )
  const finding = useAICall(findRequest)

  const buildRequest = useCallback(
    (signal) =>
      buildQuestions(concerns, { signal, chunks: chunksRef.current, answers: answersRef.current }),
    [concerns],
  )
  const building = useAICall(buildRequest)
  const runBuild = building.run

  const startBuilding = useCallback(
    (list) => {
      answersRef.current = list
      setAnswers(list)
      setStage('result')
      runBuild()
    },
    [runBuild],
  )

  // The interview questions arrived: ask them, or go straight to the list.
  useEffect(() => {
    const data = finding.data
    if (!data) return
    chunksRef.current = data.chunks
    if (data.steps.length) {
      setSteps(data.steps)
      setAnswers([])
      setInterviewStart(0)
      setInterviewRun((count) => count + 1)
      setStage('interview')
    } else {
      startBuilding([])
    }
  }, [finding.data, startBuilding])

  useEffect(() => {
    const data = building.data
    if (!data?.questions) return
    resetResult({
      questions: data.questions.map((item) => ({ ...item })),
      tellDoctor: data.tellDoctor.map((item) => ({ ...item })),
    })
  }, [building.data, resetResult])

  // Move focus to the list when it is ready.
  useEffect(() => {
    if (building.status === 'success' || building.status === 'uncertain') {
      document.getElementById('before-steps')?.scrollIntoView({ block: 'start', behavior: 'instant' })
      resultHeadingRef.current?.focus({ preventScroll: true })
    }
  }, [building.status])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  function focusConcerns() {
    requestAnimationFrame(() => document.getElementById('concerns')?.focus())
  }

  // The spoken words join whatever is already typed, then the box gets focus
  // so mistakes can be fixed before continuing.
  function handleSpoken(text) {
    setConcerns((current) => (current.trim() ? `${current.trim()} ${text}` : text))
    setToast('Your words are in the box. Fix anything that is wrong before you continue.')
    focusConcerns()
  }

  // Red flags are checked before anything is searched.
  function handleContinue() {
    const flag = findRedFlag(concerns)
    if (flag) {
      setRedFlag(flag)
      return
    }
    setRedFlag(null)
    building.reset()
    finding.run()
  }

  // "No, continue" on the card: remember it for this phrase, keep their
  // words, and carry on (the next flag, if any, is asked about first).
  function handleFlagContinue(flag) {
    dismissRedFlag(flag)
    setShowCrisisLine(crisisLineWanted())
    handleContinue()
  }

  function backToDescribe() {
    setRedFlag(null)
    finding.reset()
    building.reset()
    setStage('describe')
    focusConcerns()
  }

  function handleChangeAnswers() {
    building.reset()
    setInterviewStart(Math.max(steps.length - 1, 0))
    setInterviewRun((count) => count + 1)
    setStage(steps.length ? 'interview' : 'describe')
  }

  function handleUndo() {
    if (undo()) setToast('Change undone')
  }

  async function handleSave() {
    if (!result?.questions.length) return
    setSaving(true)
    try {
      const created = await createVisit({
        type: 'before',
        concerns,
        questions: result.questions.map((item) => item.text),
        summary: result.tellDoctor.map(({ text, quote }) => ({ text, quote })),
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
    try {
      await navigator.clipboard.writeText(listAsText(result))
      setToast('Copied')
    } catch {
      setToast('Copying did not work. You can select the text instead.')
    }
  }

  const busy = listening || finding.status === 'loading'
  const currentStep = stage === 'describe' ? 1 : stage === 'interview' ? 2 : 3

  return (
    <div className="vb-container max-w-5xl pt-10">
      {/* On the finished list the line sits under "Your questions" instead. */}
      {showCrisisLine && !(stage === 'result' && result?.questions.length) ? (
        <CrisisLineBanner className="mb-6" />
      ) : null}

      <header className="print:hidden">
        <p className="vb-eyebrow text-accent">Before a visit</p>
        <h1 className="mt-4 max-w-[18ch] text-hero font-bold">What is worrying you?</h1>
        <p className="mt-3 max-w-measure text-body text-muted">
          Say it in your own words. We ask a few short questions, then give you a list to take to
          the doctor.
        </p>
      </header>

      <StepHeader
        id="before-steps"
        steps={STEP_LABELS}
        current={currentStep}
        className="mt-8 print:hidden"
      />

      {redFlag ? (
        <div className="mt-6">
          <EmergencyCard flag={redFlag} onContinue={handleFlagContinue} />
        </div>
      ) : null}

      {stage === 'describe' ? (
        <>
          <Card className="mt-6 overflow-hidden p-0">
            <div className="grid lg:grid-cols-12">
              <div className="p-6 md:p-8 lg:col-span-7">
                <label htmlFor="concerns" className="text-subhead font-bold">
                  Your worries
                </label>
                <p id="concerns-help" className="mt-1 text-small text-muted">
                  Type here, or tap the microphone and talk. Your words appear as you speak.
                </p>

                <textarea
                  id="concerns"
                  aria-describedby="concerns-help"
                  value={concerns}
                  onChange={(event) => {
                    setConcerns(event.target.value)
                    setRedFlag(null)
                  }}
                  rows={5}
                  placeholder="For example: my knee has been hurting for two weeks."
                  className="mt-3 w-full resize-y rounded-card border border-line bg-canvas p-4 text-body text-ink placeholder:text-muted"
                />

                <div className="mt-4">
                  <LiveTranscriber
                    label="Record my worries"
                    onFinish={handleSpoken}
                    onListeningChange={setListening}
                  />
                </div>

                {!concerns.trim() ? (
                  <div className="mt-5">
                    <p className="text-small font-bold text-muted">Not sure how to start? Try one</p>
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
                ) : null}

                <div className="mt-6">
                  <Button onClick={handleContinue} disabled={!concerns.trim() || busy} magnetic>
                    {finding.status === 'loading' ? 'Working…' : 'Continue'}
                  </Button>
                </div>
              </div>

              <aside className="border-t border-line bg-surface-2 p-6 md:p-8 lg:col-span-5 lg:border-l lg:border-t-0">
                <p className="text-small font-bold uppercase tracking-[0.14em] text-accent">
                  How it works
                </p>
                <ol className="mt-4 space-y-5">
                  {HOW_IT_WORKS.map(([title, detail], index) => (
                    <li key={title} className="flex gap-4">
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-small font-bold text-primary"
                      >
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-body font-bold">{title}</span>
                        <span className="block text-small text-muted">{detail}</span>
                      </span>
                    </li>
                  ))}
                </ol>

                <p className="mt-6 text-small text-muted">
                  Visit Buddy only asks and organizes. It does not give medical advice.
                  Nothing is saved until you tap Save.
                </p>

                <p className="mt-4 rounded-card border border-line bg-surface p-4 text-small text-muted">
                  <strong className="text-ink">Demo only.</strong> Please do not enter real
                  personal or medical information.
                </p>
              </aside>
            </div>
          </Card>

          {finding.status !== 'empty' && finding.status !== 'success' ? (
            <div className="mt-10">
              <AIShell
                status={finding.status}
                error={finding.error}
                elapsed={finding.elapsed}
                steps={FINDING_STEPS}
                loadingTitle="Finding a few questions for you"
                onCancel={finding.cancel}
                onRetry={finding.run}
                onTypeInstead={focusConcerns}
                onReset={finding.reset}
              />
            </div>
          ) : null}
        </>
      ) : null}

      {stage === 'interview' ? (
        <div className="mt-6">
          <div className="mb-4 flex max-w-measure flex-wrap items-center gap-x-3">
            <p className="text-small text-muted">
              <span className="font-bold text-ink">Your worries:</span> “{concerns.trim()}”
            </p>
            <button
              type="button"
              onClick={backToDescribe}
              className="min-h-tap text-small font-bold text-primary underline underline-offset-4"
            >
              Change my worries
            </button>
          </div>
          <GuidedInterview
            key={interviewRun}
            steps={steps}
            answers={answers}
            onAnswersChange={setAnswers}
            startAt={interviewStart}
            onComplete={startBuilding}
            onExit={backToDescribe}
            onFlagContinue={() => setShowCrisisLine(crisisLineWanted())}
            scrollToId="before-steps"
          />
        </div>
      ) : null}

      {stage === 'result' ? (
        <div className="mt-6">
          <AIShell
            status={building.status}
            error={building.error}
            elapsed={building.elapsed}
            steps={BUILDING_STEPS}
            loadingTitle="Writing your questions"
            emptyState={
              <div className="rounded-card border border-line bg-surface p-6 md:p-8">
                <h2 className="text-subhead font-bold">Stopped. Your answers are kept.</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={building.run}>Make my list</Button>
                  {steps.length ? (
                    <Button variant="secondary" onClick={handleChangeAnswers}>
                      Change my answers
                    </Button>
                  ) : null}
                </div>
              </div>
            }
            onCancel={building.cancel}
            onRetry={building.run}
            onReset={backToDescribe}
          >
            {result?.questions.length ? (
              // Leaving a field ends that edit, so Undo takes back the whole edit.
              <div onBlur={endGroup}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="vb-eyebrow text-accent print:hidden">Step 3</p>
                    <h2
                      ref={resultHeadingRef}
                      tabIndex={-1}
                      className="mt-3 text-hero font-bold focus:outline-none"
                    >
                      Your questions
                    </h2>
                  </div>
                  <p className="max-w-[34ch] text-small text-muted print:hidden">
                    Edit any line. Nothing is saved until you tap Save.
                  </p>
                </div>

                {showCrisisLine ? <CrisisLineBanner className="mt-6" /> : null}

                <div className="mt-6">
                  <EditableList
                    items={result.questions}
                    onChange={(questions, edit) =>
                      setResult((current) => ({ ...current, questions }), edit)
                    }
                    label="Question"
                  />
                </div>

                {result.tellDoctor.length ? (
                  <section aria-labelledby="tell-doctor" className="mt-12">
                    <h2 id="tell-doctor" className="text-heading font-bold">
                      What to tell your doctor
                    </h2>
                    <p className="mt-2 max-w-measure text-body text-muted">
                      Your own words and answers, in order. Say these, or show the doctor this
                      page.
                    </p>
                    <div className="mt-4">
                      <EditableList
                        items={result.tellDoctor}
                        onChange={(tellDoctor, edit) =>
                          setResult((current) => ({ ...current, tellDoctor }), edit)
                        }
                        label="Note"
                        whyLabel="Why this is here"
                      />
                    </div>
                  </section>
                ) : null}

                <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6 print:hidden">
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

                <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                  <Button variant="quiet" onClick={handleUndo} disabled={!canUndo}>
                    Undo
                  </Button>
                  <Button variant="quiet" onClick={building.run}>
                    Regenerate
                  </Button>
                  {steps.length ? (
                    <Button variant="quiet" onClick={handleChangeAnswers}>
                      Change my answers
                    </Button>
                  ) : null}
                  <Button variant="quiet" onClick={backToDescribe}>
                    Start over
                  </Button>
                </div>
              </div>
            ) : null}
          </AIShell>
        </div>
      ) : null}

      <Toast message={toast} />
    </div>
  )
}
