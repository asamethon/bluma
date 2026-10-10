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
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setStoryRecords([]);
      setConversationRecords([]);
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
        if (lifecycle.active) setConversationRecords(items);
        setConversationsLoading(false);
      },
      () => setConversationsLoading(false),
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
  const conversations = useMemo<Conversation[]>(
    () => user ? conversationRecords.map(item => ({ ...item, author: user })) : [],
    [conversationRecords, user],
  );

  return { stories, conversations, storiesLoading, conversationsLoading };
}
