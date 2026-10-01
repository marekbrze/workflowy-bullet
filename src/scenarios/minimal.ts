import type { AppData } from './types';
import { buildMinimalEntries } from '@/modules/review-session/mock/entries';
import { buildConnection } from '@/modules/connection/mock/connection';
import { MOCK_TREE, buildSnapshotMeta } from '@/modules/note-filing/mock/tree';

export function minimalScenario(): AppData {
  return {
    connection: buildConnection(),
    entries: buildMinimalEntries(),
    'tree-nodes': MOCK_TREE,
    'tree-snapshot': buildSnapshotMeta(),
  };
}
