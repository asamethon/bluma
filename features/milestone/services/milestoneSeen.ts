import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (id: string) => `milestone.${id}.seen.v1`;

/** Depolama okunamazsa "görüldü" sayılır: kart her açılışta tekrar çıkmasın. */
export async function hasSeenMilestone(id: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key(id))) === '1';
  } catch {
    return true;
  }
}

export function markMilestoneSeen(id: string) {
  AsyncStorage.setItem(key(id), '1').catch(() => {});
}
