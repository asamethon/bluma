// Expo push gönderimi — tekil ve toplu.
//
// Toplu duyuruda (announce.js) tek tek istek atmak hem yavaş hem de Expo'nun
// önerdiği kullanım değil; Expo tek istekte 100 mesaj kabul eder.
const EXPO_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export async function sendExpoPush(token, title, body, data) {
  const [result] = await sendExpoPushBatch([{ to: token, title, body, data }]);
  return result?.status === 'ok';
}

/**
 * `messages`: { to, title, body, data }[] — 100'lük gruplara bölünüp gönderilir.
 * Expo'nun her mesaj için döndürdüğü sonuç dizisi aynı sırada geri verilir.
 */
export async function sendExpoPushBatch(messages) {
  const results = [];
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const chunk = messages.slice(i, i + BATCH_SIZE).map((m) => ({
      to: m.to,
      sound: 'default',
      title: m.title,
      body: m.body,
      data: m.data || {},
    }));
    try {
      const res = await fetch(EXPO_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      const json = await res.json();
      const data = Array.isArray(json?.data) ? json.data : [];
      chunk.forEach((_, idx) => results.push(data[idx] || { status: 'error', message: 'yanıt yok' }));
      const failed = data.filter((d) => d?.status !== 'ok');
      if (failed.length) console.error(`[push] ${failed.length} mesaj başarısız:`, JSON.stringify(failed.slice(0, 3)));
    } catch (error) {
      console.error('[push] Expo isteği hata verdi:', error.message);
      chunk.forEach(() => results.push({ status: 'error', message: error.message }));
    }
  }
  return results;
}
