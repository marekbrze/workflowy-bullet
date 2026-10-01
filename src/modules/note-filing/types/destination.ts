/** A WorkFlowy node a note can be mirrored under. */
export interface Destination {
  id: string
  name: string
  /** Names of the parent nodes, outermost first */
  path: string[]
  childCount: number
}
