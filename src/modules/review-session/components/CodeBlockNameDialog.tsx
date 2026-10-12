import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModalDialog } from '@/shared/components/ModalDialog'
import type { EntryType } from '../types/entry'

interface CodeBlockNameDialogProps {
  /** The type being given; `null` keeps the dialog closed */
  type: EntryType | null
  busy?: boolean
  onSubmit: (name: string) => void
  onCancel: () => void
}

/** A code block is never tagged: it is named, and the code goes under the name. */
export function CodeBlockNameDialog({ type, busy, onSubmit, onCancel }: CodeBlockNameDialogProps) {
  const [name, setName] = useState('')
  const trimmed = name.trim()
  const close = () => {
    setName('')
    onCancel()
  }

  return (
    <ModalDialog open={type !== null} title="Name this code block" onCancel={close}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!trimmed || busy) return
          onSubmit(trimmed)
          setName('')
        }}
      >
        <p className="mt-2 text-sm text-muted-foreground">
          Tags don&rsquo;t go into code. The code moves under a new bullet with this name, tagged{' '}
          <span className="font-medium text-foreground">#{type}</span>.
        </p>
        <Input
          required
          aria-label="Name"
          className="mt-4"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={!trimmed || busy}>
            Save
          </Button>
        </div>
      </form>
    </ModalDialog>
  )
}
