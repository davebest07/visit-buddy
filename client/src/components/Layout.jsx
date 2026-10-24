import { Outlet } from 'react-router-dom'
import TopNav from './TopNav.jsx'
import BottomNav from './BottomNav.jsx'

// Shared page frame. `withTabs` adds the bottom tab bar used by app pages.
// Padding at the bottom keeps content clear of the fixed tab bar.
export default function Layout({ withTabs = false }) {
  return (
    <>
      <a href="#main" className="vb-skip-link">
        Skip to content
      </a>

      <TopNav />

      <main id="main" className={withTabs ? 'pb-24' : undefined}>
        <Outlet />
      </main>

      {withTabs ? <BottomNav /> : null}
    </>
  )
}
