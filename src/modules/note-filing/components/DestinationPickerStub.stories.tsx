import type { Meta, StoryObj } from '@storybook/react'
import { DestinationPickerStub } from './DestinationPickerStub'

const meta: Meta<typeof DestinationPickerStub> = {
  title: 'Note Filing/DestinationPickerStub',
  component: DestinationPickerStub,
  args: { open: true, onPick: () => {} },
}
export default meta

type Story = StoryObj<typeof DestinationPickerStub>

export const Open: Story = {}
