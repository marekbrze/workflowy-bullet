import { clearAppStorage, readStorage, writeStorage } from '@/shared/lib/storage';
import { getScenario } from './index';

const STORAGE_KEY = '__scenario_name__';

export function loadScenario(name: string): void {
  // Only this app's keys: on a shared origin other sites' data must stay untouched.
  clearAppStorage([STORAGE_KEY]);

  const data = getScenario(name);
  for (const [key, value] of Object.entries(data)) {
    writeStorage(key, value);
  }

  writeStorage(STORAGE_KEY, name);
  window.location.reload();
}

export function getCurrentScenarioName(): string {
  if (import.meta.env.PROD) return 'empty';
  return readStorage<string>(STORAGE_KEY, 'empty').value || 'empty';
}
