import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { removeStored, writeStorage } from '@/shared/lib/storage'
import { MOCK_TREE, buildSnapshotMeta } from '@/modules/note-filing/mock/tree'
import { buildConnection } from '../mock/connection'
import { ConnectionPage } from './ConnectionPage'
import { InvalidKeyNotice } from './InvalidKeyNotice'

function seed(state: 'connected' | 'invalid' | 'disconnected') {
  const set = writeStorage
  if (state === 'disconnected') {
    removeStored('connection')
    removeStored('tree-nodes')
    removeStored('tree-snapshot')
    return
  }
  set('connection', buildConnection(state))
  set('tree-nodes', MOCK_TREE)
  set('tree-snapshot', buildSnapshotMeta())
}

const meta: Meta<typeof ConnectionPage> = {
  title: 'Connection/ConnectionPage',
  component: ConnectionPage,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/connection']}>
        <Routes>
          <Route path="/connection" element={<Story />} />
          <Route path="/" element={<p>Home screen</p>} />
        </Routes>
      </MemoryRouter>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof ConnectionPage>

export const Connected: Story = { loaders: [async () => seed('connected')] }

/** The key stopped working: the form to replace it is open straight away. */
export const KeyNotAccepted: Story = { loaders: [async () => seed('invalid')] }

export const Disconnected: Story = { loaders: [async () => seed('disconnected')] }

/** A key from a different account asks for confirmation before anything is cleared. */
export const SwitchingAccount: Story = {
  loaders: [async () => seed('connected')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Change key' }))
    await userEvent.type(canvas.getByLabelText('WorkFlowy API key'), 'wf-work-9c2e41a7d3b85f10')
    await userEvent.click(canvas.getByRole('button', { name: 'Save key' }))
  },
}

/** Disconnect says what stays and offers to remove the local data too. */
export const DisconnectDialog: Story = {
  loaders: [async () => seed('connected')],
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Disconnect' }))
  },
}

export const InvalidKeyMessage: StoryObj<typeof InvalidKeyNotice> = {
  render: () => <InvalidKeyNotice onChangeKey={() => {}} />,
}

export const InvalidKeyInterruptsSession: StoryObj<typeof InvalidKeyNotice> = {
  render: () => <InvalidKeyNotice interruptedSession onChangeKey={() => {}} />,
}
