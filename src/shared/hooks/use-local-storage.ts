import { useState, useCallback, useEffect, useRef } from 'react';
import { reportStorageFailure, writeStorage } from '@/shared/lib/storage';

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
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Another tab changed this key: pick up its value instead of overwriting it later.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      try {
        setStoredValue(event.newValue ? (JSON.parse(event.newValue) as T) : initial.current);
      } catch {
        setStoredValue(initial.current);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
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
      return true;
    },
    [key, storedValue, reportFailure],
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initial.current);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, removeValue] as const;
}
