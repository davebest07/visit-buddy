import { useId } from 'react'
import QuoteLine from './QuoteLine.jsx'

// An editable list of AI lines. Each line keeps its own quote and can be
// edited or removed. The page owns the data.
export default function EditableList({ items, onChange, label = 'Question' }) {
  const prefix = useId()

  if (items.length === 0) {
    return (
      <p className="rounded border border-line bg-surface p-4 text-body text-muted">
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
    <ul className="space-y-4">
      {items.map((item, index) => (
        <li key={`${prefix}-${index}`} className="rounded border border-line bg-surface p-4">
          <label
            htmlFor={`${prefix}-${index}`}
            className="text-small font-bold text-muted"
          >
            {label} {index + 1}
          </label>

          <textarea
            id={`${prefix}-${index}`}
            value={item.text}
            onChange={(event) => update(index, { text: event.target.value })}
            rows={2}
            className="mt-2 w-full rounded border border-line bg-background p-2 text-body text-ink"
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <QuoteLine quote={item.quote} />

            <button
              type="button"
              onClick={() => remove(index)}
              className="min-h-tap px-2 text-small font-bold text-error underline underline-offset-4"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
