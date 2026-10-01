import { useNavigate } from 'react-router-dom'
import { ConnectScreen } from '@/modules/connection/components/ConnectScreen'
import { InvalidKeyNotice } from '@/modules/connection/components/InvalidKeyNotice'
import { SnapshotStatus } from '@/modules/connection/components/SnapshotStatus'
import { useConnection } from '@/modules/connection/hooks/use-connection'
import type { ReviewMode } from '@/modules/review-session/types/session'
import { REVIEW_SESSION_PATH } from '@/shared/navigation'
import { useDays } from '../hooks/use-days'
import { BacklogBlock } from './BacklogBlock'
import { TodayList } from './TodayList'
import { YesterdayCard } from './YesterdayCard'

export function HomePage() {
  const navigate = useNavigate()
  const days = useDays()
  const connection = useConnection()

  const start = (mode: ReviewMode) => navigate(`${REVIEW_SESSION_PATH}/${mode}`)
  const remaining = (mode: ReviewMode) => days.sessionFor(mode)?.queue.length ?? null

  // Without a working connection there is nothing to show: lead the user to fix it.
  if (connection.status === 'disconnected') return <ConnectScreen onConnect={connection.connect} />
  if (connection.status === 'invalid') {
    return <InvalidKeyNotice onChangeKey={() => navigate('/connection')} />
  }

  const allClear =
    days.yesterdayStatus.waiting === 0 && days.todayStatus.waiting === 0 && days.backlog.length === 0

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Today</h1>

      {allClear && (
        <p role="status" className="text-sm text-muted-foreground">
          {days.isEmpty ? 'No entries yet. Nothing to process.' : 'All clear. Nothing is waiting.'}
        </p>
      )}

      <YesterdayCard
        day={days.yesterdayStatus}
        remaining={remaining('yesterday')}
        onStart={() => start('yesterday')}
      />
      <TodayList
        entries={days.todayEntries}
        waiting={days.todayStatus.waiting}
        remaining={remaining('today')}
        onQuickType={days.quickType}
        onStart={() => start('today')}
      />
      <BacklogBlock
        days={days.backlog}
        remaining={remaining('backlog')}
        onStart={() => start('backlog')}
      />

      <SnapshotStatus />
    </div>
  )
}
