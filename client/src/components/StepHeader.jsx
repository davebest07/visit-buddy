// Where you are in a short flow: done steps get a check, the current one is filled.
export default function StepHeader({ id, steps, current, className = '' }) {
  return (
    <ol id={id} aria-label="Steps" className={`flex flex-wrap items-center gap-2 text-small font-bold ${className}`}>
      {steps.map((label, index) => {
        const number = index + 1
        const active = number === current
        const done = number < current

        return (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={active ? 'step' : undefined}
              className={`flex min-h-tap items-center gap-2 rounded-full border px-4 py-2 ${
                active
                  ? 'border-primary bg-primary-solid text-paper'
                  : done
                    ? 'border-line bg-primary-soft text-primary'
                    : 'border-line bg-surface text-muted'
              }`}
            >
              <span aria-hidden="true" className="font-display">
                {done ? '✓' : number}
              </span>
              {label}
              <span className="sr-only">
                {done ? ' (done)' : active ? ' (current step)' : ' (next)'}
              </span>
            </span>
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="text-muted">
                →
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
