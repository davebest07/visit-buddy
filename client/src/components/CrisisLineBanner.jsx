/*
 * A small, calm reminder shown after someone answers "I'm safe right now" to
 * the self-harm card. It stays for the rest of the browser session. It does
 * not block anything and is not announced as an alert.
 */
export default function CrisisLineBanner({ className = '' }) {
  return (
    <aside
      aria-label="Support line"
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-card border border-line bg-surface-2 px-4 py-2 text-small text-ink print:hidden ${className}`}
    >
      <p>If you need to talk to someone, call or text 988.</p>
      <span className="flex gap-4">
        <a
          href="tel:988"
          className="inline-flex min-h-tap items-center font-bold text-primary underline underline-offset-4"
        >
          Call 988
        </a>
        <a
          href="sms:988"
          className="inline-flex min-h-tap items-center font-bold text-primary underline underline-offset-4"
        >
          Text 988
        </a>
      </span>
    </aside>
  )
}
