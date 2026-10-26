import { Text } from 'react-native';

const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

export function renderMentionText(text: string, color: string, onMentionPress?: (username: string) => void) {
  if (!text) return text as any;
  const parts: any[] = [];
  let lastIndex = 0;
  const regex = new RegExp(MENTION_REGEX);
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const username = match[1];
    parts.push(
      <Text
        key={`mention-${key++}`}
        style={{ color, fontWeight: '600' }}
        onPress={() => onMentionPress?.(username)}
      >
        @{username}
      </Text>,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}
