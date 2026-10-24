// A short message at the bottom of the screen, announced politely to screen
// readers. The caller decides when it appears and when it disappears.
export default function Toast({ message, className = '' }) {
  if (!message) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded bg-ink px-6 py-4 text-body text-surface shadow-calm ${className}`}
    >
      {message}
    </div>
  )
}
