import type { Meta, StoryObj } from '@storybook/react'
import { ConfirmDialog } from './ConfirmDialog'

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Shared/ConfirmDialog',
  component: ConfirmDialog,
  args: { open: true, onConfirm: () => {}, onCancel: () => {} },
}
export default meta

type Story = StoryObj<typeof ConfirmDialog>

export const DeleteEntry: Story = {
  args: {
    title: 'Delete this entry?',
    description: 'It will be permanently removed from WorkFlowy. This cannot be undone.',
    confirmLabel: 'Delete permanently',
    destructive: true,
  },
}

export const EndSession: Story = {
  args: {
    title: 'End this review?',
    description: "Your decisions stay in WorkFlowy, but you won't be able to undo them any more.",
    confirmLabel: 'End review',
  },
}
