import { useEffect, useState } from 'react'

// Named steps with a check as each one finishes (brief section 6).
//
// The steps keep their own fine-grained clock (the page's `elapsed` only ticks
// once a second), so they move steadily instead of jumping. Each step takes
// about STEP_SECONDS; the last one stays "in progress" until the answer
// arrives, so the list never claims to be done while it is still waiting.
const STEP_SECONDS = 0.8
const TICK_MS = 200

export default function LoadingSteps({ steps, elapsed = 0, stepSeconds = STEP_SECONDS }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const timer = setInterval(() => setSeconds((performance.now() - start) / 1000), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const time = Math.max(seconds, elapsed)
  const current = Math.min(Math.floor(time / stepSeconds), steps.length - 1)

  return (
    <ol className="mt-6 space-y-4">
      {steps.map((label, index) => {
        const done = index < current
        const active = index === current

        return (
          <li key={label} className="flex items-center gap-4 text-body">
            <span
              aria-hidden="true"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-small font-bold transition-colors duration-calm ${
                done
                  ? 'border-primary bg-primary-solid text-paper'
                  : active
                    ? 'border-primary text-primary'
                    : 'border-line text-muted'
              }`}
            >
              {done ? '✓' : index + 1}
            </span>

            <span className={done ? 'text-muted' : 'text-ink'}>{label}</span>

            <span className="sr-only">{done ? 'done' : active ? 'in progress' : 'waiting'}</span>
          </li>
        )
      })}
    </ol>
  )
}
