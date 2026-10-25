import { useId } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { TEXT_SCALES, useSettings } from '../context/SettingsContext.jsx'

const LABELS = { normal: 'Normal', large: 'Large', 'extra-large': 'Extra large' }

// Three radios in a pill, with a spring indicator shared between them.
export default function TextSizeControl() {
  const { textScale, setTextScale } = useSettings()
  const reduce = useReducedMotion()
  const id = useId()

  return (
    <fieldset>
      <legend className="text-subhead font-bold">Text size</legend>
      <p className="mt-2 text-small text-muted">
        Changes the text everywhere. Your choice is remembered on this device.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-full border border-line bg-surface-2 p-1">
        {TEXT_SCALES.map((value) => {
          const checked = textScale === value
          return (
            <label key={value} className="block cursor-pointer">
              <input
                type="radio"
                name="text-scale"
                value={value}
                checked={checked}
                onChange={() => setTextScale(value)}
                className="peer sr-only"
              />
              <span className="relative flex min-h-tap items-center justify-center rounded-full px-2 text-small font-bold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                {checked ? (
                  <motion.span
                    layoutId={reduce ? undefined : id}
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <span className={`relative z-10 ${checked ? 'text-paper' : 'text-muted'}`}>
                  {LABELS[value]}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
