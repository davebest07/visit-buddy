// A stack of previous values, so any change can be undone (brief section 7).
//
// One undo step = one whole edit, not one keystroke:
//   setValue(next, { group: 'questions:2' })  typing in one field. Every change
//                                              with the same group joins one step
//                                              until the group ends.
//   setValue(next)                             a delete, reorder or tick: always
//                                              its own step.
//   endGroup()                                 call when a field loses focus, so
//                                              typing there again is a new step.
//                                              Pages put it on a wrapper's onBlur
//                                              (blur bubbles in React).
import { useCallback, useRef, useState } from 'react'

const MAX_STEPS = 20

export default function useUndo(initialValue) {
  const [value, setValueState] = useState(initialValue)
  const [depth, setDepth] = useState(0)
  const current = useRef(initialValue)
  const past = useRef([])
  const openGroup = useRef(null)

  const push = useCallback((snapshot) => {
    past.current = [...past.current.slice(-(MAX_STEPS - 1)), snapshot]
    setDepth(past.current.length)
  }, [])

  const setValue = useCallback(
    (next, { group = null } = {}) => {
      const before = current.current
      const resolved = typeof next === 'function' ? next(before) : next
      if (Object.is(resolved, before)) return

      // Still typing in the same field: the step saved at its start covers it.
      if (!group || group !== openGroup.current) push(before)
      openGroup.current = group

      current.current = resolved
      setValueState(resolved)
    },
    [push],
  )

  const endGroup = useCallback(() => {
    openGroup.current = null
  }, [])

  const undo = useCallback(() => {
    openGroup.current = null
    if (past.current.length === 0) return false
    const previous = past.current[past.current.length - 1]
    past.current = past.current.slice(0, -1)
    setDepth(past.current.length)
    current.current = previous
    setValueState(previous)
    return true
  }, [])

  const reset = useCallback((next) => {
    openGroup.current = null
    past.current = []
    setDepth(0)
    current.current = next
    setValueState(next)
  }, [])

  return {
    value,
    setValue,
    endGroup,
    undo,
    reset,
    canUndo: depth > 0,
  }
}
