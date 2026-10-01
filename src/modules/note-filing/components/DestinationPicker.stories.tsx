import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'
import { writeStorage } from '@/shared/lib/storage'
import { MOCK_TREE, buildSavedDestinations, buildSnapshotMeta } from '../mock/tree'
import type { Destination } from '../types/destination'
import type { SavedDestination } from '../types/saved-destination'
import { DestinationPicker } from './DestinationPicker'

interface Seed {
  tree?: Destination[]
  saved?: SavedDestination[]
  refreshedMinutesAgo?: number
}

function seed({ tree = MOCK_TREE, saved = [], refreshedMinutesAgo = 12 }: Seed) {
  const set = writeStorage
  set('tree-nodes', tree)
  set('tree-snapshot', tree.length ? buildSnapshotMeta(refreshedMinutesAgo) : [])
  set('saved-destinations', saved)
}

const typeInto = (text: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const input = await within(canvasElement.ownerDocument.body).findByRole('combobox')
  await userEvent.type(input, text)
}

const meta: Meta<typeof DestinationPicker> = {
  title: 'Note Filing/DestinationPicker',
  component: DestinationPicker,
  args: { open: true, onPick: () => {} },
}
export default meta

type Story = StoryObj<typeof DestinationPicker>

/** Pinned (alphabetical) and recent places wait under the empty search field. */
export const WithPinnedAndRecent: Story = {
  loaders: [async () => seed({ saved: buildSavedDestinations() })],
}

/** First use: nothing pinned or used yet. */
export const FirstUse: Story = { loaders: [async () => seed({})] }

export const SearchResults: Story = {
  loaders: [async () => seed({ saved: buildSavedDestinations() })],
  play: typeInto('ide'),
}

/** Two nodes called "Ideas" — the closest parents in the path tell them apart. */
export const SameNameInManyPlaces: Story = {
  loaders: [async () => seed({})],
  play: typeInto('ideas'),
}

/** More matches than fit: the list says so. */
export const MoreResultsThanShown: Story = {
  loaders: [async () => seed({})],
  play: typeInto('e'),
}

export const NoResults: Story = {
  loaders: [async () => seed({ saved: buildSavedDestinations() })],
  play: typeInto('zzz'),
}

/** The tree was never downloaded: a distinct message with a Refresh action. */
export const EmptyTree: Story = { loaders: [async () => seed({ tree: [] })] }

/** A manual refresh was just done: the button waits and counts down. */
export const RefreshRateLimited: Story = {
  loaders: [async () => seed({ refreshedMinutesAgo: 0 })],
  play: async ({ canvasElement }) => {
    await typeInto('zzz')({ canvasElement })
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(await body.findByRole('button', { name: 'Refresh tree' }))
  },
}

/** A pinned place and a recent one were deleted in WorkFlowy: they are flagged, not offered. */
export const SavedPlacesNoLongerInTree: Story = {
  loaders: [
    async () => {
      const ghost = (id: string, name: string): SavedDestination => ({
        id,
        pinned: id.startsWith('p'),
        usedAt: id.startsWith('p') ? null : new Date(Date.now() - 600_000).toISOString(),
        destination: { id, name, path: ['Projects', 'Old'], childCount: 3 },
      })
      seed({ saved: [...buildSavedDestinations(), ghost('p-gone', 'Old project'), ghost('r-gone', 'Archive 2023')] })
    },
  ],
}

/** The note already has a mirror: it is shown, and picking a place moves it. */
export const NoteAlreadyMirrored: Story = {
  args: { currentMirror: MOCK_TREE.find((n) => n.name === 'Reading list') },
  loaders: [async () => seed({ saved: buildSavedDestinations() })],
}

/** A mis-typed note can step back to the classification. */
export const WithBack: Story = {
  args: { onBack: () => {} },
  loaders: [async () => seed({ saved: buildSavedDestinations() })],
}

export const VeryLongNames: Story = {
  loaders: [
    async () =>
      seed({
        tree: [
          {
            id: 'long-1',
            name: 'A_node_with_an_extremely_long_name_that_has_no_spaces_to_wrap_at_all_and_keeps_going_forever',
            path: ['Projects', 'Work', 'Clients', 'Acme', 'Contracts', '2026'],
            childCount: 4,
          },
          ...MOCK_TREE,
        ],
      }),
  ],
  play: typeInto('node'),
}

/** Saving the mirror failed: the picker stays open and offers a retry. */
export const WriteFailed: Story = {
  args: { error: true, onRetry: () => {}, onDismissError: () => {} },
  loaders: [async () => seed({ saved: buildSavedDestinations() })],
}
