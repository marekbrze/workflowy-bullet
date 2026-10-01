import type { AppData } from './types';
import { buildFullEntries } from '@/modules/review-session/mock/entries';
import { buildConnection } from '@/modules/connection/mock/connection';
import { MOCK_TREE, buildSavedDestinations, buildSnapshotMeta } from '@/modules/note-filing/mock/tree';

export function fullScenario(): AppData {
  return {
    connection: buildConnection(),
    entries: buildFullEntries(),
    'tree-nodes': MOCK_TREE,
    'tree-snapshot': buildSnapshotMeta(),
    'saved-destinations': buildSavedDestinations(),
  };
}
