import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import TopNav from './TopNav.jsx'
import BottomNav from './BottomNav.jsx'
import TestPanel from './TestPanel.jsx'

export default function Layout({ withTabs = false }) {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <>
      <a href="#main" className="vb-skip-link">
        Skip to content
      </a>

      <TopNav />

      <motion.main
        id="main"
        key={pathname}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={withTabs ? 'pb-32' : 'pb-8'}
      >
        <Outlet />
      </motion.main>

      {withTabs ? <BottomNav /> : null}

      <TestPanel />
    </>
  )
}
