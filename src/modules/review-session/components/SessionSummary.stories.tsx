import type { Meta, StoryObj } from '@storybook/react'
import { SessionSummary } from './SessionSummary'

const meta: Meta<typeof SessionSummary> = {
  title: 'Review Session/SessionSummary',
  component: SessionSummary,
  args: { processed: 12, canUndo: true, onUndo: () => {}, onDone: () => {} },
}
export default meta

type Story = StoryObj<typeof SessionSummary>

export const Default: Story = {}

export const SingleEntry: Story = { args: { processed: 1 } }

export const NothingToUndo: Story = { args: { canUndo: false } }
