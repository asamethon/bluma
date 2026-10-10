export const SEARCH_GENRES = [
  'romance', 'fantasy', 'sci_fi', 'mystery', 'adventure',
  'horror', 'comedy', 'drama', 'poetry',
] as const;

export type SearchHistoryItem = {
  type: 'query' | 'story' | 'user';
  query?: string;
  id?: string;
  title?: string;
  name?: string;
  username?: string;
  image?: string;
  timestamp: number;
};
