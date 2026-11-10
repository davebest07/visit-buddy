import { useId, useState } from 'react'

// Every AI line can show the exact words it came from.
// `from` names where those words are, e.g. "From your photo".
export default function QuoteLine({ quote, from = null, tone = 'light' }) {
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
          isDark ? 'text-paper-muted hover:text-paper' : 'text-primary hover:text-primary-deep'
        }`}
      >
        {open ? 'Hide the words' : 'Quote'}
      </button>

      {open ? (
        <blockquote
          id={panelId}
          className={`mt-2 border-l-2 pl-4 text-small ${
            isDark ? 'border-accent-bright text-paper-muted' : 'border-accent text-muted'
          }`}
        >
          {from ? <span className="block font-bold">{from}</span> : null}
          “{quote}”
        </blockquote>
      ) : null}
    </div>
  )
}
