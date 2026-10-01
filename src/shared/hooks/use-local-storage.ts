import { useState, useCallback, useEffect, useRef } from 'react';
import {
  readStorage,
  removeStored,
  reportStorageFailure,
  STORAGE_CHANGED,
  storageKey,
  writeStorage,
} from '@/shared/lib/storage';

interface Options {
  /**
   * Show the app-wide "could not save" banner when a write fails (default).
   * Callers that have their own error state turn this off.
   */
  reportFailure?: boolean;
}

export function useLocalStorage<T>(key: string, initialValue: T, options: Options = {}) {
  const { reportFailure = true } = options;
  const initial = useRef(initialValue);
  // The first read happens once; an unreadable value falls back to the default but is flagged.
  const [first] = useState(() => readStorage<T>(key, initialValue));
  const [storedValue, setStoredValue] = useState<T>(first.value);
  const [unreadable, setUnreadable] = useState(first.unreadable);

  // Someone else changed this key — another tab, or another hook in this tab: pick up its value
  // instead of overwriting it later with a stale copy.
  useEffect(() => {
    const reload = () => {
      const next = readStorage<T>(key, initial.current);
      setStoredValue(next.value);
      setUnreadable(next.unreadable);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey(key)) reload();
    };
    const onChanged = (event: Event) => {
      if ((event as CustomEvent<{ key: string }>).detail?.key === key) reload();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(STORAGE_CHANGED, onChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(STORAGE_CHANGED, onChanged);
    };
  }, [key]);

  /** Returns `false` (and leaves the state untouched) when the write did not reach storage. */
  const setValue = useCallback(
    (value: T | ((val: T) => T)): boolean => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      if (!writeStorage(key, valueToStore)) {
        console.error(`Error setting localStorage key "${key}"`);
        if (reportFailure) reportStorageFailure(key);
        return false;
      }
      setStoredValue(valueToStore);
      setUnreadable(false);
      return true;
    },
    [key, storedValue, reportFailure],
  );

  const removeValue = useCallback(() => {
    if (!removeStored(key)) {
      console.error(`Error removing localStorage key "${key}"`);
      return;
    }
    setStoredValue(initial.current);
  }, [key]);

  /** Drops an unreadable stored value (a copy stays under `<key>.backup`) and starts from the default. */
  const startFresh = useCallback(() => {
    removeStored(key);
    setStoredValue(initial.current);
    setUnreadable(false);
  }, [key]);

  return [storedValue, setValue, removeValue, { unreadable, startFresh }] as const;
}
