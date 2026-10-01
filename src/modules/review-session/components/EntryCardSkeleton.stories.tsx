import type { Meta, StoryObj } from '@storybook/react'
import { EntryCardSkeleton } from './EntryCardSkeleton'

const meta: Meta<typeof EntryCardSkeleton> = {
  title: 'Review Session/EntryCardSkeleton',
  component: EntryCardSkeleton,
}
export default meta

type Story = StoryObj<typeof EntryCardSkeleton>

export const Default: Story = {}
