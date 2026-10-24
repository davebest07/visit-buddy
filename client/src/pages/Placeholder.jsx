import { Link } from 'react-router-dom'

// Every route in the app, so the scaffold can be clicked through before the
// real screens exist. This component disappears once the pages are built.
const routes = [
  { to: '/', label: 'Landing' },
  { to: '/app', label: 'Home' },
  { to: '/app/before', label: 'Before a visit' },
  { to: '/app/after', label: 'After a visit' },
  { to: '/app/history', label: 'History' },
  { to: '/app/settings', label: 'Settings' },
  { to: '/help', label: 'Help' },
]

export default function Placeholder({ title, stage, children }) {
  return (
    <main className="vb-container py-8">
      <p className="text-small font-bold uppercase tracking-wide text-accent">
        Stage 1 scaffold
      </p>

      <h1 className="mt-2 text-hero font-bold">{title}</h1>

      <p className="mt-4 max-w-measure text-body text-muted">{children}</p>

      <p className="mt-2 text-small text-muted">Built in {stage}.</p>

      <hr className="my-8 border-line" />

      <nav aria-label="All pages">
        <h2 className="text-subhead font-bold">All routes</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <li key={route.to}>
              <Link
                to={route.to}
                className="flex min-h-tap items-center justify-between gap-2 rounded border border-line bg-surface px-4 py-2 text-body font-bold text-ink transition-colors duration-fast hover:border-accent hover:bg-accent-soft"
              >
                <span>{route.label}</span>
                <span aria-hidden="true">{route.to}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}
