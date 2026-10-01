import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { buildConnection } from '@/modules/connection/mock/connection'
import { MOCK_TREE, buildSnapshotMeta } from '@/modules/note-filing/mock/tree'
import { buildQueue } from '@/modules/review-session/lib/session-logic'
import { buildFullEntries, buildMinimalEntries } from '@/modules/review-session/mock/entries'
import type { Entry } from '@/modules/review-session/types/entry'
import type { ReviewMode } from '@/modules/review-session/types/session'
import { addDays, todayISO } from '@/shared/dates'
import { storageKey, writeStorage } from '@/shared/lib/storage'
import { HomePage } from './HomePage'

interface SeedOptions {
  sessionMode?: ReviewMode
  /** How long ago the tree snapshot was refreshed */
  snapshotMinutesAgo?: number
  /** Store this text instead of the entries, to simulate damaged data */
  rawEntries?: string
}

function seed(entries: Entry[], { sessionMode, snapshotMinutesAgo = 12, rawEntries }: SeedOptions = {}) {
  const set = writeStorage
  if (rawEntries !== undefined) window.localStorage.setItem(storageKey('entries'), rawEntries)
  else set('entries', entries)
  window.localStorage.removeItem(`${storageKey('entries')}.backup`)
  set('connection', buildConnection())
  set('tree-nodes', MOCK_TREE)
  set('tree-snapshot', buildSnapshotMeta(snapshotMinutesAgo))
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
  loaders: [async () => seed(buildFullEntries(), { sessionMode: 'yesterday' })],
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

/** The tree was refreshed hours ago: a calm cue that it may be out of date. */
export const StaleTree: Story = {
  loaders: [async () => seed(buildFullEntries(), { snapshotMinutesAgo: 5 * 60 })],
}

/** The saved entries exist but cannot be read — not the same as "no entries". */
export const UnreadableData: Story = {
  loaders: [async () => seed([], { rawEntries: '{"this is": not valid json' })],
}

/** Tasks that were rolled over to tomorrow are acknowledged with one quiet line. */
export const TasksWaitingForTomorrow: Story = {
  loaders: [
    async () => {
      const entries = buildFullEntries()
      const tomorrow = addDays(todayISO(), 1)
      seed([
        ...entries,
        { ...entries[0], id: 'tm-1', text: 'Renew the library card', date: tomorrow, type: 'task', outcome: 'open' },
        { ...entries[0], id: 'tm-2', text: 'Send the signed form', date: tomorrow, type: 'task', outcome: 'open' },
      ])
    },
  ],
}

/** A busy day and a long backlog: both lists are cut short with "Show all". */
export const ManyEntriesAndDays: Story = {
  loaders: [
    async () => {
      const base = buildFullEntries()
      const today = todayISO()
      const many = Array.from({ length: 40 }, (_, i) => ({
        ...base[0],
        id: `many-today-${i}`,
        text: i === 3 ? 'https://example.com/a/very/long/link/that/has/no/spaces/at/all/and/keeps/going/forever/and/ever' : `Captured thought number ${i + 1}`,
        date: today,
        createdAt: new Date(Date.now() + i * 1000).toISOString(),
      }))
      const oldDays = Array.from({ length: 45 }, (_, i) => ({
        ...base[0],
        id: `many-old-${i}`,
        text: `Old entry ${i + 1}`,
        date: addDays(today, -(i + 2)),
      }))
      seed([...many, ...oldDays])
    },
  ],
}
