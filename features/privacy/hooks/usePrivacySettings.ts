import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { privacyActions } from '../services/privacyService';
import { DEFAULT_PRIVACY, PrivacySettings } from '../types';

/** Gizlilik ekranının veri kaynağı: kullanıcı dokümanı + iyimser yazma. */
export function usePrivacySettings() {
  const stored = useAppSelector(s => s.auth.user?.privacy);
  const userId = useAppSelector(s => s.auth.user?.id);
  const [error, setError] = useState<string | null>(null);

  const settings = useMemo<PrivacySettings>(
    () => ({ ...DEFAULT_PRIVACY, ...(stored ?? {}) }),
    [stored]
  );

  useEffect(() => {
    privacyActions.load();
  }, [userId]);

  const toggle = async (key: keyof PrivacySettings, value: boolean) => {
    setError(null);
    const result = await privacyActions.update({ [key]: value });
    if (!result.success) setError(result.error ?? null);
  };

  return { settings, toggle, error, isGuest: !userId };
}
