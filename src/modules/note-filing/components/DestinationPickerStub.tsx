import { Button } from '@/components/ui/button'
import { Kbd } from '@/shared/components/Kbd'
import { ModalDialog } from '@/shared/components/ModalDialog'
import type { Destination } from '../types/destination'

export const MOCK_DESTINATIONS: Destination[] = [
  { id: 'dest-reading', name: 'Reading list', path: ['Projects', 'Learning'], childCount: 12 },
  { id: 'dest-ideas', name: 'Ideas inbox', path: ['Inbox'], childCount: 34 },
  { id: 'dest-renovation', name: 'Renovation', path: ['Projects', 'Home'], childCount: 8 },
]

interface DestinationPickerStubProps {
  open: boolean
  /** `null` keeps the note in its day. */
  onPick: (destination: Destination | null) => void
}

// Placeholder until `proto-lofi note-filing` builds the real picker (search, recent, pinned).
export function DestinationPickerStub({ open, onPick }: DestinationPickerStubProps) {
  return (
    <ModalDialog open={open} title="Where should this note live?" onCancel={() => onPick(null)}>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder for the destination picker — it will get search, recent and pinned places.
      </p>
      <ul className="mt-4 space-y-2">
        {MOCK_DESTINATIONS.map((destination) => (
          <li key={destination.id}>
            <Button
              variant="outline"
              className="h-auto w-full justify-start py-2 text-left"
              onClick={() => onPick(destination)}
            >
              <span className="flex flex-col items-start">
                <span>{destination.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {destination.path.join(' › ')} · {destination.childCount} items
                </span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={() => onPick(null)}>
          Keep in day <Kbd>Esc</Kbd>
        </Button>
      </div>
    </ModalDialog>
  )
}
