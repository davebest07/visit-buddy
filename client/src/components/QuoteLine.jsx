import { useId, useState } from 'react'

// Every AI line can show the exact words it came from.
export default function QuoteLine({ quote, tone = 'light' }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  if (!quote) return null

  const isDark = tone === 'dark'

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`min-h-tap py-1 text-small font-bold underline underline-offset-4 ${
          isDark ? 'text-cream-muted hover:text-cream' : 'text-evergreen hover:text-evergreen-deep'
        }`}
      >
        {open ? 'Hide the words' : 'Quote'}
      </button>

      {open ? (
        <blockquote
          id={panelId}
          className={`mt-2 border-l-2 pl-4 text-small ${
            isDark ? 'border-ember-bright text-cream-muted' : 'border-ember text-muted'
          }`}
        >
          “{quote}”
        </blockquote>
      ) : null}
    </div>
  )
}
