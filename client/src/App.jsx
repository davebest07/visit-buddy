import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Landing from './pages/Landing.jsx'
import Home from './pages/Home.jsx'
import Before from './pages/Before.jsx'
import After from './pages/After.jsx'
import VisitDetail from './pages/VisitDetail.jsx'
import History from './pages/History.jsx'
import Settings from './pages/Settings.jsx'
import Help from './pages/Help.jsx'

export default function App() {
  return (
    <Routes>
      {/* Layout picks the shell: sidebar for app + help, marketing bar for the landing page. */}
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/help" element={<Help />} />

        <Route path="/app" element={<Home />} />
        <Route path="/app/before" element={<Before />} />
        <Route path="/app/after" element={<After />} />
        <Route path="/app/visits/:id" element={<VisitDetail />} />
        <Route path="/app/history" element={<History />} />
        <Route path="/app/settings" element={<Settings />} />
      </Route>

      {/* Unknown URL: send people back to the start. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
