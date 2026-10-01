import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { buildFullEntries } from '../mock/entries'
import { ReviewSessionPage } from './ReviewSessionPage'

function seed(entries: unknown[]) {
  window.localStorage.setItem('entries', JSON.stringify(entries))
  window.localStorage.removeItem('review-sessions')
}

const meta: Meta<typeof ReviewSessionPage> = {
  title: 'Review Session/ReviewSessionPage',
  component: ReviewSessionPage,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof ReviewSessionPage>

function withMode(mode: string) {
  return () => (
    <MemoryRouter initialEntries={[`/review-session/${mode}`]}>
      <Routes>
        <Route path="/review-session/:mode" element={<ReviewSessionPage />} />
        <Route path="/" element={<p>Home screen</p>} />
      </Routes>
    </MemoryRouter>
  )
}

export const Yesterday: Story = {
  loaders: [async () => seed(buildFullEntries())],
  render: withMode('yesterday'),
}

/** Roll over goes to tomorrow; "Leave open" is available. */
export const Today: Story = {
  loaders: [async () => seed(buildFullEntries())],
  render: withMode('today'),
}

export const Backlog: Story = {
  loaders: [async () => seed(buildFullEntries())],
  render: withMode('backlog'),
}

export const NothingToReview: Story = {
  loaders: [async () => seed([])],
  render: withMode('yesterday'),
}
