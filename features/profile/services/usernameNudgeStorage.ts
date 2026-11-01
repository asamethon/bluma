import AsyncStorage from '@react-native-async-storage/async-storage';

/** Anahtar uid'e bağlı: aynı cihazda başka hesap açan kişi kendi kararını görür. */
const key = (userId: string) => `bluma.usernameNudgeDismissed.${userId}`;

/** Okuma hata verirse kart gösterilmez — ısrar etmemek sessiz kalmaktan kötü. */
export async function readNudgeDismissed(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key(userId))) === 'true';
  } catch {
    return true;
  }
}

/** Yazma başarısız olursa kart tekrar görünür; akışı bozmaktan iyidir. */
export async function writeNudgeDismissed(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId), 'true');
  } catch {
    // Yoksayılır: kararı saklayamamak kullanıcıyı durdurmaz.
  }
}
