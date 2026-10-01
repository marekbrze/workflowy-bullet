import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'
import { writeStorage } from '@/shared/lib/storage'
import { MOCK_TREE, buildSnapshotMeta } from '@/modules/note-filing/mock/tree'
import { SnapshotStatus } from './SnapshotStatus'

function seed(minutesAgo: number | null) {
  writeStorage('tree-nodes', MOCK_TREE)
  writeStorage('tree-snapshot', minutesAgo === null ? [] : buildSnapshotMeta(minutesAgo))
}

const meta: Meta<typeof SnapshotStatus> = {
  title: 'Connection/SnapshotStatus',
  component: SnapshotStatus,
}
export default meta

type Story = StoryObj<typeof SnapshotStatus>

export const Fresh: Story = { loaders: [async () => seed(12)] }

/** Older than an hour: a calm cue, no alarm. */
export const MayBeOutOfDate: Story = { loaders: [async () => seed(5 * 60)] }

export const NeverRefreshed: Story = { loaders: [async () => seed(null)] }

/** Just refreshed: the button waits and counts down. */
export const RateLimited: Story = {
  loaders: [async () => seed(0)],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Refresh' }))
  },
}

/** The request failed: the current tree is kept and the user is told. */
export const RefreshFailed: Story = {
  loaders: [
    async () => {
      seed(5 * 60)
      window.localStorage.setItem('__simulate_refresh_failure__', '1')
    },
  ],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Refresh' }))
  },
}
