import { useId } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { THEMES, useSettings } from '../context/SettingsContext.jsx'

const OPTIONS = {
  system: { label: 'System', Icon: Monitor },
  light: { label: 'Light', Icon: Sun },
  dark: { label: 'Dark', Icon: Moon },
}

// Three radios in a pill, with the same spring indicator as Text size.
export default function ThemeControl() {
  const { theme, setTheme } = useSettings()
  const reduce = useReducedMotion()
  const id = useId()

  return (
    <fieldset>
      <legend className="text-subhead font-bold">Appearance</legend>
      <p className="mt-2 text-small text-muted">
        System follows your device. Light and dark override it, and your choice is remembered on
        this device.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-full border border-line bg-surface-2 p-1">
        {THEMES.map((value) => {
          const checked = theme === value
          const { label, Icon } = OPTIONS[value]
          return (
            <label key={value} className="block cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={value}
                checked={checked}
                onChange={() => setTheme(value)}
                className="peer sr-only"
              />
              <span className="relative flex min-h-tap items-center justify-center gap-2 rounded-full px-2 text-small font-bold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                {checked ? (
                  <motion.span
                    layoutId={reduce ? undefined : id}
                    className="absolute inset-0 rounded-full bg-primary-solid"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <Icon
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                  className={`relative z-10 ${checked ? 'text-paper' : 'text-muted'}`}
                />
                <span className={`relative z-10 ${checked ? 'text-paper' : 'text-muted'}`}>
                  {label}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// One-tap sun/moon switch for the header. It always sets an explicit theme,
// so tapping it twice returns to where the user started.
export function ThemeToggle({ className = '' }) {
  const { resolvedTheme, setTheme } = useSettings()
  const isDark = resolvedTheme === 'dark'
  const next = isDark ? 'light' : 'dark'
  const label = `Switch to ${next} mode`

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className={`flex min-h-tap min-w-tap items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors duration-fast hover:bg-primary-soft hover:text-primary ${className}`}
    >
      {isDark ? (
        <Sun size={20} strokeWidth={2} aria-hidden="true" />
      ) : (
        <Moon size={20} strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  )
}
