import { SettingsGroup } from '@/components/ui';
import { memo, type ReactNode } from 'react';

/** Ayarlar ekranının grup sarmalayıcısı — görsel dil kit'ten gelir. */
export const SettingsSection = memo(function SettingsSection({
  title,
  children,
}: { title: string; children: ReactNode }) {
  return <SettingsGroup title={title}>{children}</SettingsGroup>;
});
