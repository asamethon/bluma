/**
 * Vitrin sıralamasının sürümü. Bölüm sırası, ağırlıklar ya da aday havuzu her
 * değiştiğinde artırılır; analytics olaylarına `algo_version` olarak gider ve
 * önce/sonra karşılaştırmasını mümkün kılar (bkz. docs/KESFET-ALGORITMASI.md).
 *
 * 0: Faz 0, istemci tarafı sıralama, bölümler arası tekrar kaldırıldı.
 */
export const ALGO_VERSION = 0;

/** Okumayı başlatan vitrin. Analytics'te `section` / `src` değeri olarak gider. */
export type FeedSource =
  | 'continue_reading'
  | 'following'
  | 'editors_pick'
  | 'for_you'
  | 'popular_now'
  | 'new_arrivals'
  | 'most_read'
  | 'category'
  | 'search';

/** Takip butonunun bulunduğu yer. */
export type FollowSource = 'search' | 'profile' | 'reader';
