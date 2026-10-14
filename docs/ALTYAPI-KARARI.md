# Bluma: Altyapı ve maliyet kararı

12 Ekim 2026. 495 kayıtlı kullanıcıda Firebase Spark (ücretsiz) kotası aşıldı.

## Karar

1. **Veritabanını taşımıyoruz.** Firestore yazma, oturuma bağlı özel veri ve canlı kısımlar (DM, bildirim) için kalıyor. Firebase Auth zaten ücretsiz, o da kalıyor.
2. **Önce israfı kestik** (bu sürümde, aşağıda). Kotayı kullanıcı sayısı değil okuma desenleri tüketiyordu.
3. **Herkese açık, okuma ağırlıklı veri Cloudflare'e gidiyor** (Faz 1 ile birlikte): akış, arama indeksi, hikâye künyesi, yazar kartları. VPS'teki `discovery` servisi bunları JSON olarak Cloudflare R2'ye yazar, uygulama CDN'den okur. Firestore okuması sıfıra iner, CDN önbellek isabetleri ücretsiz.
4. **Geçiş dönemi için Blaze + bütçe uyarısı önerilir** (karar Samet'in). Mağazadaki eski sürümler güncellenene kadar eski okuma desenini kullanmaya devam eder; Spark'ta kota dolunca uygulama İstanbul saatiyle ertesi gün ~10:00'a kadar veri alamaz.

## Elenenler

| Seçenek | Neden şimdi değil |
|---|---|
| Tam geçiş: Cloudflare D1 + Workers | Ücretsiz katman çok cömert (günde 5M satır okuma) ama ~100 servis dosyası, güvenlik kuralları ve canlı mesajlaşma (Durable Objects) yeniden yazılır: 3-6 hafta, yüksek regresyon riski. Eski sürümler yine Firestore'a gider. Firestore faturası ayda ~20$'ı geçerse yeniden değerlendirilir; Faz 1'in Cloudflare katmanı bu geçişin dikiş yeri olur. |
| Supabase | İstek başına ücret yok ama 500 MB veritabanı, ayda 5 GB çıkış; yine tam yeniden yazım. Getirisi maliyetine değmiyor. |
| VPS'te kendi veritabanı (PocketBase/Postgres) | Aynı VPS görselleri ve push'u taşıyor; tek nokta arızası, yedek ve bakım yükü. |

## Bu sürümde kesilen israf

| Kaynak | Önce | Sonra |
|---|---|---|
| Ana akış | 50 hikâyeye **canlı dinleyici**. Her görüntülenme sayacı artışı, o an uygulaması açık her kullanıcıya ayrı okuma olarak faturalanıyordu | Tek seferlik okuma; 10 dk önbellek, aşağı çekince ve yayında tazelenir |
| `loadDiscoverStories` | Her ana sayfa/profil/kitaplık açılışında 100 okuma, yalnızca "sırada ne okusam" için | Kaldırıldı; aday havuzu ana akış |
| Kitaplık sekmesi | Her dönüşte tüm akış başlatıcısı (~100+ okuma) | Yalnızca kitaplık dinleyicileri (tekil) |
| Beğenilen/kaydedilen rafları | Her değişiklikte her hikâye tekrar okunuyordu; ana sayfaya her dönüşte bir kez daha | Raf önbelleği (10 dk); ana sayfa dönüşünde yeniden okuma yok |
| Okumaya Devam Et | Ana sayfaya her dönüşte 10 + 10 okuma | Yalnızca bölüm değişince, 5 dk geçince ya da aşağı çekince |
| Yazar bilgisi | 5 dk önbellek | 30 dk |
| Arama kataloğu | Sekme her açıldığında 100 okuma | 10 dk önbellek |
| Okuma ilerlemesi (**yazma**) | Kaydırırken ~2 sn'de bir Firestore yazımı (10 dk okuma ≈ 300 yazım) | Bölüm değişince hemen, aynı bölümde dakikada en fazla 1 (≈ 10 yazım). Cihaza yazım aynı |
| Sayaç mutabakatı cron'u | Haftalık; tek çalıştırma on binlerce okuma | Aylık (VPS'te `cron/install.sh` yeniden çalıştırılmalı) |

Tahmin (kod üzerinden, konsol verisiyle doğrulanmalı): oturum açık kullanıcı başına günlük okuma ~%50-70 azalır, ilerleme yazımları ~%95 azalır.

## Cloudflare katmanı (Faz 1 ile)

```
Firestore ──Admin SDK──► VPS: server/discovery ──S3 API──► R2 (bluma-public)
                                                              │
                                     Cloudflare CDN (özel alan adı, önbellek kuralı)
                                                              │
                                                uygulama: fetch(home.json, search.json, ...)
```

- Çıktılar: `v1/home.json`, `v1/search.json`, `v1/stories/{id}.json`. E-posta ve kimlik alanları asla girmez.
- Ücretsiz katman: R2 10 GB depolama, ayda 1M yazma / 10M okuma işlemi, çıkış ücreti yok. CDN önbellek isabetleri R2 işlemi saymaz. Worker gerekmez (Worker kullanılırsa günde 100K istek sınırı var).
- Gerekenler (Samet): Cloudflare hesabı, Cloudflare DNS'te bir alan adı (R2 özel alan adı için zorunlu; `r2.dev` adresi üretim için hız sınırlı), R2 bucket ve VPS'e konacak R2 erişim anahtarı.

## Kaynaklar

- Firestore fiyatlandırma ve ücretsiz kota: https://cloud.google.com/firestore/pricing
- D1 fiyatlandırma: https://developers.cloudflare.com/d1/platform/pricing/
- D1 ücretsiz katman sınırlarının uygulanması (1 Eyl 2026): https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/
- Cloudflare planları: https://www.cloudflare.com/pricing/
