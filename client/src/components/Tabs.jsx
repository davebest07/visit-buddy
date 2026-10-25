import { useId, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'

// Pill tabs with a spring-animated shared indicator (the beUI pattern).
// Full keyboard support: arrows move selection, Home/End jump to the ends.
export default function Tabs({ tabs, value, onChange, label, className = '' }) {
  const reduce = useReducedMotion()
  const pillId = useId()
  const refs = useRef([])

  function move(event, index) {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()

    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = tabs.length - 1

    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={`vb-glass inline-flex max-w-full flex-wrap gap-1 rounded-full p-1 ${className}`}
    >
      {tabs.map((tab, index) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => move(event, index)}
            className={`relative min-h-tap rounded-full px-4 text-body font-bold transition-colors duration-fast ${
              active ? 'text-paper' : 'text-muted hover:text-ink'
            }`}
          >
            {active ? (
              <motion.span
                layoutId={reduce ? undefined : pillId}
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
