import { Button } from '@/components/ui/button'
import { Kbd } from '@/shared/components/Kbd'
import type { EntryType } from '../types/entry'
import type { ReviewMode } from '../types/session'
import type { TaskDecision } from '../lib/session-logic'

interface DecisionBarProps {
  step: 'classify' | 'task'
  mode: ReviewMode
  onClassify: (type: EntryType) => void
  onTask: (decision: TaskDecision) => void
  /** Replaces the default question, e.g. when correcting a type */
  heading?: string
  disabled?: boolean
}

interface Option {
  key: string
  label: string
  onSelect: () => void
}

// Positional home-row keys: the first option is always A, then S, D, F.
export function DecisionBar({
  step,
  mode,
  onClassify,
  onTask,
  heading,
  disabled,
}: DecisionBarProps) {
  const options: Option[] =
    step === 'classify'
      ? [
          { key: 'a', label: 'Task', onSelect: () => onClassify('task') },
          { key: 's', label: 'Note', onSelect: () => onClassify('note') },
          { key: 'd', label: 'Event', onSelect: () => onClassify('event') },
        ]
      : [
          { key: 'a', label: 'Done', onSelect: () => onTask('done') },
          {
            key: 's',
            label: mode === 'today' ? 'Roll over to tomorrow' : 'Roll over to today',
            onSelect: () => onTask('roll-over'),
          },
          { key: 'd', label: 'Irrelevant', onSelect: () => onTask('irrelevant') },
          ...(mode === 'today'
            ? [{ key: 'f', label: 'Leave open', onSelect: () => onTask('leave-open') }]
            : []),
        ]

  return (
    <section aria-labelledby="decision-heading" className="mt-4">
      <h2 id="decision-heading" className="mb-2 text-sm text-muted-foreground">
        {heading ?? (step === 'classify' ? 'What is this?' : 'What happens to this task?')}
      </h2>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.key}
            variant="outline"
            size="lg"
            className="h-11 px-4 text-base"
            onClick={option.onSelect}
            disabled={disabled}
          >
            {option.label}
            <Kbd>{option.key}</Kbd>
          </Button>
        ))}
      </div>
    </section>
  )
}
