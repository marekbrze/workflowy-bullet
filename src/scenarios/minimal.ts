import type { AppData } from './types';
import { buildMinimalEntries } from '@/modules/review-session/mock/entries';

export function minimalScenario(): AppData {
  return { entries: buildMinimalEntries() };
}
