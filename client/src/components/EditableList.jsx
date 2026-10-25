import { useId } from 'react'
import QuoteLine from './QuoteLine.jsx'

// Editable AI lines as editorial numbered rows, not stacked cards.
export default function EditableList({ items, onChange, label = 'Question' }) {
  const prefix = useId()

  if (items.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line bg-surface-2 p-6 text-body text-muted">
        No lines left. Regenerate, or start over.
      </p>
    )
  }

  const update = (index, patch) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  const remove = (index) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <ul className="border-t border-line">
      {items.map((item, index) => (
        <li key={`${prefix}-${index}`} className="border-b border-line py-6">
          <div className="flex gap-4 md:gap-6">
            <span
              aria-hidden="true"
              className="pt-1 font-display text-subhead text-accent"
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            <div className="min-w-0 flex-1">
              <label htmlFor={`${prefix}-${index}`} className="sr-only">
                {label} {index + 1}
              </label>

              <textarea
                id={`${prefix}-${index}`}
                value={item.text}
                onChange={(event) => update(index, { text: event.target.value })}
                rows={2}
                className="w-full resize-y border-0 bg-transparent p-0 text-subhead text-ink focus:outline-none"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <QuoteLine quote={item.quote} />

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="min-h-tap px-2 text-small font-bold text-error underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
