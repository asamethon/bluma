import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];
export type GuestKind = 'library' | 'profile';
type GuestCopy = { title: string; sub: string; rows: { icon: IconName; label: string }[] };

/** Misafir ekranının bölüme göre değişen tek verisi. */
export const GUEST_CONTENT: Record<GuestKind, GuestCopy> = {
  library: {
    title: 'guest.library.title',
    sub: 'guest.library.sub',
    rows: [
      { icon: 'bookmark-outline', label: 'guest.library.rowSave' },
      { icon: 'book-outline', label: 'guest.library.rowContinue' },
      { icon: 'cloud-offline-outline', label: 'guest.library.rowOffline' },
    ],
  },
  profile: {
    title: 'guest.profile.title',
    sub: 'guest.profile.sub',
    rows: [
      { icon: 'create-outline', label: 'guest.profile.rowWrite' },
      { icon: 'people-outline', label: 'guest.profile.rowFollow' },
      { icon: 'sparkles-outline', label: 'guest.profile.rowLevelUp' },
    ],
  },
};
