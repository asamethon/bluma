import { getUserByUsername } from '@/features/auth/services/userByUsername';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** Metindeki `@ad`a dokununca o kişinin profili açılır (eski adlar da çözülür). */
export function useOpenMention() {
  const router = useRouter();
  return useCallback((username: string) => {
    void getUserByUsername(username).then(user => {
      router.push(`/user/${user?.id ?? username}` as never);
    });
  }, [router]);
}
