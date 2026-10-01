import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MOCK_TREE, buildSnapshotMeta } from '@/modules/note-filing/mock/tree'
import { buildConnection } from '../mock/connection'
import { ConnectionPage } from './ConnectionPage'
import { InvalidKeyNotice } from './InvalidKeyNotice'

function seed(state: 'connected' | 'invalid' | 'disconnected') {
  const set = (key: string, value: unknown) => window.localStorage.setItem(key, JSON.stringify(value))
  if (state === 'disconnected') {
    window.localStorage.removeItem('connection')
    window.localStorage.removeItem('tree-nodes')
    window.localStorage.removeItem('tree-snapshot')
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

export const InvalidKeyMessage: StoryObj<typeof InvalidKeyNotice> = {
  render: () => <InvalidKeyNotice onChangeKey={() => {}} />,
}

export const InvalidKeyInterruptsSession: StoryObj<typeof InvalidKeyNotice> = {
  render: () => <InvalidKeyNotice interruptedSession onChangeKey={() => {}} />,
}
