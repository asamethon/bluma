# Yazar Aktivasyonu — Tasarım Brief'i

Fonksiyonel taraf kodlandı (21 Temmuz 2026). Aşağıdaki yüzeyler çalışır durumda ama görsel olarak "işlevsel varsayılan" seviyesinde — senin tasarımınla değiştirilecek. Her başlıkta ilgili dosya belirtildi; tasarımı verdiğinde bağlarım.

## 1. Ana sayfa "İlk hikâyeni yaz" kartı (öncelik 1)
**Dosya:** `features/story/components/WriterNudgeCard.tsx`
Hiç hikâyesi olmayan kayıtlı kullanıcıya ana akışın en üstünde görünür. İçeriği: başlık + alt metin, "Günün Konusu" kutusu (her gün değişen yazma konusu, 11 dilde), "Bu konuyla yaz" bağlantısı ve "Yazmaya Başla" butonu. İkisi de tek dokunuşla editörü açar.

Tasarlanacak: kartın görsel kimliği. Öneri: bloom marka öğesiyle sıcak/davetkâr bir illüstrasyon veya gradyan, günün konusu "el yazısı defter" hissiyle serif fontta, kart akışın geri kalanından belirgin ayrışsın. Kullanıcı hikâye oluşturunca kart kendiliğinden kaybolur — kapatma (X) düğmesi tasarlamana gerek yok, ama istersen ekleyebiliriz.

## 2. Hızlı başlangıç sonrası boş editör (öncelik 2)
**Dosyalar:** `features/story/components/studio/ComposerCanvas.tsx`, `useComposer.ts`
"Yazmaya Başla" artık formu atlayıp doğrudan editörü açıyor (taslak: "Adsız Hikâye"). Kullanıcının ilk gördüğü şey boş tuval.

Tasarlanacak: boş tuvalin ilk anı. Öneri: gövde placeholder'ı cesaretlendirici bir cümle ("İlk cümleni yaz, gerisi gelir…" tonunda), başlık alanında "Adsız Hikâye"nin kolayca değiştirilebilir hissettirilmesi (örn. hafif vurgulu/soluk stil). İstersen ilk açılışta klavye otomatik açılsın — söyle, fonksiyonel olarak eklerim.

## 3. Yayınlarken "bilgileri tamamla" akışı (öncelik 3)
**Dosya:** `useComposer.ts` (şu an native Alert), hedef: yeni bileşen
Başlıksız/türsüz taslak yayınlanmak istendiğinde şu an bir Alert çıkıp "Hikâye Bilgilerini Düzenle" ekranına yönlendiriyor. Çalışıyor ama kopuk hissettiriyor.

Tasarlanacak (istersen): editörün üstünde açılan bir "yayınlama sayfası" bottom-sheet'i — tek akışta başlık → tür çipleri → kapak (opsiyonel) → Yayınla butonu. Wattpad/Medium'daki "publish flow" kalıbı. Tasarımı verirsen Alert'i bununla değiştiririm.

## 4. Yazı Stüdyosu CTA'sı (küçük)
**Dosya:** `features/story/components/studio/StudioHub.tsx`
CTA metni "Yazmaya Başla / Tek dokunuş, boş sayfa — başlık ve kapak sonra" oldu ve artık form yerine doğrudan editörü açıyor. Mevcut kesikli-çerçeve kart tasarımı duruyor; istersen ana aksiyona daha dolgun/iddialı bir buton tasarla.

## 5. Onboarding sonrası ilk an (küçük)
Onboarding'de "Yazar" veya "İkisi de" seçen kullanıcı artık doğrudan Yazı Stüdyosu'na düşüyor. İlk gördüğü şey stüdyonun boş hâli + CTA. Boş durum illüstrasyonu (şu an sadece ikon + metin) tasarlanırsa çok daha davetkâr olur.

## Fonksiyonel olarak eklenenler (tasarım gerektirmez)
- **Günün konusu:** `features/story/utils/writingPrompts.ts` — 10 konu × 11 dil, güne göre deterministik döner. Konuyla başlanınca konu metni ilk bölümün açılış satırı olarak eklenir.
- **Yerel hatırlatmalar:** `features/story/services/writerReminders.ts` — hiç hikâyesi olmayana 48 saat sonra "ilk hikâyen seni bekliyor", taslağı olana 24 saat sonra "hikâyen yarım kaldı" bildirimi. Uygulama açıldıkça sayaç sıfırlanır (idempotent), bildirim izni yalnızca zaten verilmişse kullanılır. Sunucu değişikliği YOK.
- **Intent kalıcılığı:** onboarding'deki reader/writer/both seçimi artık `users` dokümanına yazılıyor (`intent` alanı) — ileride segmentli push/kampanya için hazır.
- **Yayın kalite kapısı:** başlıksız ("Adsız Hikâye") veya türsüz hikâye yayınlanamaz; kullanıcı bilgi ekranına yönlendirilir. Bilgi ekranından dönüşte composer metadata'yı tazeler (eski "tür seçtim ama hâlâ uyarıyor" bug'ı da düzeldi).

## Test listesi
1. Yeni hesap aç → onboarding'de "Yazar" seç → Yazı Stüdyosu'na düşmeli.
2. Ana sayfada kart görünmeli (hikâyesi olmayan hesapta); "Bu konuyla yaz" → editör, ilk satırda günün konusu.
3. Editörde birkaç kelime yaz → Yayınla → "Son bir adım" uyarısı → bilgileri doldur → dön → Yayınla çalışmalı.
4. Taslak bırak, uygulamayı kapat → 24 saat sonra bildirim (test için `writerReminders.ts` içindeki `DAY_SECONDS` değerini geçici 60 yap).
5. `npx tsc --noEmit` → 0 hata (doğrulandı).
