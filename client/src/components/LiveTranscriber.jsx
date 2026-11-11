import { Mic, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import useLiveTranscript from '../hooks/useLiveTranscript.js'

/*
 * A microphone button that types what you say, live.
 *
 * Sure words are in normal ink, words still being worked out are muted and
 * italic. When you press Stop, the full text goes to `onFinish` so the page can
 * put it in its editable text box.
 *
 * Screen readers hear "Listening" and "Stopped", not every word.
 */
export default function LiveTranscriber({
  label = 'Record',
  onFinish,
  onText,
  onListeningChange,
  note = null,
}) {
  const [announcement, setAnnouncement] = useState('')
  const stopButtonRef = useRef(null)
  const onTextRef = useRef(onText)
  const lastListeningRef = useRef(null)

  useEffect(() => {
    onTextRef.current = onText
  }, [onText])

  const { supported, secure, listening, finalText, interimText, errorMessage, start, stop } =
    useLiveTranscript({
      onFinish: (text) => {
        setAnnouncement(
          text ? 'Stopped listening. Your words are in the text box to check.' : 'Stopped listening.',
        )
        if (text) onFinish?.(text)
      },
    })

  useEffect(() => {
    // Tell the page once per change. Without this guard the callback identity
    // changes every render and the page keeps re-capturing its base text.
    if (lastListeningRef.current === listening) return
    lastListeningRef.current = listening
    onListeningChange?.(listening)
    if (listening) {
      setAnnouncement('Listening. Speak now. Press Stop when you are finished.')
      stopButtonRef.current?.focus()
    }
  }, [listening, onListeningChange])

  // Stream the words into the page's own text box while the person talks, so
  // there is only one place the text can be.
  useEffect(() => {
    if (!listening) return
    const spoken = [finalText, interimText].filter(Boolean).join(' ').trim()
    if (spoken) onTextRef.current?.(spoken)
  }, [finalText, interimText, listening])

  if (!supported) {
    return (
      <p className="rounded-card border border-line bg-surface-2 p-4 text-small text-muted">
        Live typing isn't available in this browser, you can type instead.
      </p>
    )
  }

  if (!secure) {
    return (
      <p className="rounded-card border border-line bg-surface-2 p-4 text-small text-muted">
        The microphone needs a secure (https) page. On a phone, open the https address
        (see <strong className="text-ink">npm run dev:https</strong> in the README), or type
        instead.
      </p>
    )
  }

  return (
    <div className="w-full">
      {listening ? (
        <div className="rounded-card border border-primary bg-primary-soft p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-3 text-body font-bold text-primary">
              <span className="relative flex h-3 w-3" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-error" />
              </span>
              Listening…
            </p>
            <button
              ref={stopButtonRef}
              type="button"
              onClick={stop}
              className="flex min-h-tap items-center gap-2 rounded-full border border-error bg-error px-6 py-2 text-body font-bold text-white"
            >
              <Square aria-hidden="true" className="h-4 w-4 fill-current" />
              Stop
            </button>
          </div>

          <p className="mt-2 text-small text-muted">Your words go into the box as you talk.</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          className="flex min-h-tap items-center gap-3 rounded-full border border-error bg-transparent px-6 py-2 text-body font-bold text-error transition-colors duration-fast hover:bg-error hover:text-white"
        >
          <Mic aria-hidden="true" className="h-5 w-5" />
          {label}
        </button>
      )}

      {note ? <p className="mt-2 text-small font-bold text-ink">{note}</p> : null}
      <p className="mt-2 text-small text-muted">
        Your browser turns your speech into text. In some browsers this uses an online service.
      </p>

      {errorMessage ? (
        <p role="alert" className="mt-2 text-small font-bold text-error">
          {errorMessage}
        </p>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}
