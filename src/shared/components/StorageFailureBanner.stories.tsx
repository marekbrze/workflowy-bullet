import type { Meta, StoryObj } from '@storybook/react'
import { StorageFailureNotice } from './StorageFailureBanner'

const meta: Meta<typeof StorageFailureNotice> = {
  title: 'Shared/StorageFailureBanner',
  component: StorageFailureNotice,
  args: { onDismiss: () => {} },
}
export default meta

type Story = StoryObj<typeof StorageFailureNotice>

export const Default: Story = {}
