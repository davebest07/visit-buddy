// A stack of previous values, so any change can be undone (brief section 7).
import { useCallback, useRef, useState } from 'react'

const MAX_STEPS = 20

export default function useUndo(initialValue) {
  const [value, setValueState] = useState(initialValue)
  const past = useRef([])

  const setValue = useCallback((next) => {
    setValueState((current) => {
      const resolved = typeof next === 'function' ? next(current) : next
      past.current = [...past.current.slice(-(MAX_STEPS - 1)), current]
      return resolved
    })
  }, [])

  const undo = useCallback(() => {
    if (past.current.length === 0) return false
    const previous = past.current[past.current.length - 1]
    past.current = past.current.slice(0, -1)
    setValueState(previous)
    return true
  }, [])

  const reset = useCallback((next) => {
    past.current = []
    setValueState(next)
  }, [])

  return {
    value,
    setValue,
    undo,
    reset,
    canUndo: past.current.length > 0,
  }
}
