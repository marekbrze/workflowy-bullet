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

/** Correcting a type: the same three choices under a different question. */
export const ChangeType: Story = { args: { step: 'classify', heading: 'Change type to…' } }

/** While a failed write waits for a retry. */
export const Locked: Story = { args: { step: 'task', disabled: true } }
