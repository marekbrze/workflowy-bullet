import { addDays, todayISO } from '@/shared/dates'
import type { Entry } from '../types/entry'

let counter = 0

function make(date: string, text: string, extra: Partial<Entry> = {}): Entry {
  counter += 1
  const createdAt = new Date(new Date(`${date}T08:00:00Z`).getTime() + counter * 60_000).toISOString()
  return {
    id: `mock-${date}-${counter}`,
    createdAt,
    updatedAt: createdAt,
    text,
    children: [],
    date,
    type: null,
    outcome: null,
    mirroredTo: null,
    ...extra,
  }
}

const openTask = { type: 'task', outcome: 'open' } as const

/** Yesterday ~8 entries, today ~5, six open days further back. Dates are relative to today. */
export function buildFullEntries(): Entry[] {
  counter = 0
  const today = todayISO()
  const yesterday = addDays(today, -1)

  return [
    // Yesterday
    make(yesterday, "Call the dentist to reschedule Thursday's appointment"),
    make(yesterday, 'Idea: weekly review template for the team — keep it to three questions', {
      children: ['What went well?', 'What got stuck?', 'What do we change next week?'],
    }),
    make(yesterday, 'Standup moved to 10:30 from next Monday'),
    make(yesterday, 'Send the Q3 invoice to the accountant', {
      ...openTask,
      children: ['Attach the expenses sheet', 'Cc Marta'],
    }),
    make(yesterday, 'Book train tickets for the conference', openTask),
    make(
      yesterday,
      'Call with Piotr: he is open to a trial period and wants a written summary of scope before Friday. He also mentioned the budget cycle closes at the end of the month, so we should decide quickly.',
      { children: ['Ask about the weekly hours', 'Send the draft scope by Thursday'] },
    ),
    make(yesterday, 'Recipe: lentil soup — red lentils, carrot, cumin, lemon', { type: 'note' }),
    make(yesterday, 'Water the plants', { type: 'task', outcome: 'done' }),

    // Today
    make(today, 'Prepare the agenda for Monday planning'),
    make(today, 'Reply to Anna about the venue', openTask),
    make(today, 'Lunch with Kasia at 13:00'),
    make(today, 'Dentist at 16:30', { type: 'event' }),
    make(today, 'Look into a standing desk'),

    // Backlog: older open days
    make(addDays(today, -2), 'Renew the car insurance', openTask),
    make(addDays(today, -2), 'Article idea: why unfinished tasks feel heavier than undone ones'),
    make(addDays(today, -3), 'Pick up the parcel from the post office', openTask),
    make(addDays(today, -3), 'Maciek recommended the book "Four Thousand Weeks"'),
    make(addDays(today, -5), 'Fix the leaking tap in the bathroom', openTask),
    make(addDays(today, -5), 'Team offsite: Friday 14th, venue still to be confirmed'),
    make(addDays(today, -8), 'Write the retrospective for the spring project', {
      ...openTask,
      children: ['What we shipped', 'What we would do differently'],
    }),
    make(addDays(today, -8), 'Check the warranty on the laptop charger'),
    make(addDays(today, -12), 'Order new running shoes', openTask),
    make(addDays(today, -12), 'Meeting notes: pricing discussion with the design team'),
    make(addDays(today, -20), 'Sort out the old photos from the summer trip', openTask),
    make(addDays(today, -20), 'Call grandma on Sunday'),
  ]
}

/** One short day — enough for a quick walkthrough. */
export function buildMinimalEntries(): Entry[] {
  counter = 0
  const yesterday = addDays(todayISO(), -1)
  return [
    make(yesterday, 'Send the Q3 invoice to the accountant', openTask),
    make(yesterday, 'Idea: weekly review template for the team'),
    make(yesterday, 'Standup moved to 10:30'),
  ]
}
