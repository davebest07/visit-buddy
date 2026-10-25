import { AnimatePresence, motion } from 'motion/react'

// Short message above the dock. Announced politely to screen readers.
export default function Toast({ message, className = '' }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          key="toast"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed inset-x-4 bottom-28 z-50 mx-auto w-fit max-w-md rounded-full bg-navy px-6 py-3 text-body text-paper shadow-lift ${className}`}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
