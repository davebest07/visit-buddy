import { useId, useLayoutEffect, useRef } from 'react'
import QuoteLine from './QuoteLine.jsx'
import WhyLine from './WhyLine.jsx'

// A text box that is exactly as tall as its text: no resize handle, no empty area.
function GrowingText({ value, onChange, ...props }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    box.style.height = 'auto'
    box.style.height = `${box.scrollHeight}px`
  }, [value])

  // Text size changes and window resizes can re-wrap the text.
  useLayoutEffect(() => {
    const box = ref.current
    if (!box || typeof ResizeObserver === 'undefined') return undefined
    let width = box.clientWidth
    const observer = new ResizeObserver(() => {
      if (box.clientWidth === width) return
      width = box.clientWidth
      box.style.height = 'auto'
      box.style.height = `${box.scrollHeight}px`
    })
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  return <textarea ref={ref} rows={1} value={value} onChange={onChange} {...props} />
}

// Editable AI lines as editorial numbered rows, not stacked cards.
// onChange(items, { group }) — typing in one row shares a group, so the page's
// undo treats it as one edit. Removing a row has no group: its own step.
export default function EditableList({ items, onChange, label = 'Question', whyLabel }) {
  const prefix = useId()

  if (items.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-line bg-surface-2 p-6 text-body text-muted">
        No lines left. Regenerate, or start over.
      </p>
    )
  }

  const update = (index, patch) => {
    onChange(
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
      { group: `${prefix}:${index}` },
    )
  }

  const remove = (index) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <ul className="border-t border-line">
      {items.map((item, index) => (
        <li key={`${prefix}-${index}`} className="border-b border-line py-4">
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

              {/* Reads as plain text; a soft background on hover and focus shows it can be edited. */}
              <GrowingText
                id={`${prefix}-${index}`}
                value={item.text}
                onChange={(event) => update(index, { text: event.target.value })}
                className="-mx-2 block min-h-tap w-[calc(100%+16px)] resize-none overflow-hidden rounded border-0 bg-transparent px-2 py-1 text-subhead text-ink transition-colors duration-fast hover:bg-hover-surface focus:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />

              {item.why ? <WhyLine why={item.why} label={whyLabel} /> : null}

              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
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
