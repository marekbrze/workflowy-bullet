import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { APP_NAME, NAV_ITEMS, REVIEW_SESSION_PATH } from '@/shared/navigation'
import { StorageFailureBanner } from './StorageFailureBanner'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation()
  const isFocusMode = pathname.startsWith(REVIEW_SESSION_PATH)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <StorageFailureBanner />

      {/* Focus mode: during a review session only the session itself is shown. */}
      {!isFocusMode && <TopBar />}

      <main id="main" className="mx-auto w-full max-w-2xl px-4 py-6">
        {children}
      </main>
    </div>
  )
}

function TopBar() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-12 w-full max-w-2xl items-center justify-between px-4">
        <Link to="/" className="text-sm font-semibold">
          {APP_NAME}
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.module}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-2.5 py-1.5 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
                      isActive && 'bg-muted font-medium text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
