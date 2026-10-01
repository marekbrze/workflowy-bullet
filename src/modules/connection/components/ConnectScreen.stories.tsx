import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'
import { ConnectScreen } from './ConnectScreen'

const meta: Meta<typeof ConnectScreen> = {
  title: 'Connection/ConnectScreen',
  component: ConnectScreen,
  args: { onConnect: async () => ({ ok: true }) },
}
export default meta

type Story = StoryObj<typeof ConnectScreen>

export const FirstRun: Story = {}

export const KeyRejected: Story = {
  args: {
    onConnect: async () => ({
      ok: false,
      message: 'WorkFlowy did not accept this key. Check that you copied all of it.',
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('WorkFlowy API key'), 'wf-invalid-key')
    await userEvent.click(canvas.getByRole('button', { name: 'Connect' }))
  },
}

export const NetworkFailure: Story = {
  args: {
    onConnect: async () => ({
      ok: false,
      message: "Couldn't reach WorkFlowy. Check your connection and try again.",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('WorkFlowy API key'), 'wf-offline-key')
    await userEvent.click(canvas.getByRole('button', { name: 'Connect' }))
  },
}

/** Downloading a large tree can take a while. */
export const Downloading: Story = {
  args: {
    onConnect: (_key, onPhase) => {
      onPhase('downloading')
      return new Promise(() => {})
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('WorkFlowy API key'), 'wf-good-key-12345')
    await userEvent.click(canvas.getByRole('button', { name: 'Connect' }))
  },
}
