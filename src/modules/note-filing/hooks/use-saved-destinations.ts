import { useLocalStorage } from '@/shared/hooks/use-local-storage'
import {
  markUsed,
  pinnedDestinations,
  recentDestinations,
  togglePin,
} from '../lib/destinations'
import type { Destination } from '../types/destination'
import type { SavedDestination } from '../types/saved-destination'

export function useSavedDestinations() {
  const [saved, setSaved] = useLocalStorage<SavedDestination[]>('saved-destinations', [])

  return {
    pinned: pinnedDestinations(saved),
    recent: recentDestinations(saved),
    isPinned: (id: string) => saved.some((s) => s.id === id && s.pinned),
    togglePin: (destination: Destination) => setSaved(togglePin(saved, destination)),
    markUsed: (destination: Destination) =>
      setSaved(markUsed(saved, destination, new Date().toISOString())),
  }
}
