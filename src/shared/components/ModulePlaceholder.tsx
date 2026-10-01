import { Link } from 'react-router-dom'

interface ModulePlaceholderProps {
  module: string
  title: string
  /** Shown in focus mode, where the top bar is hidden */
  exitTo?: string
}

// Temporary route content — proto-lofi replaces it with the module's real screens.
export function ModulePlaceholder({ module, title, exitTo }: ModulePlaceholderProps) {
  return (
    <section aria-labelledby="placeholder-title">
      <h1 id="placeholder-title" className="text-xl font-semibold">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder for the <code>{module}</code> module.
      </p>
      {exitTo && (
        <Link to={exitTo} className="mt-4 inline-block text-sm underline underline-offset-4">
          Exit
        </Link>
      )}
    </section>
  )
}
