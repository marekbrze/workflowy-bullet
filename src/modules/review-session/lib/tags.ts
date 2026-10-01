import type { EntryType, TaskOutcome } from '../types/entry'

/**
 * Tags live in the bullet's text, exactly as typed in WorkFlowy: `Call the dentist #task`.
 * The app reads them to know an entry's type and writes them when the user decides.
 */
export const TYPE_TAGS: EntryType[] = ['task', 'note', 'event']

// A tag ends at whitespace, markup or punctuation: `#task` matches in "#task." and "#task<", not in "#tasks".
const tagPattern = (tag: string, flags = 'i') =>
  new RegExp(`(^|[\\s>])#${tag}(?=$|[\\s<.,;:!?)])`, flags)

export function hasTag(name: string, tag: string): boolean {
  return tagPattern(tag).test(name)
}

/** The entry type written in the name, or `null` when it has none. */
export function typeFromName(name: string): EntryType | null {
  return TYPE_TAGS.find((type) => hasTag(name, type)) ?? null
}

/** A completed task is done, migrated (rolled over) or irrelevant — by its tag. */
export function outcomeFromName(name: string, completed: boolean): TaskOutcome {
  if (!completed) return 'open'
  if (hasTag(name, 'migrated')) return 'migrated'
  if (hasTag(name, 'irrelevant')) return 'irrelevant'
  return 'done'
}

export function addTag(name: string, tag: string): string {
  if (hasTag(name, tag)) return name
  return `${name.trimEnd()} #${tag}`
}

export function removeTag(name: string, tag: string): string {
  return name
    .replace(new RegExp(`\\s*#${tag}(?=$|[\\s<.,;:!?)])`, 'gi'), '')
    .replace(/^\s+/, '')
    .trimEnd()
}

/** Replaces the entry's type tag: `#task` → `#note`, leaving every other tag alone. */
export function setTypeTag(name: string, type: EntryType): string {
  let result = name
  for (const other of TYPE_TAGS) if (other !== type) result = removeTag(result, other)
  return addTag(result, type)
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

/** Plain text of a bullet's HTML name, for display. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim()
}

/** What the card shows: the text without the tags the app manages and without `<time>` dates. */
export function displayText(name: string): string {
  let result = name.replace(/<time\b[^>]*>[\s\S]*?<\/time>/gi, ' ')
  for (const tag of [...TYPE_TAGS, 'migrated', 'irrelevant']) result = removeTag(result, tag)
  return stripHtml(result)
}
