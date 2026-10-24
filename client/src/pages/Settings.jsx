import TextSizeControl from '../components/TextSizeControl.jsx'
import { useSettings } from '../context/SettingsContext.jsx'

// Stage 2 version: enough of Settings to prove that text size and contrast
// persist. "Delete all my data" arrives with the backend in stage 6.
export default function Settings() {
  const { contrast, setContrast } = useSettings()

  return (
    <div className="vb-container py-8">
      <h1 className="text-hero font-bold">Settings</h1>

      <div className="mt-8 grid max-w-measure gap-8">
        <TextSizeControl />

        <fieldset>
          <legend className="text-small font-bold text-ink">Contrast</legend>

          <label className="mt-2 flex min-h-tap cursor-pointer items-center gap-4">
            <input
              type="checkbox"
              checked={contrast === 'high'}
              onChange={(event) => setContrast(event.target.checked ? 'high' : 'normal')}
              className="h-6 w-6 accent-accent"
            />
            <span className="text-body">High contrast</span>
          </label>

          <p className="mt-2 text-small text-muted">
            Turns the page pure white with black text and a darker accent.
          </p>
        </fieldset>

        <p className="border-t border-line pt-6 text-small text-muted">
          "Delete all my data" is added with the backend in stage 6.
        </p>
      </div>
    </div>
  )
}
