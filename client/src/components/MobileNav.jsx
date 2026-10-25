import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { Brand, NavList } from './Sidebar.jsx'

// Mobile shell: a compact top bar plus an accessible slide-in drawer.
export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const closeRef = useRef(null)
  const menuRef = useRef(null)
  const navRef = useRef(null)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return undefined

    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        menuRef.current?.focus()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = navRef.current?.querySelectorAll(
        'a[href], button:not([disabled])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/65 backdrop-blur-xl lg:hidden print:hidden">
        <div className="flex min-h-tap items-center justify-between gap-3 px-4 py-2">
          <button
            ref={menuRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-label="Open navigation menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink"
          >
            <Menu size={22} strokeWidth={2} aria-hidden="true" />
          </button>

          <Link to="/app" className="font-display text-subhead font-semibold text-ink">
            Visit Buddy
          </Link>

          <Link to="/help" className="text-small font-bold text-muted">
            Help
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-navy/40"
            />

            <motion.nav
              ref={navRef}
              role="dialog"
              aria-modal="true"
              aria-label="Main"
              initial={reduce ? false : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col bg-sidebar p-4 shadow-lift"
            >
              <div className="flex items-center justify-between gap-3 pb-4">
                <Brand />
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink"
                >
                  <X size={22} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>

              <div className="border-t border-sidebar-line pt-4">
                <NavList onNavigate={() => setOpen(false)} />
              </div>

              <div className="mt-auto border-t border-sidebar-line pt-3">
                <Link
                  to="/help"
                  onClick={() => setOpen(false)}
                  className="flex min-h-tap items-center rounded-[14px] px-4 text-body font-bold text-muted"
                >
                  Help &amp; support
                </Link>
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
