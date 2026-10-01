import type { AppData } from './types';
import { buildFullEntries } from '@/modules/review-session/mock/entries';
import { MOCK_TREE, buildSavedDestinations, buildSnapshotMeta } from '@/modules/note-filing/mock/tree';

export function fullScenario(): AppData {
  return {
    entries: buildFullEntries(),
    'tree-nodes': MOCK_TREE,
    'tree-snapshot': buildSnapshotMeta(),
    'saved-destinations': buildSavedDestinations(),
  };
}
