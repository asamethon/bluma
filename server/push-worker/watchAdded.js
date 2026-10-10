export function watchAdded(source, handler, label) {
  const lifecycle = { first: true, unsubscribe: null };
  const attach = () => {
    lifecycle.unsubscribe = source.onSnapshot(snapshot => {
      if (lifecycle.first) {
        lifecycle.first = false;
        return;
      }
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          void handler(change.doc).catch(error => console.error(`[${label}] işleme hatası:`, error));
        }
      });
    }, error => {
      console.error(`[${label}] dinleyici hatası, 10sn sonra yeniden bağlanılacak:`, error?.message || error);
      lifecycle.unsubscribe?.();
      lifecycle.first = true;
      setTimeout(attach, 10_000);
    });
  };
  attach();
}
