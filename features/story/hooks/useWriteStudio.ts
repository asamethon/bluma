import { useAppSelector } from '@/store/hooks';
import { storyActions } from '@/store/storyStore';
import { Story } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

// Yazı Stüdyosu ana ekranı (Hub) — yazarın tüm hikâyelerini (yayında +
// taslak) listeler. Ekran (app/(tabs)/write.tsx) yalnızca bu hook'u çağırır.
export function useWriteStudio() {
  const router = useRouter();
  const uid = useAppSelector(s => s.auth.user?.id);
  const stories = useAppSelector(s => s.story.userStories);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (uid) storyActions.loadUserStories(uid);
  }, [uid]);

  // Sekmeye her dönüşte tazele — composer/edit ekranlarından yapılan
  // değişiklikler (yayınla, yeni bölüm, silme) Hub'a yansısın.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await storyActions.loadUserStories(uid || '');
    setRefreshing(false);
  }, [uid]);

  const toggleExpand = useCallback(
    (id: string) => setExpandedId(cur => (cur === id ? null : id)),
    [],
  );

  const newStory = useCallback(() => router.push('/story/new'), [router]);
  const importStory = useCallback(() => router.push('/story/import' as any), [router]);

  const editInfo = useCallback(
    (id: string) => router.push(`/story/edit/${id}`),
    [router],
  );

  const openChapter = useCallback(
    (id: string, index: number) => router.push(`/story/compose/${id}?ch=${index}`),
    [router],
  );

  const addChapter = useCallback(
    (id: string) => router.push(`/story/compose/${id}?ch=new`),
    [router],
  );

  const deleteStory = useCallback(
    (story: Story) => {
      Alert.alert(
        'Hikâyeyi Sil',
        `"${story.title}" hikâyesini ve tüm bölümlerini silmek istediğine emin misin? Bu işlem geri alınamaz.`,
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
              const result = await storyActions.deleteStory(story.id);
              if (result.success) load();
              else Alert.alert('Hata', result.error || 'Hikâye silinemedi.');
            },
          },
        ],
      );
    },
    [load],
  );

  return {
    uid,
    stories,
    refreshing,
    onRefresh,
    expandedId,
    toggleExpand,
    newStory,
    importStory,
    editInfo,
    openChapter,
    addChapter,
    deleteStory,
  };
}
