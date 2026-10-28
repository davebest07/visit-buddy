import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { Type } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import MobileNav from './MobileNav.jsx'
import TopNav from './TopNav.jsx'
import TestPanel from './TestPanel.jsx'
import { ThemeToggle } from './ThemeControl.jsx'

const TITLES = {
  '/app': 'Home',
  '/app/before': 'Before a visit',
  '/app/after': 'After a visit',
  '/app/history': 'Visit history',
  '/app/settings': 'Settings',
  '/help': 'Help',
}

export default function Layout() {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const shell = pathname.startsWith('/app') || pathname === '/help'
  const title = pathname.startsWith('/app/visits')
    ? 'Visit record'
    : TITLES[pathname] ?? 'Visit Buddy'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  const skipLink = (
    <a href="#main" className="vb-skip-link">
      Skip to content
    </a>
  )

  const content = (
    <motion.main
      id="main"
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Outlet />
    </motion.main>
  )

  if (!shell) {
    return (
      <>
        <div className="vb-ambient" aria-hidden="true" />
        {skipLink}
        <TopNav />
        {content}
        <TestPanel />
      </>
    )
  }

  return (
    <>
      <div className="vb-ambient" aria-hidden="true" />
      {skipLink}
      <Sidebar />

      <div className="lg:pl-[272px]">
        <MobileNav />

        <header className="sticky top-0 z-30 hidden border-b border-chrome-line bg-chrome backdrop-blur-xl print:hidden lg:block">
          <div className="vb-container flex min-h-tap items-center justify-between gap-4 py-2">
            <p className="text-small font-bold uppercase tracking-[0.14em] text-muted">{title}</p>

            <nav aria-label="Page tools" className="flex items-center gap-1">
              <ThemeToggle className="border-0 bg-transparent" />
              <Link
                to="/app/settings"
                className="flex min-h-tap items-center gap-2 rounded-full px-3 text-small font-bold text-muted transition-colors duration-fast hover:text-primary"
              >
                <Type size={18} strokeWidth={2} aria-hidden="true" />
                Text size
              </Link>
              <Link
                to="/help"
                className="flex min-h-tap items-center rounded-full px-3 text-small font-bold text-muted transition-colors duration-fast hover:text-primary"
              >
                Help
              </Link>
            </nav>
          </div>
        </header>

        {content}
      </div>

      <TestPanel />
    </>
  )
}
