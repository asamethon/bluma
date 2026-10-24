# Özel bölüm taslakları — hata taraması 2. madde

Otomatik kayıt `stories/{storyId}/draftChapters/{index}` yoluna yazar.
`_meta` belgesi stüdyoda gösterilen bölüm başlıklarını ve kelime sayılarını tutar.
Bu koleksiyon, hikâye yayında olsa bile yalnızca yazara açıktır. Okuyucu ve
çevrimdışı indirme yalnızca mevcut `/chapters` koleksiyonunu kullanır.

Yazar açıkça **Yayınla** dediğinde bölüm gövdeleri, silinen bölümler,
hikâye üstverisi ve ilk yayın sayacı tek transaction içinde güncellenir.
Boş bölüm yayımlanmaz. İlk yayın/yeni bölüm duyurusu yalnızca başarılı
transaction sonrasında gönderilir. Metin düzeltmesi ve tekrar yayınlama
yeni bölüm duyurusunu tekrarlamaz. `lastNotifiedChapterCount`, bölüm silip
aynı sayıya dönünce tekrar duyuru gönderilmesini önler.

Eski hikâyelerde özel taslak yoksa editör mevcut içerikten başlar. Yeni
kayıtlar özel alana gider; geçmiş içeriği topluca taşımak gerekmez.
Editörden çıkışta son otomatik kayıt başlatılır; aynı hikâyenin kayıtları ve
yayınları sırayla işlenir. Yeniden açılış bekleyen yazımın tamamlanmasını bekler.

## Canlıya göndermeden test

[Yerel test kurulumu](LOCAL-TESTING.md) ile uygulamayı Auth/Firestore
emülatörlerine bağlayabilirsin. Aşağıdaki dağıtım adımları bu test için gerekmez.

## Canlıya dağıtım önkoşulu

Yeni uygulama kullanılmadan önce `/draftChapters` için yazar erişim kuralı
dağıtılmalıdır. Aksi halde editör taslağı açamaz/kaydedemez ve izin hatasını
gösterir. Bu oturumda canlı kurallar değiştirilmedi.

`firebase deploy --only firestore:rules`, dosyadaki **tüm** kural değişikliklerini
dağıtır. Dosyada 1. maddenin profil geçişi de bulunduğundan bu komutu doğrudan
çalıştırmadan önce [profil geçiş sırasını](PRIVATE-PROFILES-MIGRATION.md) uygulayın.
Aşamalı test için canlı kurallara yalnızca yeni özel hesap ve özel taslak
erişim izinleri eklenebilir; açık profil alanlarını reddeden kurallar ayrı
geçişte uygulanmalıdır. Eski uygulamalar genel bölümlere yazmaya devam eder;
taslak ayrımı yeni uygulama sürümüyle devreye girer.

## Uygulamada kontrol

1. Yayındaki bir hikâyenin metnini değiştirin ve yeni bölüm ekleyin. Kaydı
   bekleyin, editörden çıkıp yeniden açın: son metin ve yeni bölüm korunmalı.
2. Başka hesapta hikâyeyi yeniden açın: **Yayınla** öncesinde önceki sürüm ve
   bölüm sayısı görünmeli; yeni bölüm bildirimi gelmemeli.
3. Yeni bölümü doldurup **Yayınla** deyin: okuyucu yeni sürümü görmeli; yazarı
   takip eden başka hesap tek yeni bölüm bildirimi almalı. Metin düzeltip
   yeniden yayınlamak aynı bildirimi tekrar göndermemeli.
4. Boş bölümle yayınlamayı deneyin: uyarı çıkmalı; okuyucu sürümü korunmalı.
5. Yazıp 800 ms dolmadan editörden çıkın ve geri dönün: son metin görünmeli.
6. Taslak kaydı hata verirse bağlantıyı düzelttikten sonra **Kaydedilemedi ·
   Tekrar dene** rozetine dokunun: kayıt tamamlanmalı.

Otomatik kontroller: `npx tsc --noEmit`, `npx jest --runInBand --watchman=false`.
Kural testleri demo Firestore emülatöründe çalışır:
`node --test scripts/tests/profilePrivacy.rules.test.cjs scripts/tests/chapterDraft.rules.test.cjs`.
