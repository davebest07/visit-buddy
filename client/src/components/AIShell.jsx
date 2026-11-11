import { useCallback, useEffect, useRef, useState } from 'react'
import Button from './Button.jsx'
import LoadingSteps from './LoadingSteps.jsx'

const MESSAGES = {
  unavailable: 'Visit Buddy is paused right now.',
  timeout: 'This is taking too long.',
  ratelimit: 'Too many requests, please wait a minute.',
  empty: 'I could not write this up reliably.',
  notconfigured: 'The AI is not set up yet.',
  invalid: 'That request could not be sent.',
}

function isUnusable(result) {
  if (!result) return true
  if (Array.isArray(result)) return result.length === 0
  if (result.status === 'empty') return true
  if (result.found === false && !result.answer) return true

  const lists = [result.questions, result.summary, result.todos, result.meds].filter(Array.isArray)
  return lists.length > 0 && lists.every((list) => list.length === 0)
}

function hasUncertainLines(result) {
  if (!result || Array.isArray(result)) return false
  if (result.flags?.length) return true
  const items = [...(result.summary ?? []), ...(result.todos ?? []), ...(result.meds ?? [])]
  return items.some((item) => item.flagged || item.needsCheck)
}

/**
 * Owns one AI request's state machine: empty -> loading -> success | uncertain | error.
 * Pages pass their own request function and render the result themselves.
 */
export function useAICall(request) {
  const [status, setStatus] = useState('empty')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const controllerRef = useRef(null)
  const timerRef = useRef(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const run = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const startedAt = Date.now()
    stopTimer()
    setStatus('loading')
    setError(null)
    setData(null)
    setElapsed(0)

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    try {
      const result = await request(controller.signal)
      if (controller.signal.aborted) return

      if (isUnusable(result)) {
        setStatus('error')
        setError({ kind: 'empty', message: MESSAGES.empty })
      } else {
        setData(result)
        setStatus(hasUncertainLines(result) ? 'uncertain' : 'success')
      }
    } catch (caught) {
      if (caught.name === 'AbortError') {
        setStatus('empty')
        setData(null)
        setError(null)
      } else {
        setError(caught)
        setStatus('error')
      }
    } finally {
      stopTimer()
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [request, stopTimer])

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    stopTimer()
    setStatus('empty')
    setData(null)
    setError(null)
    setElapsed(0)
  }, [stopTimer])

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
      stopTimer()
    }
  }, [stopTimer])

  return { status, data, error, elapsed, run, cancel, reset }
}

export default function AIShell({
  status,
  error,
  elapsed = 0,
  steps = [],
  emptyState,
  loadingTitle = 'Working on it',
  onCancel,
  onRetry,
  onReset,
  onTypeInstead,
  children,
}) {
  if (status === 'empty') {
    return <section>{emptyState}</section>
  }

  if (status === 'loading') {
    return (
      <section aria-live="polite" aria-busy="true" className="rounded-card bg-surface-2 p-6 md:p-8">
        <p className="text-small font-bold uppercase tracking-[0.14em] text-accent">Checking</p>
        <h2 className="mt-2 font-display text-heading font-semibold">{loadingTitle}</h2>

        <LoadingSteps steps={steps} elapsed={elapsed} />

        <p className="mt-6 text-small text-muted" aria-live="polite">
          {elapsed} second{elapsed === 1 ? '' : 's'}. Your words are kept.
        </p>

        {elapsed >= 10 && onCancel ? (
          <div className="mt-4">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <p className="mt-2 text-small text-muted">
              Cancel stops the request and keeps what you typed.
            </p>
          </div>
        ) : null}
      </section>
    )
  }

  if (status === 'error') {
    const kind = error?.kind ?? 'unavailable'
    const message = error?.kind === 'empty' ? MESSAGES.empty : MESSAGES[kind] ?? MESSAGES.unavailable

    return (
      <section role="alert" className="rounded-card border-l-4 border-error bg-surface p-6 md:p-8">
        <h2 className="text-subhead font-bold text-error">{message}</h2>

        <p className="mt-2 max-w-measure text-body text-muted">
          {kind === 'empty'
            ? 'Nothing usable came back. You can try again, record again, or write it yourself.'
            : kind === 'notconfigured'
              ? 'Add GEMINI_API_KEY to the server .env file, restart the server, then try again.'
              : 'The text you entered is still here. Nothing was saved.'}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {onRetry ? (
            <Button onClick={onRetry} variant="secondary">
              Retry
            </Button>
          ) : null}

          {onTypeInstead ? (
            <Button onClick={onTypeInstead} variant="quiet">
              Type it instead
            </Button>
          ) : null}

          {onReset ? (
            <Button onClick={onReset} variant="quiet">
              Start over
            </Button>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section>
      {status === 'uncertain' ? (
        <p className="mb-6 flex gap-3 rounded-card bg-tint-sky p-4 text-small font-bold">
          <span aria-hidden="true">!</span>
          Some lines were hard to hear. Check the highlighted lines before you save.
        </p>
      ) : null}

      {children}
    </section>
  )
}
