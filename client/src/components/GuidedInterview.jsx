import { useEffect, useId, useRef, useState } from 'react'
import { dismissRedFlag, findRedFlag } from '../services/redFlags.js'
import Button from './Button.jsx'
import EmergencyCard from './EmergencyCard.jsx'
import LiveTranscriber from './LiveTranscriber.jsx'
import WhyLine from './WhyLine.jsx'

/*
 * A few follow-up questions, one at a time.
 *
 * Each question has quick replies, a text box, the microphone, Skip and Back.
 * Answers are checked for red flags before moving on: the card asks "right
 * now?", and "No, continue" carries on with the answer kept. The parent owns
 * the answers so they survive going back from the results.
 *
 * answers[i] = { id, question, category, topic, about, value, skipped, source }
 */
export default function GuidedInterview({
  steps,
  answers,
  onAnswersChange,
  startAt = 0,
  onComplete,
  onExit,
  scrollToId,
}) {
  const [index, setIndex] = useState(() => Math.min(startAt, steps.length - 1))
  const [draft, setDraft] = useState(() => answers[startAt]?.value ?? '')
  const [listening, setListening] = useState(false)
  const [flag, setFlag] = useState(null)
  const headingRef = useRef(null)
  const ids = useId()

  const step = steps[index]
  const total = steps.length
  const isLast = index === total - 1

  // Each new question gets focus, so it is read out and Tab starts from it.
  // The step header stays in view (clear of the sticky bar); focus goes to the
  // question without a second jump.
  useEffect(() => {
    if (flag) return
    document.getElementById(scrollToId)?.scrollIntoView({ block: 'start' })
    headingRef.current?.focus({ preventScroll: Boolean(scrollToId) })
  }, [index, flag, scrollToId])

  function record(value, skipped) {
    const next = [...answers]
    next[index] = {
      id: step.id,
      question: step.text,
      category: step.category,
      topic: step.topic,
      about: step.about,
      value: skipped ? '' : value.trim(),
      skipped,
      source: step.why?.source ?? null,
    }
    onAnswersChange(next)
    return next
  }

  function goTo(nextIndex, list) {
    if (nextIndex >= total) {
      onComplete(list.slice(0, total))
      return
    }
    setIndex(nextIndex)
    setDraft(list[nextIndex]?.value ?? '')
  }

  function handleNext() {
    if (!draft.trim()) return
    const found = findRedFlag(draft)
    if (found) {
      record(draft, false)
      setFlag(found)
      return
    }
    goTo(index + 1, record(draft, false))
  }

  // "No, continue": remember the answer for this phrase and move on.
  function handleFlagContinue(dismissed) {
    dismissRedFlag(dismissed)
    setFlag(null)
    const found = findRedFlag(draft)
    if (found) {
      setFlag(found)
      return
    }
    goTo(index + 1, record(draft, false))
  }

  function handleSkip() {
    goTo(index + 1, record('', true))
  }

  function handleBack() {
    if (index === 0) {
      onExit()
      return
    }
    // Keep what was typed here before stepping back.
    const next = draft.trim() ? record(draft, false) : answers
    setIndex(index - 1)
    setDraft(next[index - 1]?.value ?? '')
  }

  function handleSpoken(text) {
    setDraft((current) => (current.trim() ? `${current.trim()} ${text}` : text))
    requestAnimationFrame(() => document.getElementById(`${ids}-answer`)?.focus())
  }

  if (!step) return null

  if (flag) return <EmergencyCard flag={flag} onContinue={handleFlagContinue} />

  const progress = Math.round(((index + 1) / total) * 100)

  return (
    <section
      aria-labelledby={`${ids}-question`}
      className="rounded-card border border-line bg-surface p-6 shadow-soft md:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={`${ids}-progress`} className="text-small font-bold text-primary">
          Question {index + 1} of {total}
        </p>
        <p className="text-small text-muted">You can skip any question.</p>
      </div>

      <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-primary-solid transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {step.about ? (
        <p className="vb-eyebrow mt-6 text-accent">About {step.about}</p>
      ) : (
        <div className="mt-6" />
      )}

      <h2
        id={`${ids}-question`}
        ref={headingRef}
        tabIndex={-1}
        aria-describedby={`${ids}-progress`}
        className="mt-2 max-w-[32ch] text-heading font-bold focus:outline-none"
      >
        {step.text}
      </h2>

      <WhyLine why={step.why} label="Why we ask" />

      {step.replies.length ? (
        <div role="group" aria-label="Quick answers" className="mt-6 flex flex-wrap gap-2">
          {step.replies.map((reply) => {
            const chosen = draft.trim() === reply
            return (
              <button
                key={reply}
                type="button"
                aria-pressed={chosen}
                onClick={() => setDraft(chosen ? '' : reply)}
                className={`min-h-tap rounded-full border px-4 py-2 text-left text-body transition-colors duration-fast ${
                  chosen
                    ? 'border-primary bg-primary-solid font-bold text-paper'
                    : 'border-line bg-surface text-ink hover:border-primary hover:text-primary'
                }`}
              >
                {reply}
              </button>
            )
          })}
        </div>
      ) : null}

      <label htmlFor={`${ids}-answer`} className="mt-6 block text-body font-bold">
        {step.replies.length ? 'Or answer in your own words' : 'Your answer'}
      </label>
      <textarea
        id={`${ids}-answer`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        className="mt-2 w-full resize-y rounded-card border border-line bg-canvas p-4 text-body text-ink placeholder:text-muted"
        placeholder="Type here, or use the microphone."
      />

      <div className="mt-4">
        <LiveTranscriber
          key={step.id}
          label="Answer by talking"
          onFinish={handleSpoken}
          onListeningChange={setListening}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-line pt-6">
        <Button onClick={handleNext} disabled={!draft.trim() || listening}>
          {isLast ? 'See my questions' : 'Next question'}
        </Button>
        <Button variant="secondary" onClick={handleSkip} disabled={listening}>
          Skip
        </Button>
        <Button variant="quiet" onClick={handleBack} disabled={listening}>
          {index === 0 ? 'Back to my worries' : 'Back'}
        </Button>
      </div>
    </section>
  )
}
