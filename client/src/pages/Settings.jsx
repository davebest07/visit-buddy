import { useState } from 'react'
import Card from '../components/Card.jsx'
import StatefulButton from '../components/StatefulButton.jsx'
import TextSizeControl from '../components/TextSizeControl.jsx'
import ThemeControl from '../components/ThemeControl.jsx'
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
    <div className="vb-container ml-0 max-w-3xl pt-10">
      <header>
        <h1 className="mt-4 text-hero font-bold">Make it easier to read.</h1>
      </header>

      <div className="mt-8 grid gap-4">
        <Card className="p-6 md:p-8">
          <TextSizeControl />
        </Card>

        <Card className="p-6 md:p-8">
          <ThemeControl />
        </Card>

        <Card className="p-6 md:p-8">
          <fieldset>
            <legend className="text-subhead font-bold">Contrast</legend>

            <label className="mt-4 flex min-h-tap cursor-pointer items-center justify-between gap-4">
              <span className="text-body">High contrast</span>
              <span className="relative inline-flex">
                <input
                  type="checkbox"
                  checked={contrast === 'high'}
                  onChange={(event) => setContrast(event.target.checked ? 'high' : 'normal')}
                  className="peer sr-only"
                />
                <span className="h-8 w-14 rounded-full bg-line transition-colors duration-fast peer-checked:bg-primary-solid" />
                <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-knob shadow-soft transition-transform duration-fast peer-checked:translate-x-6" />
              </span>
            </label>

            <p className="mt-3 text-small text-muted">
              Turns the page pure white with black text and a darker accent.
            </p>
          </fieldset>
        </Card>

        <Card className="p-6 md:p-8">
          <h2 className="text-subhead font-bold">Your data</h2>
          <p className="mt-2 text-body text-muted">
            Visits are saved on this computer. Deleting is permanent.
          </p>

          {confirming ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <StatefulButton
                onClick={handleDeleteAll}
                variant="danger"
                state={
                  working ? 'loading' : message === 'All visits were deleted.' ? 'success' : 'idle'
                }
                loadingLabel="Deleting…"
                successLabel="Deleted"
              >
                Yes, delete everything
              </StatefulButton>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-tap rounded-full border border-line px-6 py-2 text-body font-bold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-5 min-h-tap rounded-full border-2 border-error px-6 py-2 text-body font-bold text-error"
            >
              Delete all my data
            </button>
          )}

          {message ? (
            <p role="status" className="mt-4 text-body">
              {message}
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
