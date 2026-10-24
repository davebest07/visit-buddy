import { useState } from 'react'
import TextSizeControl from '../components/TextSizeControl.jsx'
import { useSettings } from '../context/SettingsContext.jsx'
import { deleteAllVisits } from '../services/api.js'

export default function Settings() {
  const { contrast, setContrast } = useSettings()
  const [confirming, setConfirming] = useState(false)
  const [message, setMessage] = useState(null)
  const [working, setWorking] = useState(false)

  async function handleDeleteAll() {
    setWorking(true)
    try {
      await deleteAllVisits()
      setMessage('All visits were deleted.')
      setConfirming(false)
    } catch (caught) {
      setMessage(caught.message)
    } finally {
      setWorking(false)
    }
  }

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

        <section className="border-t border-line pt-6">
          <h2 className="text-subhead font-bold">Your data</h2>
          <p className="mt-2 text-body text-muted">
            Visits are saved on this computer. Deleting is permanent.
          </p>

          {confirming ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={working}
                className="min-h-tap rounded bg-error px-6 py-2 text-body font-bold text-white"
              >
                {working ? 'Deleting…' : 'Yes, delete everything'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-tap rounded border border-line px-6 py-2 text-body font-bold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-4 min-h-tap rounded border-2 border-error px-6 py-2 text-body font-bold text-error"
            >
              Delete all my data
            </button>
          )}

          {message ? (
            <p role="status" className="mt-4 text-body">
              {message}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  )
}
