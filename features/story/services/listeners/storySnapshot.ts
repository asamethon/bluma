import type { Story, User } from '@/types';
import { rememberStory } from '../storyCache';
import { getUserById } from '../userCache';

export const fallbackAuthor = (id = ''): User => ({
  id,
  email: '',
  displayName: id ? 'Anonim' : '',
  username: id ? 'user' : undefined,
  authProvider: 'email',
});

export async function storyFromSnapshot(snapshot: any): Promise<Story> {
  const data = snapshot.data() as Story;
  const author = data.authorId ? await getUserById(data.authorId) : null;
  const story = { ...data, id: snapshot.id, author: author || fallbackAuthor(data.authorId) };
  rememberStory(story);
  return story;
}
