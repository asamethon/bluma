# Canlıya göndermeden uygulamada test

`bluma Yerel`, iOS/Android uygulama kimliği ayrı olan bir geliştirme sürümüdür.
Firebase projesi `demo-bluma-local`'dır; bu projenin canlı kaynakları yoktur.
Auth ve Firestore bilgisayarındaki emülatörlere bağlanır. Mevcut uygulamanın
oturumu ve verileri ayrıdır. Gerçek hesap parolan yerine aşağıdaki test
hesaplarını kullan. Yeni `firestore.rules` dosyası emülatörde doğrudan yüklenir;
deploy veya profil verisi taşıması gerekmez.

## Başlatma

1. İlk terminalde `yarn local:emulators` çalıştır; açık bırak.
2. İkinci terminalde `yarn local:seed`, ardından `yarn local:start` çalıştır;
   Metro'yu açık bırak. Metro bu ortam için ayrı `8082` portunu kullanır.
3. Üçüncü terminalde ilk kurulum için `yarn local:ios` çalıştır
   (Android emülatörü için `yarn local:android`).
4. Telefonda/simülatörde **bluma Yerel** uygulamasını aç ve e-posta ile giriş yap.

| Rol | E-posta | Şifre |
| --- | --- | --- |
| Yazar | `yazar@bluma.test` | `BlumaTest123!` |
| Okur (yazarı takip eder) | `okur@bluma.test` | `BlumaTest123!` |

İki hesabın e-postası doğrulanmıştır; kullanıcı adı ve ilgi alanları hazırdır.
İlk kurulumda **Yerel Yayın Testi** adlı, tek bölümü yayınlanmış örnek hikâye oluşturulur.
`local:seed` tekrar çalıştırıldığında hikâyeyi veya taslaklarını sıfırlamaz.

Emülatör paneli: <http://127.0.0.1:4000>. Buradan hesapları, hikâyenin genel
`chapters` ve özel `draftChapters` belgelerini inceleyebilirsin. Emülatörleri
Ctrl+C ile kapattığında veriler `.firebase-local/` altında saklanır ve sonraki
açılışta yüklenir. Bu klasör Git'e eklenmez.

`local:ios`/`local:android` derleme sonunda native proje ayarlarını normal
uygulamaya geri alır; kurulan yerel uygulama cihazda kalır. Normal geliştirmeye
dönmek için kendi Metro sunucunu `yarn start` ile açıp normal **bluma**
uygulamasını kullan. Yanlış Metro veya canlı native Firebase ile yerel mod
eşleşirse uygulama başlangıçta hata verir ve işlemleri başlatmaz.

## Kontrol akışı

1. Yazar hesabıyla örnek hikâyeyi aç. Metni değiştir, ikinci bölümü ekle ve
   kaydı bekle. Editörden çıkıp dön: metinler korunmalı.
2. Çıkış yapıp okur hesabına gir. Hikâyeyi yeniden aç: eski yayın görünmeli,
   yeni bölüm ve bildirimi görünmemeli.
3. Yazara dönüp yeni bölümü doldur ve **Yayınla** de. Okur hesabıyla hikâyeyi
   yeniden aç: yeni metin/bölüm ve tek yeni bölüm bildirimi görünmeli.
4. Yalnızca metni düzeltip tekrar yayınla: aynı bölüm bildirimi tekrarlanmamalı.
5. Boş bölüm ekleyerek yayınlamayı dene: uyarı çıkmalı, okuyucu sürümü korunmalı.
6. Profilde kullanıcı adını/biyografiyi değiştirip çıkış-giriş yap: korunmalı.
   Panelde açık `users/{uid}` içinde e-posta bulunmamalı; e-posta
   `users/{uid}/private/account` altında kalmalı.

İki iOS simülatörü aynı anda kullanılabilir. Android emülatörü bilgisayara
`10.0.2.2`, iOS simülatörü `127.0.0.1` üzerinden bağlanır. Bu kurulum
emülatör portlarını yalnızca bilgisayarda dinler; fiziksel telefon için
ayrıca ağ adresi yapılandırması gerekir.

