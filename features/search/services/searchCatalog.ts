import { getUserById } from '@/features/auth/services/userCache';
import i18n from '@/i18n';
import type { Story, User } from '@/types';
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';

type StoryDocument = Omit<Story, 'id' | 'author'> & { authorName?: string };

function anonymousAuthor(data: StoryDocument): User {
  return {
    id: data.authorId || '',
    email: '',
    displayName: data.authorName || i18n.t('common.anonymous'),
    authProvider: 'email',
  };
}

/** Arama kataloğu 10 dk bellekte tutulur; sekme her açıldığında 100 okuma yapılmaz. */
const CATALOG_TTL_MS = 10 * 60 * 1000;
const catalog = { stories: [] as Story[], loadedAt: 0 };

export async function getPublishedSearchStories(): Promise<Story[]> {
  if (catalog.stories.length && Date.now() - catalog.loadedAt < CATALOG_TTL_MS) return catalog.stories;
  const stories = await fetchPublishedSearchStories();
  catalog.stories = stories;
  catalog.loadedAt = Date.now();
  return stories;
}

async function fetchPublishedSearchStories(): Promise<Story[]> {
  const storiesQuery = query(
    collection(getFirestore(), 'stories'),
    where('isPublished', '==', true),
    orderBy('createdAt', 'desc'),
    limit(100),
  );
  const snapshot = await getDocs(storiesQuery);
  const records = snapshot.docs.map(document => ({
    id: document.id,
    data: document.data() as StoryDocument,
  }));
  const authorIds = [...new Set(records.map(record => record.data.authorId).filter(Boolean))];
  const authors = await Promise.all(authorIds.map(async id => [id, await getUserById(id)] as const));
  const authorById = new Map(authors);

  return records.map(({ id, data }) => ({
    ...data,
    id,
    author: authorById.get(data.authorId) || anonymousAuthor(data),
  }));
}
