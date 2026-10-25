import { motion, useReducedMotion } from 'motion/react'

// Fade-and-rise on first view. Skips itself entirely under reduced motion.
export default function Reveal({
  children,
  as = 'div',
  delay = 0,
  y = 28,
  className = '',
  amount = 0.25,
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as] ?? motion.div

  if (reduce) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  )
}
