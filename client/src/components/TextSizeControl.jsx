import { TEXT_SCALES, useSettings } from '../context/SettingsContext.jsx'

const LABELS = {
  normal: 'Normal',
  large: 'Large',
  'extra-large': 'Extra large',
}

// Three radio buttons styled as a segmented control. Native radios are used so
// the arrow keys, screen readers and form semantics all work without extra JS.
export default function TextSizeControl() {
  const { textScale, setTextScale } = useSettings()

  return (
    <fieldset>
      <legend className="text-small font-bold text-ink">Text size</legend>
      <p className="mt-2 text-small text-muted">
        Changes the text everywhere. Your choice is remembered on this device.
      </p>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {TEXT_SCALES.map((value) => (
          <label key={value} className="block cursor-pointer">
            <input
              type="radio"
              name="text-scale"
              value={value}
              checked={textScale === value}
              onChange={() => setTextScale(value)}
              className="peer sr-only"
            />
            <span className="flex min-h-tap items-center justify-center rounded border border-line bg-surface px-2 text-small font-bold text-ink transition-colors duration-fast peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {LABELS[value]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
