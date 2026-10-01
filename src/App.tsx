import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './shared/components/AppShell'
import { DevToolbar } from './shared/components/DevToolbar'
import { ModulePlaceholder } from './shared/components/ModulePlaceholder'
import { REVIEW_SESSION_PATH } from './shared/navigation'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppShell>
        <Routes>
          {/* proto-lofi replaces each placeholder with the module's screens */}
          <Route index element={<ModulePlaceholder module="days" title="Today" />} />
          <Route
            path={`${REVIEW_SESSION_PATH}/:mode`}
            element={<ModulePlaceholder module="review-session" title="Review" exitTo="/" />}
          />
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
