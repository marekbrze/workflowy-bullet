import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { Kbd } from '@/shared/components/Kbd'
import { TextLink } from '@/shared/components/TextLink'
import { WriteErrorNotice } from '@/shared/components/WriteErrorNotice'
import { InvalidKeyNotice } from '@/modules/connection/components/InvalidKeyNotice'
import { useConnection } from '@/modules/connection/hooks/use-connection'
import { DestinationPicker } from '@/modules/note-filing/components/DestinationPicker'
import { useHotkeys } from '../hooks/use-hotkeys'
import { useReviewSession } from '../hooks/use-review-session'
import { getStep } from '../lib/session-logic'
import type { EntryType } from '../types/entry'
import { REVIEW_MODES, type ReviewMode } from '../types/session'
import { DecisionBar } from './DecisionBar'
import { EntryCard } from './EntryCard'
import { EntryCardSkeleton } from './EntryCardSkeleton'
import { SessionSummary } from './SessionSummary'
import { SessionToolbar } from './SessionToolbar'

const MODE_LABELS: Record<ReviewMode, string> = {
  today: "Today's review",
  yesterday: "Yesterday's review",
  backlog: 'Backlog review',
}

export function ReviewSessionPage() {
  const { mode } = useParams()
  const navigate = useNavigate()
  const connection = useConnection()
  if (!REVIEW_MODES.includes(mode as ReviewMode)) return <UnknownMode />
  if (connection.status === 'disconnected') return <Navigate to="/" replace />
  // The session itself stays stored; it resumes once the key works again.
  if (connection.status === 'invalid') {
    return <InvalidKeyNotice interruptedSession onChangeKey={() => navigate('/connection')} />
  }
  return <ReviewSession mode={mode as ReviewMode} />
}

function UnknownMode() {
  return (
    <section aria-labelledby="unknown-mode-heading" className="rounded-xl border bg-card p-6">
      <h1 id="unknown-mode-heading" className="text-xl font-semibold">
        That review doesn&rsquo;t exist
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Start a review from the Today screen instead.
      </p>
      <TextLink to="/" className="mt-4">
        Back to Today
      </TextLink>
    </section>
  )
}

function ReviewSession({ mode }: { mode: ReviewMode }) {
  const navigate = useNavigate()
  const review = useReviewSession(mode)
  const [confirming, setConfirming] = useState<'delete' | 'end' | null>(null)
  const [retyping, setRetyping] = useState(false)

  const { session, currentEntry, error, start, candidateCount } = review

  // Open a session as soon as there is something to process. After a failed save, wait for "Try again".
  useEffect(() => {
    if (!session && candidateCount > 0 && !error) start()
  })

  // A resumed session picks up entries that arrived since it started — once per visit.
  const resumed = useRef(false)
  useEffect(() => {
    if (!session || resumed.current) return
    resumed.current = true
    review.addNewEntries()
  })

  const exit = () => navigate('/')
  const step = currentEntry ? getStep(currentEntry) : null
  const queueLength = review.queue.length
  const overlayOpen = confirming !== null || step === 'note'
  const locked = error !== null
  // Correcting a type is offered while the entry is on its task step.
  const canChangeType = step === 'task'
  const showClassify = step === 'classify' || (canChangeType && retyping)

  const classify = (type: EntryType) => {
    if (retyping) {
      setRetyping(false)
      if (currentEntry?.type === type) return
    }
    review.classify(type)
  }

  const handlers: Record<string, () => void> = {
    escape: () => (retyping ? setRetyping(false) : exit()),
    k: review.undo,
  }
  if (currentEntry) {
    handlers.j = review.skip
    handlers.l = () => setConfirming('delete')
    if (canChangeType) handlers.g = () => setRetyping((value) => !value)
    if (showClassify) {
      handlers.a = () => classify('task')
      handlers.s = () => classify('note')
      handlers.d = () => classify('event')
    } else if (step === 'task') {
      handlers.a = () => review.decideTask('done')
      handlers.s = () => review.decideTask('roll-over')
      handlers.d = () => review.decideTask('irrelevant')
      if (mode === 'today') handlers.f = () => review.decideTask('leave-open')
    }
  }
  useHotkeys(handlers, !overlayOpen && !locked)

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <Button variant="ghost" size="sm" onClick={exit} aria-keyshortcuts="Escape">
        ← Exit <Kbd>esc</Kbd>
      </Button>
      <span className="text-sm text-muted-foreground">{MODE_LABELS[mode]}</span>
      <Button
        variant="ghost"
        size="sm"
        disabled={!session}
        onClick={() => setConfirming('end')}
      >
        End review
      </Button>
    </div>
  )

  // Nothing to process and no session to resume.
  if (!session && candidateCount === 0) {
    return (
      <>
        {header}
        <section aria-labelledby="empty-heading" className="rounded-xl border bg-card p-6">
          <h1 id="empty-heading" className="text-xl font-semibold">
            Nothing to review
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            There are no entries waiting in this queue.
          </p>
          <TextLink to="/" className="mt-4">
            Back to Today
          </TextLink>
        </section>
      </>
    )
  }

  // Between mount and the session being saved — or when saving it failed.
  if (!session) {
    return (
      <>
        {header}
        {error ? <WriteErrorNotice onRetry={review.retry} /> : <EntryCardSkeleton />}
      </>
    )
  }

  const processed = session.total - queueLength

  return (
    <>
      {header}

      {currentEntry && step ? (
        <>
          <EntryCard
            key={currentEntry.id}
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
              step={showClassify ? 'classify' : 'task'}
              mode={mode}
              heading={retyping && step === 'task' ? 'Change type to…' : undefined}
              disabled={locked}
              onClassify={classify}
              onTask={review.decideTask}
            />
          )}
          <SessionToolbar
            canSkip={queueLength > 1}
            canUndo={review.canUndo}
            undoLabel={review.undoLabel}
            canChangeType={canChangeType}
            disabled={locked}
            onSkip={review.skip}
            onUndo={review.undo}
            onChangeType={() => setRetyping((value) => !value)}
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

      {review.notice && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          {review.notice}
        </p>
      )}

      {/* While a note is being filed the error is shown inside the picker, which stays open. */}
      {error && step !== 'note' && (
        <WriteErrorNotice
          onRetry={review.retry}
          onDismiss={review.canDismissError ? review.dismissError : undefined}
        />
      )}

      <DestinationPicker
        open={step === 'note' && confirming === null}
        onPick={review.decideNote}
        currentMirror={currentEntry?.mirroredTo}
        excludeIds={currentEntry ? [currentEntry.id] : undefined}
        onBack={review.canGoBack ? review.undo : undefined}
        error={error !== null}
        onRetry={review.retry}
        onDismissError={review.canDismissError ? review.dismissError : undefined}
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
        title="End this review?"
        description="Your decisions stay in WorkFlowy, but you won't be able to undo them any more."
        confirmLabel="End review"
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
