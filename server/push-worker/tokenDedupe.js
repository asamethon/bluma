const toMillis = (timestamp) => {
  if (!timestamp) return 0;
  if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
  if (timestamp instanceof Date) return timestamp.getTime();
  return typeof timestamp._seconds === 'number' ? timestamp._seconds * 1000 : 0;
};

async function dedupePushToken(db, document) {
  const token = document.data()?.expoPushToken;
  if (!token) return;
  const mine = toMillis(document.data()?.updatedAt);
  const snapshot = await db.collection('userPushTokens').where('expoPushToken', '==', token).get();
  const stale = snapshot.docs.filter(item => item.id !== document.id && toMillis(item.data()?.updatedAt) < mine);
  await Promise.all(stale.map(item => item.ref.delete().catch(() => undefined)));
  if (stale.length) console.log(`[pushTokens] ${document.id} token'ı için ${stale.length} eski kayıt silindi`);
}

export function watchPushTokens(db) {
  const lifecycle = { unsubscribe: null };
  const attach = () => {
    lifecycle.unsubscribe = db.collection('userPushTokens').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          void dedupePushToken(db, change.doc).catch(error => console.error('[pushTokens] hata:', error));
        }
      });
    }, error => {
      console.error('[pushTokens] dinleyici hatası, 10sn sonra yeniden bağlanılacak:', error?.message || error);
      lifecycle.unsubscribe?.();
      setTimeout(attach, 10_000);
    });
  };
  attach();
}
