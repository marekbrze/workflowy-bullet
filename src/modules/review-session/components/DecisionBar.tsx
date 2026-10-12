import { Button } from '@/components/ui/button'
import { Kbd } from '@/shared/components/Kbd'
import type { ClassifyChoice, ReviewMode } from '../types/session'
import type { TaskDecision } from '../lib/session-logic'

interface DecisionBarProps {
  step: 'classify' | 'task'
  mode: ReviewMode
  onClassify: (choice: ClassifyChoice) => void
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

// Positional right-hand home-row keys: the first option is always J, then K, L, ; and '.
// (The left hand's A S D F are for the toolbar.)
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
          { key: 'j', label: 'Task', onSelect: () => onClassify('task') },
          { key: 'k', label: 'Note', onSelect: () => onClassify('note-in-day') },
          { key: 'l', label: 'Note → migrate', onSelect: () => onClassify('note') },
          { key: ';', label: 'Event', onSelect: () => onClassify('event') },
          { key: "'", label: 'Archive', onSelect: () => onClassify('archive') },
        ]
      : [
          { key: 'j', label: 'Done', onSelect: () => onTask('done') },
          {
            key: 'k',
            label: mode === 'today' ? 'Roll over to tomorrow' : 'Roll over to today',
            onSelect: () => onTask('roll-over'),
          },
          { key: 'l', label: 'Irrelevant', onSelect: () => onTask('irrelevant') },
          ...(mode === 'today'
            ? [{ key: ';', label: 'Leave open', onSelect: () => onTask('leave-open') }]
            : []),
        ]

  return (
    <section aria-labelledby="decision-heading" className="mt-4">
      <h2 id="decision-heading" className="mb-2 text-base font-medium">
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
            aria-keyshortcuts={option.key}
          >
            {option.label}
            <Kbd>{option.key}</Kbd>
          </Button>
        ))}
      </div>
    </section>
  )
}
