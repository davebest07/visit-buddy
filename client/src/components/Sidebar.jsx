import { NavLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import {
  ClipboardList,
  HeartPulse,
  History,
  House,
  LifeBuoy,
  Mic,
  Settings,
} from 'lucide-react'

export const NAV = [
  { to: '/app', label: 'Home', icon: House, end: true },
  { to: '/app/before', label: 'Before a visit', icon: ClipboardList },
  { to: '/app/after', label: 'After a visit', icon: Mic },
  { to: '/app/history', label: 'Visit history', icon: History },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export function Brand() {
  return (
    <NavLink to="/app" className="flex items-center gap-3 rounded-xl">
      <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(160deg,#3b82f6,#1d4ed8)] text-paper shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_16px_rgba(29,78,216,0.28)]">
        <HeartPulse size={22} strokeWidth={2} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-display text-subhead font-semibold leading-none text-ink">
          Visit Buddy
        </span>
        <span className="mt-1 block text-small text-muted">Visit companion</span>
      </span>
    </NavLink>
  )
}

export function NavList({ onNavigate }) {
  const reduce = useReducedMotion()

  return (
    <ul className="space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon
        return (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `relative flex min-h-tap items-center gap-3 rounded-[14px] px-4 text-body font-bold transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-ink hover:bg-white/70 hover:text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <motion.span
                      layoutId={reduce ? undefined : 'sidebar-active'}
                      className="absolute inset-0 rounded-[14px] border border-white/80 bg-primary-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_rgba(37,99,235,0.12)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  ) : null}
                  <Icon
                    size={22}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="relative shrink-0"
                  />
                  <span className="relative">{item.label}</span>
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="relative ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-white/70 bg-white/62 backdrop-blur-2xl lg:flex print:hidden">
      <div className="px-6 py-6">
        <Brand />
      </div>

      <div className="mx-6 border-t border-white/70" />

      <nav aria-label="Main" className="mt-4 flex-1 overflow-y-auto px-3">
        <p className="px-4 pb-2 text-small font-bold uppercase tracking-[0.14em] text-muted">
          Menu
        </p>
        <NavList />
      </nav>

      <div className="border-t border-white/70 p-3">
        <NavLink
          to="/help"
          className={({ isActive }) =>
            `flex min-h-tap items-center gap-3 rounded-[14px] px-4 text-body font-bold transition-colors duration-200 ${
              isActive
                ? 'bg-primary-soft text-primary'
                : 'text-muted hover:bg-white/70 hover:text-primary'
            }`
          }
        >
          <LifeBuoy size={22} strokeWidth={1.8} aria-hidden="true" />
          Help &amp; support
        </NavLink>

        <p className="px-4 pt-3 text-small text-muted">Demo build · CMPS 4200</p>
      </div>
    </aside>
  )
}
