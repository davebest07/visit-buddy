import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AI_MODES, useSettings } from '../context/SettingsContext.jsx'
import { SAMPLE_TRANSCRIPT } from '../services/aiService.js'
import { createVisit, deleteAllVisits } from '../services/api.js'

// Hidden corner panel for usability sessions: ?testing=1 (brief section 11).
export default function TestPanel() {
  const [params] = useSearchParams()
  const { aiMode, setAiMode } = useSettings()
  const [message, setMessage] = useState(null)

  if (params.get('testing') !== '1') return null

  async function resetData() {
    try {
      await deleteAllVisits()
      setMessage('Demo data cleared.')
    } catch (caught) {
      setMessage(caught.message)
    }
  }

  async function loadSample() {
    try {
      await createVisit({
        type: 'after',
        transcript: SAMPLE_TRANSCRIPT,
        summary: [
          { text: 'Your knee pain is probably from wear.', quote: 'my knee pain is probably from wear' },
          {
            text: 'You need blood work before your next visit in six weeks.',
            quote: 'blood work done before the next visit in six weeks',
          },
        ],
        todos: [
          {
            text: 'Do gentle knee stretches twice a day',
            done: false,
            quote: 'try gentle stretching twice a day',
          },
        ],
        meds: [
          {
            name: 'Bellaprin',
            dose: '10 mg',
            time: 'morning, with food',
            quote: 'Bellaprin, one tablet every morning with food',
          },
        ],
        flags: [],
        approved: true,
      })
      setMessage('Sample visit added.')
    } catch (caught) {
      setMessage(caught.message)
    }
  }

  return (
    <aside
      aria-label="Test panel"
      className="fixed bottom-2 right-2 z-50 w-64 rounded border-2 border-accent bg-surface p-4 text-small shadow-calm print:hidden"
    >
      <p className="font-bold">Testing panel</p>

      <label htmlFor="ai-mode" className="mt-2 block font-bold">
        AI mode
      </label>
      <select
        id="ai-mode"
        value={aiMode}
        onChange={(event) => setAiMode(event.target.value)}
        className="mt-1 w-full rounded border border-line bg-background p-2"
      >
        {AI_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>

      <div className="mt-2 grid gap-2">
        <button
          type="button"
          onClick={resetData}
          className="rounded border border-line bg-background px-2 py-2 text-left font-bold"
        >
          Reset demo data
        </button>
        <button
          type="button"
          onClick={loadSample}
          className="rounded border border-line bg-background px-2 py-2 text-left font-bold"
        >
          Load sample visit
        </button>
      </div>

      {message ? <p className="mt-2 text-muted">{message}</p> : null}
      <p className="mt-2 text-muted">The url ?ai= wins over this menu.</p>
    </aside>
  )
}