## Kapsam ve otomatik doğrulama

`yarn local:test`, iki gerçek Auth emülatörü oturumuyla profil gizliliğini,
taslak erişimini ve atomik yayın yazımlarını doğrular; kendi geçici hikâyesini
temizler. Önce emülatörler ve `local:seed` çalışmış olmalıdır.

Uygulama içi bildirim belgeleri yerel Firestore'a yazılır. Telefonun sistem
push bildirimi, gerçek Google/Apple oturumu ve VPS görsel yükleme bu testin
kapsamında değildir. Yerel sürümde Google/Apple düğmeleri ve görsel yükleme
kapalıdır; canlı e-posta/görsel API'leri ve Expo push token kaydı kullanılmaz.
E-posta doğrulama/sıfırlama bağlantıları gerçek posta yerine Auth emülatörü
terminalinde görünür.

Kaynak: [Firebase Auth emülatörü](https://firebase.google.com/docs/emulator-suite/connect_auth)
ve [Firestore emülatörü](https://firebase.google.com/docs/emulator-suite/connect_firestore).

## Uygulamada doğrulama — 16 Ekim 2026

`bluma Yerel`, iPhone 18 Pro / iOS 27 simülatöründe iki test hesabıyla
çalıştırıldı. İşlemler uygulamanın arayüzünden yapıldı; sonuçlar yerel
Firestore belgeleriyle de karşılaştırıldı. Canlıya deploy yapılmadı.

| Senaryo | Sonuç |
| --- | --- |
| Taslağın okura kapalı kalması | Yazar ilk metni değiştirdi ve ikinci bölümü ekledi; okur yayınlamadan önce eski tek bölümü gördü, bildirim oluşmadı. |
| Hızlı çıkışta otomatik kayıt | Son karakterden yaklaşık 155 ms sonra editörden çıkıldı; yeniden açıldığında son karakter dahil metin korundu. |
| İki bölümü yayınlama | Yayınla ve onay adımları tamamlandı; okur iki güncel bölümü ve tek yeni bölüm bildirimini gördü. |
| Metin düzeltmesini tekrar yayınlama | Okur düzeltilmiş metni gördü; yeni bölüm bildirimi sayısı birde kaldı. |
| Boş üçüncü bölümü yayınlama | Boş bölüm uyarısı çıktı; taslak korundu, okur sürümü iki bölümde ve bildirim sayısı birde kaldı. |
| Profilin korunması ve gizlilik | Kullanıcı adı/biyografi çıkış-girişten sonra korundu. Açık profilde e-posta yok; e-posta özel hesap belgesinde. |

Otomatik doğrulama: 23 Jest paketi / 133 test, 13 Firestore güvenlik kuralı
testi ve iki gerçek Auth emülatörü oturumuyla çalışan `local:test` başarılı.
Sistem push bildirimi, gerçek Google/Apple girişi, fiziksel cihaz ve Android
bu uygulama turunda sınanmadı.

**İlk turda bulunan Yaz sekmesi sorunu çözüldü:** Expo Router, ayrı bir
bileşene sarılmış sekme tanımını yok sayıyordu. Trigger doğrudan tanımlandı.
`local-write-tab` akışında gerçek sekmeye basılıp yazı stüdyosunun açıldığı
doğrulandı. İlk turdaki editör kontrolleri ise uygulama bağlantısıyla yapılmıştı.
Argent'ın genel hareketsizlik kontrolü küçük ekran hareketi uyarısı veriyor;
bu uyarı temiz geçiş diye gizlenmedi. Son ekran görsel olarak incelendi:
stüdyo başlığı, yeni hikâye aksiyonu ve boş liste durumu görünür, yükleme
göstergesi yok. Hareketin kesin kaynağı belirlenmedi.

Test sonunda örnek hikâyede iki yayınlanmış bölüm ve boş üçüncü bölüm
taslağı bulunuyor. `local:seed` mevcut test çalışmalarını sıfırlamaz.
