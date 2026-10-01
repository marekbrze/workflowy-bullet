import type { Meta, StoryObj } from '@storybook/react'
import { DecisionBar } from './DecisionBar'

const meta: Meta<typeof DecisionBar> = {
  title: 'Review Session/DecisionBar',
  component: DecisionBar,
  args: { mode: 'yesterday', onClassify: () => {}, onTask: () => {} },
}
export default meta

type Story = StoryObj<typeof DecisionBar>

export const Classify: Story = { args: { step: 'classify' } }

export const TaskYesterday: Story = { args: { step: 'task', mode: 'yesterday' } }

/** Rolls over to tomorrow and offers "Leave open". */
export const TaskToday: Story = { args: { step: 'task', mode: 'today' } }
