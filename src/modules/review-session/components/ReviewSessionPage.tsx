import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Kbd } from '@/shared/components/Kbd'
import { DestinationPickerStub } from '@/modules/note-filing/components/DestinationPickerStub'
import { useHotkeys } from '../hooks/use-hotkeys'
import { useReviewSession } from '../hooks/use-review-session'
import { getStep } from '../lib/session-logic'
import { REVIEW_MODES, type ReviewMode } from '../types/session'
import { DecisionBar } from './DecisionBar'
import { EntryCard } from './EntryCard'
import { SessionSummary } from './SessionSummary'
import { SessionToolbar } from './SessionToolbar'
import { WriteErrorNotice } from './WriteErrorNotice'

const MODE_LABELS: Record<ReviewMode, string> = {
  today: 'Today',
  yesterday: 'Yesterday review',
  backlog: 'Backlog',
}

export function ReviewSessionPage() {
  const { mode } = useParams()
  if (!REVIEW_MODES.includes(mode as ReviewMode)) return <Navigate to="/" replace />
  return <ReviewSession mode={mode as ReviewMode} />
}

function ReviewSession({ mode }: { mode: ReviewMode }) {
  const navigate = useNavigate()
  const review = useReviewSession(mode)
  const [confirming, setConfirming] = useState<'delete' | 'end' | null>(null)

  const { session, currentEntry, error, start, candidateCount } = review

  // Open a session as soon as there is something to process; a stored one is resumed as is.
  useEffect(() => {
    if (!session && candidateCount > 0) start()
  }, [session, candidateCount, start])

  const exit = () => navigate('/')
  const step = currentEntry ? getStep(currentEntry) : null
  const queueLength = session?.queue.length ?? 0
  const overlayOpen = confirming !== null || step === 'note'

  const handlers: Record<string, () => void> = {
    escape: exit,
    k: review.undo,
  }
  if (currentEntry) {
    handlers.j = review.skip
    handlers.l = () => setConfirming('delete')
    if (step === 'classify') {
      handlers.a = () => review.classify('task')
      handlers.s = () => review.classify('note')
      handlers.d = () => review.classify('event')
    }
    if (step === 'task') {
      handlers.a = () => review.decideTask('done')
      handlers.s = () => review.decideTask('roll-over')
      handlers.d = () => review.decideTask('irrelevant')
      if (mode === 'today') handlers.f = () => review.decideTask('leave-open')
    }
  }
  useHotkeys(handlers, !overlayOpen && !error)

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <Button variant="ghost" size="sm" onClick={exit}>
        ← Exit <Kbd>esc</Kbd>
      </Button>
      <span className="text-sm text-muted-foreground">{MODE_LABELS[mode]}</span>
      <Button
        variant="ghost"
        size="sm"
        disabled={!session}
        onClick={() => setConfirming('end')}
      >
        End session
      </Button>
    </div>
  )

  // Nothing to process and no session to resume.
  if (!session && candidateCount === 0) {
    return (
      <>
        {header}
        <section aria-labelledby="empty-heading" className="rounded-xl border bg-card p-5">
          <h1 id="empty-heading" className="text-xl font-semibold">
            Nothing to review
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            There are no entries waiting in this queue.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm underline underline-offset-4">
            Back to Today
          </Link>
        </section>
      </>
    )
  }

  if (!session) return null

  const processed = session.total - queueLength

  return (
    <>
      {header}

      {currentEntry && step ? (
        <>
          <EntryCard
            entry={currentEntry}
            position={processed + 1}
            total={session.total}
            today={review.today}
          />
          {/* Announce each new entry to screen readers */}
          <p className="sr-only" aria-live="polite">
            Entry {processed + 1} of {session.total}: {currentEntry.text}
          </p>
          {step !== 'note' && (
            <DecisionBar
              step={step}
              mode={mode}
              onClassify={review.classify}
              onTask={review.decideTask}
            />
          )}
          <SessionToolbar
            canSkip={queueLength > 1}
            canUndo={review.canUndo}
            onSkip={review.skip}
            onUndo={review.undo}
            onDelete={() => setConfirming('delete')}
          />
        </>
      ) : (
        <SessionSummary
          processed={processed}
          canUndo={review.canUndo}
          onUndo={review.undo}
          onDone={() => {
            review.end()
            exit()
          }}
        />
      )}

      {error && <WriteErrorNotice onRetry={review.retry} />}

      <DestinationPickerStub
        open={step === 'note' && confirming === null && !error}
        onPick={review.decideNote}
      />

      <ConfirmDialog
        open={confirming === 'delete'}
        title="Delete this entry?"
        description="It will be permanently removed from WorkFlowy. This cannot be undone."
        confirmLabel="Delete permanently"
        destructive
        onConfirm={() => {
          setConfirming(null)
          review.deleteCurrent()
        }}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming === 'end'}
        title="End this session?"
        description="Your decisions stay in WorkFlowy, but you won't be able to undo them any more."
        confirmLabel="End session"
        onConfirm={() => {
          setConfirming(null)
          review.end()
          exit()
        }}
        onCancel={() => setConfirming(null)}
      />
    </>
  )
}
