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

/** An empty field is rejected on the spot — no "checking" round trip. */
export const EmptyKey: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Connect' }))
  },
}

/** Saving the connection failed (storage full or blocked): nothing is reported as connected. */
export const SaveFailed: Story = {
  args: {
    onConnect: async () => ({
      ok: false,
      message: "Couldn't save your connection in this browser. Storage may be full or blocked.",
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('WorkFlowy API key'), 'wf-good-key-12345')
    await userEvent.click(canvas.getByRole('button', { name: 'Connect' }))
  },
}

/** A saved connection existed but could not be read. */
export const SavedConnectionUnreadable: Story = {
  args: { notice: 'Your saved connection could not be read, so you need to connect again.' },
}

/** The pasted key can be revealed to check it. */
export const KeyRevealed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText('WorkFlowy API key'), 'wf-demo-3f9a1c7e5b2d4a60')
    await userEvent.click(canvas.getByRole('button', { name: 'Show' }))
  },
}
