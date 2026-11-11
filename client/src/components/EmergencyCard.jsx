import { useEffect, useRef, useState } from 'react'
import { RED_FLAG_QUESTIONS } from '../services/redFlags.js'
import Button from './Button.jsx'

/*
 * Shown when someone's words match a red flag (services/redFlags.js).
 * Same look and advice as the Help page card.
 *
 * Most flags first ask "Are you having … right now?":
 *   Yes, get help  -> the full "Get help now" card with Call 911
 *   No, continue   -> back to the flow, words kept (onContinue)
 * Thoughts of self-harm always show 988 straight away, with a smaller
 * "I'm safe right now, continue" button.
 *
 * It repeats their words and never guesses what the problem is.
 */
export default function EmergencyCard({ flag, onContinue }) {
  const [view, setView] = useState('ask')
  const headingRef = useRef(null)
  const selfHarm = flag?.id === 'self-harm'

  // A new flag starts at the question again.
  useEffect(() => {
    setView('ask')
  }, [flag?.id, flag?.words])

  // Move focus here so keyboard and screen reader users meet it first.
  useEffect(() => {
    headingRef.current?.focus()
  }, [flag?.id, flag?.words, view])

  if (!flag) return null

  const heading = (text) => (
    <h2
      id="get-help-now"
      ref={headingRef}
      tabIndex={-1}
      className="font-display text-heading font-semibold focus:outline-none"
    >
      {text}
    </h2>
  )

  const call911 = (
    <p className="mt-4 max-w-measure text-body text-paper-muted">
      If this is happening now, call <strong className="text-paper">911</strong> or your local
      emergency number. Do not wait for an app. If it is not an emergency but you are worried,
      call your doctor's office.
    </p>
  )

  if (selfHarm) {
    return (
      <section role="alert" aria-labelledby="get-help-now" className="rounded-xl bg-navy p-8 text-paper">
        {heading('You do not have to handle this alone')}
        <p className="mt-3 max-w-measure text-body text-paper-muted">
          You wrote “{flag.words}”. If you are thinking about hurting yourself, call or text{' '}
          <strong className="text-paper">988</strong> (Suicide &amp; Crisis Lifeline, in the US)
          any time, day or night. If you are in danger right now, call{' '}
          <strong className="text-paper">911</strong>.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button as="a" href="tel:988" variant="onDark">
            Call 988
          </Button>
          <Button as="a" href="sms:988" variant="onDark">
            Text 988
          </Button>
          <Button as="a" href="tel:911" variant="onDark">
            Call 911
          </Button>
        </div>
        <button
          type="button"
          onClick={() => onContinue?.(flag)}
          className="mt-6 min-h-tap text-small font-bold text-paper-muted underline underline-offset-4 hover:text-paper"
        >
          I'm safe right now, continue
        </button>
      </section>
    )
  }

  if (view === 'help') {
    return (
      <section role="alert" aria-labelledby="get-help-now" className="rounded-xl bg-navy p-8 text-paper">
        {heading('Get help now — call 911 or your doctor')}
        <p className="mt-3 max-w-measure text-body text-paper-muted">
          Call 911, or your local emergency number, now. Do not wait for an app.
        </p>
        <p className="mt-4 max-w-measure text-body text-paper-muted">
          If you cannot call, ask someone near you to call for you.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button as="a" href="tel:911" variant="onDark">
            Call 911
          </Button>
          <button
            type="button"
            onClick={() => setView('ask')}
            className="min-h-tap px-4 text-small font-bold text-paper-muted underline underline-offset-4 hover:text-paper"
          >
            Go back
          </button>
        </div>
      </section>
    )
  }

  return (
    <section role="alert" aria-labelledby="get-help-now" className="rounded-xl bg-navy p-8 text-paper">
      {heading(RED_FLAG_QUESTIONS[flag.id] ?? `Are you having ${flag.label} right now?`)}
      <p className="mt-3 max-w-measure text-body text-paper-muted">
        You wrote “{flag.words}”. We ask because this can need help straight away.
      </p>
      {call911}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="onDark" onClick={() => setView('help')}>
          Yes, get help
        </Button>
        <button
          type="button"
          onClick={() => onContinue?.(flag)}
          className="inline-flex min-h-tap items-center rounded-full border border-white/40 px-6 py-2 text-body font-bold text-paper hover:bg-white/10"
        >
          No, continue
        </button>
      </div>
    </section>
  )
}
