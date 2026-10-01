import type { Meta, StoryObj } from '@storybook/react'
import { addDays, todayISO } from '@/shared/dates'
import type { Entry } from '../types/entry'
import { EntryCard } from './EntryCard'

const today = todayISO()

const base: Entry = {
  id: 'story-1',
  createdAt: '2026-01-01T08:00:00.000Z',
  updatedAt: '2026-01-01T08:00:00.000Z',
  text: "Call the dentist to reschedule Thursday's appointment",
  children: [],
  date: addDays(today, -1),
  type: null,
  outcome: null,
  mirroredTo: null,
}

const meta: Meta<typeof EntryCard> = {
  title: 'Review Session/EntryCard',
  component: EntryCard,
  args: { entry: base, position: 3, total: 12, today },
}
export default meta

type Story = StoryObj<typeof EntryCard>

export const Untyped: Story = {}

export const TaggedTask: Story = {
  args: { entry: { ...base, type: 'task', outcome: 'open' } },
}

export const WithChildren: Story = {
  args: {
    entry: {
      ...base,
      text: 'Send the Q3 invoice to the accountant',
      children: ['Attach the expenses sheet', 'Cc Marta'],
      type: 'task',
      outcome: 'open',
    },
  },
}

export const LongText: Story = {
  args: {
    entry: {
      ...base,
      text: 'Call with Piotr: he is open to a trial period and wants a written summary of scope before Friday. He also mentioned the budget cycle closes at the end of the month, so we should decide quickly.',
    },
  },
}

export const OlderDayFromBacklog: Story = {
  args: { entry: { ...base, date: addDays(today, -12) } },
}
