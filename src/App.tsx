import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { ReviewSessionPage } from './modules/review-session'
import { AppShell } from './shared/components/AppShell'
import { DevToolbar } from './shared/components/DevToolbar'
import { ModulePlaceholder } from './shared/components/ModulePlaceholder'
import { REVIEW_SESSION_PATH } from './shared/navigation'

// Temporary entry points into a session until the `days` module has its real home screen.
function SessionLinks() {
  return (
    <ul className="mt-4 space-y-2 text-sm">
      {(['yesterday', 'today', 'backlog'] as const).map((mode) => (
        <li key={mode}>
          <Link to={`${REVIEW_SESSION_PATH}/${mode}`} className="underline underline-offset-4">
            Start {mode} session
          </Link>
        </li>
      ))}
    </ul>
  )
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppShell>
        <Routes>
          {/* proto-lofi replaces each placeholder with the module's screens */}
          <Route
            index
            element={
              <ModulePlaceholder module="days" title="Today">
                <SessionLinks />
              </ModulePlaceholder>
            }
          />
          <Route path={`${REVIEW_SESSION_PATH}/:mode`} element={<ReviewSessionPage />} />
          <Route
            path="/connection"
            element={<ModulePlaceholder module="connection" title="Connection" />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
      <DevToolbar />
    </BrowserRouter>
  )
}

export default App
