const WEB_BASE = 'https://bluma-dc10e.web.app';

export function buildProfileShareUrl(userId: string): string {
  return `${WEB_BASE}/user/${userId}`;
}

export function buildStoryShareUrl(storyId: string): string {
  return `${WEB_BASE}/story/${storyId}`;
}
