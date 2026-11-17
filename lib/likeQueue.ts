/**
 * Beğeni dokunuşlarını ANAHTAR BAŞINA sıraya dizer. Kök sorun şuydu: her
 * dokunuş bağımsız bir yazma zinciri başlatıyor, zincirler iç içe geçince
 * sayaç şişiyor ya da reddedilen azaltma yerel önbellekte eksiye düşüyordu.
 *
 * İki kip var:
 * - `queueLikeWrite` — "istenen durum" kipi: arayüz durumu bilindiğinde.
 *   Aynı anahtar için tek yazma çalışır; sürerken gelen dokunuşlar yalnızca
 *   istenen durumu günceller. Yazma bitince istenen durum değiştiyse bir tur
 *   daha atılır. Böylece beğen-bırak-beğen TEK yazmaya iner.
 * - `chainLikeWrite` — "çevir" kipi: arayüzde beğeni durumu tutulmayan yerde
 *   (hikâye yorumu). Dokunuşlar birleştirilemez çünkü her biri durumu ters
 *   çevirir; yalnızca SIRAYA dizilir, böylece iç içe geçmezler.
 */

export type LikeWriter = (desired: boolean) => Promise<void>;

export type LikeOutcome = {
  ok: boolean;
  /** Sunucuya taşınan son istenen durum. */
  desired: boolean;
  /** Zincir başlamadan önceki durum — hata hâlinde arayüz buna döner. */
  previous: boolean;
};

type Entry = { desired: boolean; previous: boolean; promise: Promise<LikeOutcome> };

const inflight = new Map<string, Entry>();
const chains = new Map<string, Promise<unknown>>();

export function queueLikeWrite(
  key: string,
  state: { desired: boolean; previous: boolean },
  write: LikeWriter,
): Promise<LikeOutcome> {
  const running = inflight.get(key);
  if (running) {
    // Zincir zaten dönüyor: yalnızca hedefi güncelle, ikinci bir yazma açma.
    running.desired = state.desired;
    return running.promise;
  }
  const entry: Entry = {
    desired: state.desired,
    previous: state.previous,
    promise: Promise.resolve({ ok: true, desired: state.desired, previous: state.previous }),
  };
  inflight.set(key, entry);
  entry.promise = (async (): Promise<LikeOutcome> => {
    let written: boolean | null = null;
    try {
      while (written !== entry.desired) {
        const target: boolean = entry.desired;
        await write(target);
        written = target;
      }
      return { ok: true, desired: entry.desired, previous: entry.previous };
    } catch {
      return { ok: false, desired: entry.desired, previous: entry.previous };
    } finally {
      inflight.delete(key);
    }
  })();
  return entry.promise;
}

/** Sıraya dizer ama birleştirmez: her çağrı kendi yazmasını yapar. */
export function chainLikeWrite<T>(key: string, write: () => Promise<T>): Promise<T> {
  const previous = chains.get(key) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(write);
  chains.set(key, next);
  void next.catch(() => undefined).then(() => {
    if (chains.get(key) === next) chains.delete(key);
  });
  return next;
}
