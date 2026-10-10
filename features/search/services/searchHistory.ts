import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SearchHistoryItem } from '../types';

const STORAGE_KEY = 'searchHistoryV2';
const MAX_ITEMS = 10;

export async function readSearchHistory(): Promise<SearchHistoryItem[]> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value ? JSON.parse(value) as SearchHistoryItem[] : [];
}

export async function writeSearchHistory(items: SearchHistoryItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export async function clearStoredSearchHistory() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function prependUnique(
  items: SearchHistoryItem[],
  item: SearchHistoryItem,
): SearchHistoryItem[] {
  const duplicate = (current: SearchHistoryItem) =>
    current.type === item.type
    && (item.type === 'query' ? current.query === item.query : current.id === item.id);
  return [item, ...items.filter(current => !duplicate(current))].slice(0, MAX_ITEMS);
}
