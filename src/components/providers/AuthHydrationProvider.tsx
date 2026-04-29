'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export function AuthHydrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!useAuthStore.persist.hasHydrated()) {
      void useAuthStore.persist.rehydrate();
    }
  }, []);

  return children;
}
