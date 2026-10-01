import type { AppData } from './types';
import { buildFullEntries } from '@/modules/review-session/mock/entries';

export function fullScenario(): AppData {
  return { entries: buildFullEntries() };
}
