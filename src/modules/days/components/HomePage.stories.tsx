import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MOCK_TREE, buildSnapshotMeta } from '@/modules/note-filing/mock/tree'
import { buildQueue } from '@/modules/review-session/lib/session-logic'
import { buildFullEntries, buildMinimalEntries } from '@/modules/review-session/mock/entries'
import type { Entry } from '@/modules/review-session/types/entry'
import type { ReviewMode } from '@/modules/review-session/types/session'
import { todayISO } from '@/shared/dates'
import { HomePage } from './HomePage'

function seed(entries: Entry[], sessionMode?: ReviewMode) {
  const set = (key: string, value: unknown) => window.localStorage.setItem(key, JSON.stringify(value))
  set('entries', entries)
  set('tree-nodes', MOCK_TREE)
  set('tree-snapshot', buildSnapshotMeta())
  const sessions = []
  if (sessionMode) {
    const queue = buildQueue(entries, sessionMode, todayISO())
    const now = new Date().toISOString()
    sessions.push({
      id: 'story-session',
      mode: sessionMode,
      queue: queue.slice(2),
      total: queue.length,
      decisions: [],
      createdAt: now,
      updatedAt: now,
    })
  }
  set('review-sessions', sessions)
}

const meta: Meta<typeof HomePage> = {
  title: 'Days/HomePage',
  component: HomePage,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Story />} />
          <Route path="/review-session/:mode" element={<p>Review session</p>} />
        </Routes>
      </MemoryRouter>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof HomePage>

/** Yesterday waiting, today's entries, and a long tail of open days. */
export const Full: Story = { loaders: [async () => seed(buildFullEntries())] }

export const Minimal: Story = { loaders: [async () => seed(buildMinimalEntries())] }

/** Yesterday's review was started earlier: the card offers "Continue". */
export const WithActiveSession: Story = {
  loaders: [async () => seed(buildFullEntries(), 'yesterday')],
}

/** Everything typed and closed: nothing is waiting. */
export const AllClear: Story = {
  loaders: [
    async () =>
      seed(
        buildFullEntries()
          .filter((e) => e.type !== null && e.outcome !== 'open')
          .map((e) => ({ ...e })),
      ),
  ],
}

export const NoEntries: Story = { loaders: [async () => seed([])] }
