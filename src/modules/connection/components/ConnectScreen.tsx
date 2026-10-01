import { ConnectForm, type ConnectSubmit } from './ConnectForm'

/** First run, and the screen after Disconnect. */
export function ConnectScreen({ onConnect }: { onConnect: ConnectSubmit }) {
  return (
    <section aria-labelledby="connect-heading" className="rounded-xl border bg-card p-5">
      <h1 id="connect-heading" className="text-xl font-semibold">
        Connect WorkFlowy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste your WorkFlowy API key so the app can read your days and write your decisions back.
        The key is stored only in this browser.
      </p>
      <div className="mt-4">
        <ConnectForm onSubmit={onConnect} />
      </div>
    </section>
  )
}
