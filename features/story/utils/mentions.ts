const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

export function extractMentions(text: string): string[] {
  if (!text) return [];
  const matches = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(MENTION_REGEX);
  while ((match = regex.exec(text)) !== null) {
    const username = match[1]?.toLowerCase();
    if (username) matches.add(username);
  }
  return Array.from(matches);
}
