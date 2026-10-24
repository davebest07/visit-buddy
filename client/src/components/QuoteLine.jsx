import { useId, useState } from 'react'

// Every AI line can show the exact words it came from (brief section 7).
export default function QuoteLine({ quote }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  if (!quote) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className="min-h-tap py-1 text-small font-bold text-accent underline underline-offset-4"
      >
        {open ? 'Hide the words' : 'Quote'}
      </button>

      {open ? (
        <blockquote
          id={panelId}
          className="mt-2 border-l-4 border-accent pl-4 text-small text-muted"
        >
          “{quote}”
        </blockquote>
      ) : null}
    </div>
  )
}
