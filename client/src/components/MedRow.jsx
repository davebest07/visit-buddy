import QuoteLine from './QuoteLine.jsx'

const SLOTS = ['Morning', 'Noon', 'Evening', 'Night']

// One medicine: a row for morning, noon, evening and night. Missing details
// stay blank, never guessed (brief section 4).
export default function MedRow({ med, onChange }) {
  const isActive = (slot) => (med.time ?? '').toLowerCase().includes(slot.toLowerCase())

  return (
    <li
      className={`rounded border p-4 ${
        med.needsCheck ? 'border-2 border-uncertain bg-uncertain' : 'border-line bg-surface'
      }`}
    >
      {med.needsCheck ? (
        <p className="mb-2 flex items-center gap-2 text-small font-bold text-uncertain-ink">
          <span aria-hidden="true">!</span>
          Not sure, ask your doctor or pharmacist
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-small font-bold text-muted">Medicine</span>
          <input
            value={med.name}
            onChange={(event) => onChange({ name: event.target.value })}
            className="mt-1 w-full rounded border border-line bg-background p-2 text-body"
          />
        </label>

        <label className="block">
          <span className="text-small font-bold text-muted">Dose</span>
          <input
            value={med.dose ?? ''}
            placeholder="Not told"
            onChange={(event) => onChange({ dose: event.target.value || null })}
            className="mt-1 w-full rounded border border-line bg-background p-2 text-body"
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SLOTS.map((slot) => {
          const active = isActive(slot)
          return (
            <div
              key={slot}
              className={`rounded border p-2 text-small ${
                active ? 'border-accent bg-accent-soft font-bold text-ink' : 'border-line text-muted'
              }`}
            >
              <span className="block">{slot}</span>
              <span className="block">
                {active ? med.dose ?? 'Dose not clear' : '—'}
              </span>
            </div>
          )
        })}
      </div>

      {med.time ? (
        <p className="mt-2 text-small text-muted">As you said it: {med.time}</p>
      ) : null}

      <QuoteLine quote={med.quote} />
    </li>
  )
}
