import { NavLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
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

// A floating dock. Active tab: pill, colour, bold weight and underline, so the
// state never depends on colour alone.
export default function BottomNav() {
  const reduce = useReducedMotion()

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-3 z-50 px-2 print:hidden">
      <ul className="vb-glass mx-auto flex w-fit items-center gap-1 rounded-full border border-line p-1 shadow-lift">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className="relative flex min-h-tap min-w-tap flex-col items-center justify-center gap-1 rounded-full px-3 py-1 text-small font-bold"
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <motion.span
                      layoutId={reduce ? undefined : 'dock-active'}
                      className="absolute inset-0 rounded-full border border-line bg-evergreen-soft"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span className={`relative ${isActive ? 'text-evergreen' : 'text-muted'}`}>
                    {ICONS[item.icon]}
                  </span>
                  <span
                    className={`relative ${
                      isActive
                        ? 'text-evergreen underline underline-offset-4'
                        : 'text-muted'
                    }`}
                  >
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
