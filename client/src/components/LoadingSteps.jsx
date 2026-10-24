// Named steps with a check as each one finishes (brief section 6).
const SECONDS_PER_STEP = 1.9

export default function LoadingSteps({ steps, elapsed }) {
  return (
    <ol className="mt-4 space-y-2">
      {steps.map((label, index) => {
        const done = elapsed >= (index + 1) * SECONDS_PER_STEP
        const active = !done && elapsed >= index * SECONDS_PER_STEP

        return (
          <li key={label} className="flex items-center gap-4 text-body">
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-small font-bold ${
                done
                  ? 'border-success bg-success text-white'
                  : active
                    ? 'border-accent text-accent'
                    : 'border-line text-muted'
              }`}
            >
              {done ? '✓' : index + 1}
            </span>

            <span className={done ? 'text-muted' : 'text-ink'}>{label}</span>

            <span className="sr-only">
              {done ? 'done' : active ? 'in progress' : 'waiting'}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
