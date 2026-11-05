import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EMPTY_PROMPT_RECORD,
  SILENT_PROMPT_RECORD,
  type PushPromptRecord,
} from '../utils/pushPermissionRules';

/** Anahtar uid'e bağlı: aynı cihazdaki başka hesap kendi sayacını görür. */
const key = (userId: string) => `bluma.pushPrompt.${userId}`;

export async function readPromptRecord(userId: string): Promise<PushPromptRecord> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    return raw ? { ...EMPTY_PROMPT_RECORD, ...JSON.parse(raw) } : EMPTY_PROMPT_RECORD;
  } catch {
    return SILENT_PROMPT_RECORD;
  }
}

/** Yazma başarısız olursa kart bir sonraki anda tekrar çıkabilir; akış bozulmaz. */
export async function writePromptRecord(userId: string, record: PushPromptRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId), JSON.stringify(record));
  } catch {
    // Yoksayılır.
  }
}
