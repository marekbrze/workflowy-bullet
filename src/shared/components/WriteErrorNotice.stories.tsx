import type { Meta, StoryObj } from '@storybook/react'
import { WriteErrorNotice } from './WriteErrorNotice'

const meta: Meta<typeof WriteErrorNotice> = {
  title: 'Shared/WriteErrorNotice',
  component: WriteErrorNotice,
  args: { onRetry: () => {} },
}
export default meta

type Story = StoryObj<typeof WriteErrorNotice>

export const Default: Story = {}

export const WithDismiss: Story = { args: { onDismiss: () => {} } }
