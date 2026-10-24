import { useEffect, useRef, useState } from 'react'

// Browser recording with the failures people actually hit (brief section 9).
// Audio never leaves this component: the page passes the blob to the mock.
export default function RecorderButton({ onAudio, label = 'Record' }) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [message, setMessage] = useState(null)

  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  function finish(recorder) {
    const durationSeconds = (Date.now() - startedAtRef.current) / 1000
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (timerRef.current) clearInterval(timerRef.current)

    setRecording(false)
    setSeconds(0)

    if (durationSeconds < 1) {
      setMessage('That was too short. Hold it a moment longer and try again.')
      return
    }

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
    onAudio(blob)
  }

  async function start() {
    setMessage(null)

    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMessage('This browser cannot record. You can type instead.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => finish(recorder)

      startedAtRef.current = Date.now()
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      setSeconds(0)

      timerRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }, 1000)
    } catch (caught) {
      const denied = caught?.name === 'NotAllowedError' || caught?.name === 'SecurityError'
      setMessage(
        denied
          ? 'Microphone is off. You can type instead.'
          : 'No microphone found. You can type instead.',
      )
    }
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop()
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={recording ? stop : start}
        className={`flex min-h-tap items-center gap-2 rounded px-6 py-2 text-body font-bold transition-colors duration-fast ${
          recording
            ? 'bg-error text-white hover:opacity-90'
            : 'border border-accent bg-surface text-accent hover:bg-accent-soft'
        }`}
      >
        <span aria-hidden="true" className={recording ? 'animate-pulse' : ''}>
          {recording ? '■' : '●'}
        </span>
        {recording ? `Stop (${seconds}s)` : label}
      </button>

      {recording ? (
        <p className="mt-2 text-small text-muted" aria-live="polite">
          Recording. Tap stop when you are finished.
        </p>
      ) : null}

      {message ? (
        <p role="alert" className="mt-2 text-small font-bold text-error">
          {message}
        </p>
      ) : null}
    </div>
  )
}
