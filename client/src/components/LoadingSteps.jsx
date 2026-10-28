// Named steps with a check as each one finishes (brief section 6).
const SECONDS_PER_STEP = 1.9

export default function LoadingSteps({ steps, elapsed }) {
  return (
    <ol className="mt-6 space-y-4">
      {steps.map((label, index) => {
        const done = elapsed >= (index + 1) * SECONDS_PER_STEP
        const active = !done && elapsed >= index * SECONDS_PER_STEP

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
