import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * Live speech-to-text with the browser's Web Speech API.
 *
 * Words appear while the person is still talking: `finalText` holds what the
 * browser is sure of, `interimText` the words it may still change.
 *
 * Visit Buddy never records or stores audio here. The browser does the
 * listening; in Chrome that means the audio goes to Google's speech service.
 *
 * Browsers stop listening on their own after a few seconds of silence. While
 * the person has not pressed Stop, we quietly start again.
 */

function getRecognitionClass() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

// Problems that stop listening for good, with the message a person sees.
export const LIVE_TRANSCRIPT_MESSAGES = {
  unsupported: "Live typing isn't available in this browser, you can type instead.",
  insecure:
    'The microphone only works on a secure (https) page. On a phone, open the https address, or type instead.',
  denied:
    'The microphone is blocked. To allow it, tap the lock or settings icon next to the web address, turn on Microphone, then try again. You can also type instead.',
  'no-mic': 'No microphone was found. You can type instead.',
  network: 'Live typing needs an internet connection right now. You can type instead.',
  other: 'Live typing stopped unexpectedly. You can try again or type instead.',
}

// If the browser keeps ending straight away with nothing heard, stop trying
// instead of looping forever.
const MAX_QUICK_RESTARTS = 5
const QUICK_RESTART_MS = 1500

function joinText(a, b) {
  const left = a.trim()
  const right = b.trim()
  if (!left) return right
  if (!right) return left
  return `${left} ${right}`
}

export default function useLiveTranscript({ lang, onFinish } = {}) {
  const Recognition = getRecognitionClass()
  const supported = Boolean(Recognition)
  const secure = typeof window === 'undefined' ? true : window.isSecureContext !== false

  const [listening, setListening] = useState(false)
  const [finalText, setFinalText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState(null)

  const recognitionRef = useRef(null)
  const wantListeningRef = useRef(false) // true until the person presses Stop
  const committedRef = useRef('') // text from earlier sessions (before a restart)
  const sessionFinalRef = useRef('') // final text from the current session
  const interimRef = useRef('')
  const lastStartRef = useRef(0)
  const quickRestartsRef = useRef(0)
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  const finish = useCallback(() => {
    // Keep any words still in progress: the person saw them on screen.
    const text = joinText(joinText(committedRef.current, sessionFinalRef.current), interimRef.current)
    committedRef.current = ''
    sessionFinalRef.current = ''
    interimRef.current = ''
    recognitionRef.current = null
    setListening(false)
    setFinalText('')
    setInterimText('')
    onFinishRef.current?.(text)
  }, [])

  const startSession = useCallback(() => {
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang || navigator.language || 'en-US'

    recognition.onresult = (event) => {
      let sessionFinal = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i]
        const words = result[0]?.transcript ?? ''
        if (result.isFinal) sessionFinal = joinText(sessionFinal, words)
        else interim = joinText(interim, words)
      }
      sessionFinalRef.current = sessionFinal
      interimRef.current = interim
      quickRestartsRef.current = 0
      setFinalText(joinText(committedRef.current, sessionFinal))
      setInterimText(interim)
    }

    recognition.onerror = (event) => {
      switch (event.error) {
        case 'no-speech':
        case 'aborted':
          // Silence or our own stop. onend decides what happens next.
          return
        case 'not-allowed':
        case 'service-not-allowed':
          setError(secure ? 'denied' : 'insecure')
          break
        case 'audio-capture':
          setError('no-mic')
          break
        case 'network':
          setError('network')
          break
        default:
          setError('other')
      }
      wantListeningRef.current = false
    }

    recognition.onend = () => {
      // Move this session's words into the committed text before restarting.
      committedRef.current = joinText(committedRef.current, sessionFinalRef.current)
      sessionFinalRef.current = ''

      if (!wantListeningRef.current) {
        finish()
        return
      }

      const quick = Date.now() - lastStartRef.current < QUICK_RESTART_MS
      quickRestartsRef.current = quick ? quickRestartsRef.current + 1 : 0
      if (quickRestartsRef.current > MAX_QUICK_RESTARTS) {
        wantListeningRef.current = false
        setError('other')
        finish()
        return
      }

      // The browser stopped after a silence. Keep listening.
      try {
        lastStartRef.current = Date.now()
        recognition.start()
      } catch {
        wantListeningRef.current = false
        finish()
      }
    }

    recognitionRef.current = recognition
    lastStartRef.current = Date.now()
    recognition.start()
  }, [Recognition, finish, lang, secure])

  const start = useCallback(() => {
    if (!supported) {
      setError('unsupported')
      return
    }
    if (!secure) {
      setError('insecure')
      return
    }
    if (recognitionRef.current) return

    setError(null)
    setFinalText('')
    setInterimText('')
    committedRef.current = ''
    sessionFinalRef.current = ''
    interimRef.current = ''
    quickRestartsRef.current = 0
    wantListeningRef.current = true

    try {
      startSession()
      setListening(true)
    } catch {
      wantListeningRef.current = false
      recognitionRef.current = null
      setError('other')
    }
  }, [secure, startSession, supported])

  const stop = useCallback(() => {
    wantListeningRef.current = false
    // stop() lets the browser finish the last words; onend then calls finish().
    recognitionRef.current?.stop()
  }, [])

  // Leaving the page stops the microphone without handing back any text.
  useEffect(() => {
    return () => {
      wantListeningRef.current = false
      const recognition = recognitionRef.current
      if (recognition) {
        recognition.onend = null
        recognition.onresult = null
        recognition.onerror = null
        recognition.abort()
      }
    }
  }, [])

  return {
    supported,
    secure,
    listening,
    finalText,
    interimText,
    error,
    errorMessage: error ? LIVE_TRANSCRIPT_MESSAGES[error] : null,
    start,
    stop,
  }
}
