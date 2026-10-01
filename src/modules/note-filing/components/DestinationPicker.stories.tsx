import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'
import { MOCK_TREE, buildSavedDestinations, buildSnapshotMeta } from '../mock/tree'
import { DestinationPicker } from './DestinationPicker'

function seed({ tree, saved }: { tree: boolean; saved: boolean }) {
  const set = (key: string, value: unknown) => window.localStorage.setItem(key, JSON.stringify(value))
  set('tree-nodes', tree ? MOCK_TREE : [])
  set('tree-snapshot', tree ? buildSnapshotMeta() : [])
  set('saved-destinations', saved ? buildSavedDestinations() : [])
}

const meta: Meta<typeof DestinationPicker> = {
  title: 'Note Filing/DestinationPicker',
  component: DestinationPicker,
  args: { open: true, onPick: () => {} },
}
export default meta

type Story = StoryObj<typeof DestinationPicker>

/** Pinned and recent places wait under the empty search field. */
export const WithPinnedAndRecent: Story = {
  loaders: [async () => seed({ tree: true, saved: true })],
}

/** First use: nothing pinned or used yet. */
export const FirstUse: Story = {
  loaders: [async () => seed({ tree: true, saved: false })],
}

export const SearchResults: Story = {
  loaders: [async () => seed({ tree: true, saved: true })],
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement.ownerDocument.body).findByRole('combobox')
    await userEvent.type(input, 'ide')
  },
}

/** Two nodes called "Ideas" — the path tells them apart. */
export const SameNameInManyPlaces: Story = {
  loaders: [async () => seed({ tree: true, saved: false })],
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement.ownerDocument.body).findByRole('combobox')
    await userEvent.type(input, 'ideas')
  },
}

export const NoResults: Story = {
  loaders: [async () => seed({ tree: true, saved: true })],
  play: async ({ canvasElement }) => {
    const input = await within(canvasElement.ownerDocument.body).findByRole('combobox')
    await userEvent.type(input, 'zzz')
  },
}

export const EmptyTree: Story = {
  loaders: [async () => seed({ tree: false, saved: false })],
}

/** Saving the mirror failed: the picker stays open and offers a retry. */
export const WriteFailed: Story = {
  args: { error: true, onRetry: () => {}, onDismissError: () => {} },
  loaders: [async () => seed({ tree: true, saved: true })],
}
