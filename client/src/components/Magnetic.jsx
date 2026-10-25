import { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'

// Subtle pointer-follow for the primary calls to action. Pointer only: keyboard
// users get the same button, unmoved.
export default function Magnetic({ children, strength = 0.22, className = '' }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  if (reduce) return <div className={className}>{children}</div>

  function handleMove(event) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength)
  }

  function reset() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy, display: 'inline-flex' }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onBlur={reset}
    >
      {children}
    </motion.div>
  )
}
