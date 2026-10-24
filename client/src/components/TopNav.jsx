import { Link, NavLink } from 'react-router-dom'
import Button from './Button.jsx'

// Top bar on every page: the wordmark on the left, Help on the right.
export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background">
      <div className="vb-container flex min-h-tap items-center justify-between gap-4 py-2">
        <Link
          to="/"
          className="flex items-center gap-2 rounded text-subhead font-bold text-ink"
        >
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent" />
          Visit Buddy
        </Link>

        <nav aria-label="Site" className="flex items-center gap-2">
          <NavLink
            to="/help"
            className="flex min-h-tap items-center rounded px-2 text-body font-bold text-muted hover:text-accent"
          >
            Help
          </NavLink>

          <Button as={Link} to="/app" variant="secondary" className="hidden sm:inline-flex">
            Try the demo
          </Button>
        </nav>
      </div>
    </header>
  )
}
