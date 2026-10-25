import { Link, NavLink, useLocation } from 'react-router-dom'
import Button from './Button.jsx'

// Floating glass bar. Wordmark in the display serif, navigation kept quiet.
export default function TopNav() {
  const { pathname } = useLocation()
  const inApp = pathname.startsWith('/app')
  return (
    <header className="sticky top-0 z-50 print:hidden">
      <div className="vb-container pt-4">
        <div className="vb-glass flex items-center justify-between gap-4 rounded-full border border-line px-4 py-2 shadow-soft">
          <Link to="/" className="flex items-center gap-2 rounded-full">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-evergreen font-display text-subhead font-semibold text-cream"
            >
              v
            </span>
            <span className="font-display text-subhead font-semibold tracking-tight text-ink">
              Visit Buddy
            </span>
          </Link>

          <nav aria-label="Site" className="flex items-center gap-1">
            <NavLink
              to="/help"
              className="flex min-h-tap items-center rounded-full px-3 text-small font-bold text-muted transition-colors duration-fast hover:text-evergreen"
            >
              Help
            </NavLink>

            {inApp ? null : (
              <Button as={Link} to="/app" size="sm" className="hidden sm:inline-flex">
                Try the demo
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
