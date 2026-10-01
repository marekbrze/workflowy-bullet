import { useNavigate } from 'react-router-dom'
import { ConnectScreen } from '@/modules/connection/components/ConnectScreen'
import { SAVED_CONNECTION_UNREADABLE } from '@/modules/connection/components/ConnectionPage'
import { InvalidKeyNotice } from '@/modules/connection/components/InvalidKeyNotice'
import { SnapshotStatus } from '@/modules/connection/components/SnapshotStatus'
import { useConnection } from '@/modules/connection/hooks/use-connection'
import type { ReviewMode } from '@/modules/review-session/types/session'
import { useTransitionFocus } from '@/shared/hooks/use-transition-focus'
import { REVIEW_SESSION_PATH } from '@/shared/navigation'
import { useDays } from '../hooks/use-days'
import { BacklogBlock } from './BacklogBlock'
import { TodayList } from './TodayList'
import { UnreadableDataNotice } from './UnreadableDataNotice'
import { YesterdayCard } from './YesterdayCard'

export function HomePage() {
  const navigate = useNavigate()
  const days = useDays()
  const connection = useConnection()
  // After connecting, the connect screen disappears: focus lands on the home heading, not nowhere.
  const headingRef = useTransitionFocus<HTMLHeadingElement>(connection.status === 'connected')

  const start = (mode: ReviewMode) => navigate(`${REVIEW_SESSION_PATH}/${mode}`)

  // Without a working connection there is nothing to show: lead the user to fix it.
  if (connection.status === 'disconnected') {
    return (
      <ConnectScreen
        onConnect={connection.submit}
        notice={connection.unreadable ? SAVED_CONNECTION_UNREADABLE : null}
      />
    )
  }
  if (connection.status === 'invalid') {
    return <InvalidKeyNotice onChangeKey={() => navigate('/connection')} />
  }

  // Saved entries that exist but cannot be read must not look like "no entries".
  if (days.entriesUnreadable) return <UnreadableDataNotice onStartFresh={days.startFresh} />

  const allClear =
    days.yesterdayStatus.waiting === 0 && days.todayStatus.waiting === 0 && days.backlog.length === 0

  return (
    <div className="space-y-6">
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        Today
      </h1>

      {allClear && (
        <p role="status" className="text-sm text-muted-foreground">
          {days.isEmpty ? 'No entries yet. Nothing to process.' : 'All clear. Nothing is waiting.'}
        </p>
      )}

      <YesterdayCard
        day={days.yesterdayStatus}
        remaining={days.remaining('yesterday')}
        onStart={() => start('yesterday')}
      />
      <TodayList
        entries={days.todayEntries}
        waiting={days.todayStatus.waiting}
        remaining={days.remaining('today')}
        tomorrowCount={days.tomorrowCount}
        onQuickType={days.quickType}
        onFileNote={days.fileNote}
        onStart={() => start('today')}
      />
      <BacklogBlock
        days={days.backlog}
        remaining={days.remaining('backlog')}
        onStart={() => start('backlog')}
      />

      <SnapshotStatus />
    </div>
  )
}
