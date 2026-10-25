'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '../../lib/utils'

/**
 * Aceternity UI — Flip Words.
 *
 * Source: https://ui.aceternity.com/registry/flip-words-demo.json
 * Adapted to this project's JSX setup, with four fixes:
 *   1. the timeout is cleared on unmount and between words (no timer leak)
 *   2. an empty `words` array falls back instead of crashing
 *   3. prefers-reduced-motion renders one static word and stops cycling
 *   4. the animated text is aria-hidden, so screen readers never re-announce
 *      every word; callers provide a stable label.
 */
export function FlipWords({ words = [], duration = 3000, className }) {
  const list = useMemo(() => (words.length > 0 ? words : ['prepared']), [words])
  const reduce = useReducedMotion()

  const [currentWord, setCurrentWord] = useState(list[0])
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef(null)

  // If the caller swaps the word list, snap back to a word that exists.
  useEffect(() => {
    if (!list.includes(currentWord)) setCurrentWord(list[0])
  }, [list, currentWord])

  const startAnimation = useCallback(() => {
    const index = list.indexOf(currentWord)
    const next = list[(index + 1) % list.length]
    setCurrentWord(next)
    setIsAnimating(true)
  }, [currentWord, list])

  useEffect(() => {
    if (reduce || isAnimating) return undefined

    timerRef.current = setTimeout(startAnimation, duration)
    return () => clearTimeout(timerRef.current)
  }, [isAnimating, duration, startAnimation, reduce])

  if (reduce) {
    return (
      <span aria-hidden="true" className={cn('inline-block text-left text-primary', className)}>
        {list[0]}
      </span>
    )
  }

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false)
      }}
    >
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 10 }}
        exit={{
          opacity: 0,
          y: -40,
          x: 40,
          filter: 'blur(8px)',
          scale: 2,
          position: 'absolute',
        }}
        className={cn(
          'relative z-10 inline-block text-left text-primary',
          className,
        )}
        key={currentWord}
      >
        {currentWord.split(' ').map((word, wordIndex, parts) => (
          <motion.span
            key={`${word}-${wordIndex}`}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: wordIndex * 0.3, duration: 0.3 }}
            className="inline-block whitespace-nowrap"
          >
            {word.split('').map((letter, letterIndex) => (
              <motion.span
                key={`${letter}-${letterIndex}`}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: wordIndex * 0.3 + letterIndex * 0.05,
                  duration: 0.2,
                }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
            {wordIndex < parts.length - 1 ? (
              <span className="inline-block">&nbsp;</span>
            ) : null}
          </motion.span>
        ))}
      </motion.span>
    </AnimatePresence>
  )
}
