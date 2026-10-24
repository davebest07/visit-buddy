import { NavLink } from 'react-router-dom'

// Simple line icons, drawn inline so we do not add an icon library.
const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const ICONS = {
  home: (
    <svg {...iconProps}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  before: (
    <svg {...iconProps}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  ),
  after: (
    <svg {...iconProps}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  ),
  history: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  settings: (
    <svg {...iconProps}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  ),
}

const ITEMS = [
  { to: '/app', label: 'Home', icon: 'home', end: true },
  { to: '/app/before', label: 'Before', icon: 'before' },
  { to: '/app/after', label: 'After', icon: 'after' },
  { to: '/app/history', label: 'History', icon: 'history' },
  { to: '/app/settings', label: 'Settings', icon: 'settings' },
]

// Bottom tab bar for the app pages. The active tab is marked three ways:
// colour, bold weight and an underline, so colour is never the only signal.
export default function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface print:hidden"
    >
      <ul className="vb-container flex">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-h-tap flex-col items-center justify-center gap-1 px-1 py-2 text-small transition-colors duration-fast ${
                  isActive ? 'font-bold text-accent' : 'text-muted hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {ICONS[item.icon]}
                  <span className={isActive ? 'underline underline-offset-4' : undefined}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
