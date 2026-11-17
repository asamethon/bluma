import { isBoardGuestPost } from '@/features/conversation/utils/boardPost';
import type { Conversation, Story, User } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import {
  getPublishedProfileStories,
  subscribeProfileConversations,
  type ProfileConversationRecord,
  type ProfileStoryRecord,
} from '../services/profileContent';

export function useProfileContent(user: User | null) {
  const userId = user?.id;
  const [storyRecords, setStoryRecords] = useState<ProfileStoryRecord[]>([]);
  const [conversationRecords, setConversationRecords] = useState<ProfileConversationRecord[]>([]);
  // İkisi de `true` başlar: `false` başlayan bayrak ilk render'da "yüklendi,
  // sıfır sohbet" diyor ve boş durum bir kare parlıyordu.
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setStoryRecords([]);
      setConversationRecords([]);
      setStoriesLoading(false);
      setConversationsLoading(false);
      return;
    }
    const lifecycle = { active: true };
    setStoriesLoading(true);
    setConversationsLoading(true);
    void getPublishedProfileStories(userId).then(items => {
      if (lifecycle.active) setStoryRecords(items);
    }).catch(() => {}).finally(() => {
      if (lifecycle.active) setStoriesLoading(false);
    });
    const unsubscribe = subscribeProfileConversations(
      userId,
      items => {
        if (!lifecycle.active) return;
        setConversationRecords(items);
        setConversationsLoading(false);
      },
      () => { if (lifecycle.active) setConversationsLoading(false); },
    );
    return () => {
      lifecycle.active = false;
      unsubscribe();
    };
  }, [userId]);

  const stories = useMemo<Story[]>(
    () => user ? storyRecords.map(story => ({ ...story, author: user })) : [],
    [storyRecords, user],
  );
  // Pano gönderisinin yazarı profil sahibi DEĞİL: dokümandaki künye kopyası
  // kullanılır (ek okuma yapmadan). Pano sahibi her zaman profil sahibidir —
  // sorgu sonucu zaten onun panosuna süzülmüştür.
  const conversations = useMemo<Conversation[]>(
    () => user ? conversationRecords.map(item => ({
      ...item,
      author: (item.authorId === user.id ? user : item.author) ?? user,
      ...(isBoardGuestPost(item) ? { boardOwner: user } : {}),
    })) : [],
    [conversationRecords, user],
  );

  return { stories, conversations, storiesLoading, conversationsLoading };
}
