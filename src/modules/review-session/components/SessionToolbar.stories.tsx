import type { Meta, StoryObj } from '@storybook/react'
import { SessionToolbar } from './SessionToolbar'

const meta: Meta<typeof SessionToolbar> = {
  title: 'Review Session/SessionToolbar',
  component: SessionToolbar,
  args: {
    canSkip: true,
    canUndo: true,
    undoLabel: 'marked done',
    onSkip: () => {},
    onUndo: () => {},
    onChangeType: () => {},
    onDelete: () => {},
  },
}
export default meta

type Story = StoryObj<typeof SessionToolbar>

export const Default: Story = {}

export const OnATask: Story = { args: { canChangeType: true } }

export const NothingToUndoOrSkip: Story = { args: { canSkip: false, canUndo: false, undoLabel: null } }

/** While a failed write waits for a retry. */
export const Locked: Story = { args: { canChangeType: true, disabled: true } }
