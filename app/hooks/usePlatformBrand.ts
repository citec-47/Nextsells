'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_PLATFORM_NAME,
  PLATFORM_NAME_CACHE_KEY,
  PLATFORM_NAME_UPDATED_EVENT,
} from '@/lib/platformBrandShared';

function normalizeName(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_PLATFORM_NAME;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : DEFAULT_PLATFORM_NAME;
}

export function setCachedPlatformName(name: string) {
  if (typeof window === 'undefined') return;
  const next = normalizeName(name);
  window.localStorage.setItem(PLATFORM_NAME_CACHE_KEY, next);
  window.dispatchEvent(new CustomEvent(PLATFORM_NAME_UPDATED_EVENT, { detail: next }));
}

export function usePlatformBrand() {
  const [platformName, setPlatformName] = useState(DEFAULT_PLATFORM_NAME);

  useEffect(() => {
    const syncFromCache = () => {
      const cached = window.localStorage.getItem(PLATFORM_NAME_CACHE_KEY);
      if (cached) {
        setPlatformName(normalizeName(cached));
      }
    };

    const syncFromApi = async () => {
      try {
        const response = await fetch('/api/platform', { cache: 'no-store' });
        const json = await response.json();
        if (json.success) {
          const next = normalizeName(json.data?.platformName);
          setPlatformName(next);
          window.localStorage.setItem(PLATFORM_NAME_CACHE_KEY, next);
        }
      } catch {
        // Keep cached/default brand name on request failures.
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === PLATFORM_NAME_CACHE_KEY) {
        setPlatformName(normalizeName(event.newValue));
      }
    };

    const onPlatformUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setPlatformName(normalizeName(customEvent.detail));
    };

    syncFromCache();
    syncFromApi();
    window.addEventListener('storage', onStorage);
    window.addEventListener(PLATFORM_NAME_UPDATED_EVENT, onPlatformUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(PLATFORM_NAME_UPDATED_EVENT, onPlatformUpdated as EventListener);
    };
  }, []);

  return { platformName };
}