import type { AppData } from './types';
import { buildMinimalEntries } from '@/modules/review-session/mock/entries';
import { MOCK_TREE, buildSnapshotMeta } from '@/modules/note-filing/mock/tree';

export function minimalScenario(): AppData {
  return {
    entries: buildMinimalEntries(),
    'tree-nodes': MOCK_TREE,
    'tree-snapshot': buildSnapshotMeta(),
  };
}
