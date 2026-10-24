# Argent ile kısa ve tekrar kullanılabilir testler

UI yolunu her turda yeniden keşfetmek yerine `.argent/flows/local-*.yaml`
akışlarını çalıştır. Komut katmanı: `scripts/qa/argent.cjs`.

## İlk kullanım

Yerel Firebase emülatörleri ve 8082 Metro açık olmalı; **bluma Yerel**
kurulmuş olmalı. Kurulum ve test hesapları: [LOCAL-TESTING.md](LOCAL-TESTING.md).
Native kod değişmedikçe yeniden build alma.

```sh
yarn qa:ui use <simülatör-UDID>
yarn qa:ui run local-reader-check
```

Cihaz seçimi `.argent/session.local.json` içinde saklanır. Komut yalnızca
iOS simülatörünü destekler; Android için henüz uyarlanmadı. Kullandığımız
Argent **0.25.0** sürümü proje bağımlılıklarında veya npm'in mevcut npx
önbelleğinde aranır. Her çağrıda paket indirilmez. Kurulum başka yerdeyse
`ARGENT_CLI=/kurulu/argent/dist/cli.js` ver. Sürüm yükseltmesi bilinçli yapılır.

## Sonucu okuma

- `OK`: komut/akış tamamlandı; akışta yalnızca yazılı kontroller sınanmıştır.
- `WARN`: uyarı var; ayrıntısı kısa sonuçta görünür. İncelemeden temiz geçiş sayma.
- `FAIL` / `ERROR`: başarısızlık; süreç sıfırdan farklı kodla kapanır.

Başarılı akışta yalnızca adım sayıları, süre ve rapor yolu döner. Tam JSON
`.argent/results/<çalışma>/result.json` içinde kalır; başarılı adımların
listesi ve ekran görüntüleri model bağlamına gönderilmez. Başarısızlıkta
`failure.png` de alınır; görüntü alınamazsa asıl hata JSON'da korunur.
Bu sonuçlar ve cihaz seçimi Git'e eklenmez.

İnceleme gerektiğinde önce yalnızca ilgili satırları iste:

```sh
yarn qa:ui inspect 'Yaz|Write|Profile'
```

En fazla 16 eşleşme döner; tam ağaç yine rapor dosyasındadır. Ekran
görüntüsünü yalnızca görsel hata, belirsiz durum veya kanıt için aç.

## Yeni akışı bir kez kaydet

Argent'ın `flow-start-recording`, `flow-add-echo`, `flow-add-step` ve
`flow-finish-recording` araçları `exec` üzerinden kullanılabilir:

```sh
yarn qa:ui exec flow-start-recording '{"name":"local-ornek"}'
yarn qa:ui exec flow-add-step '{"name":"local-ornek","command":"restart-app","args":{}}'
```

Ardından gerçek cihazda doğruladığın adımları `flow-add-step` ile ekle,
`flow-finish-recording` ile bitir. Komut katmanı `project_root`, cihaz ve
yerel bundle kimliğini ekler. Var olan kayıt üzerine yazmayı reddeder.
İlk yürüyüşü kaydet; geçmişte yapılan işlemleri hatıradan YAML'a yazma.
Bitmiş kaydı anlamını değiştirmeden `await`/`assert` ve seçici adımlarına
dönüştür; son YAML'ı baştan sona tekrar çalıştır.

Sabit `testID`/erişilebilirlik etiketi kullan; koordinat ve ekran dili
bağımlılığını yeni akışlara taşımamaya çalış. Dokunduğun UI hedefinde uygun
kimlik yoksa oraya ekle. Sayfa değişince hedef ekranı ve hazır olmasını
ayrı doğrula. Klavye komutunun başarılı dönmesi metnin girildiğini kanıtlamaz;
kaydedilen değeri de kontrol et. Gerçek parolalar için Argent secret kullan.

## Kapsamı küçük tut

Değişen davranışın servis/kural testi yeterliyse UI turu yapma. UI değiştiyse
ilgili akışı bir kez çalıştır. Yeni değişiklik veya açıklanmamış hata yoksa
geçen bütün testleri tekrar çalıştırma. `tsc --noEmit` proje gereği korunur.
Akış ilk hatada durur; yalnızca ilk sapmayı incele. Aynı adıma iki başarısız
düzeltmeden sonra kör tekrar yerine engeli raporla.

**Gezinme testi** gerçek düğmeleri/sekmeleri kullanır. Derin bağlantı ancak
ekranı hazırlamak için kullanılır; sekme sorununun çözüldüğünü kanıtlamaz.

## Doğrulanan başlangıç akışı

`local-reader-check` için ön koşul: yerel **okur** hesabında açık oturum,
İngilizce arayüz ve `local-published-story` örnek hikâyesi. Akış uygulamayı
yeniden başlatır, okur ana sayfasını doğrular, hikâyeyi derin bağlantıyla
açar ve okur kontrolleriyle başlığı doğrular. Giriş yapmaz, yayınlamaz ve
bildirim sayısını sınamaz; önceki altı senaryonun otomasyonu değildir.

16 Ekim 2026 son tekrar: **7 adım geçti, 0 hata/uyarı; yaklaşık 15 saniye**.
Bu, o simülatörde ölçülen akış süresidir; sabit süre taahhüdü değildir.

Sonraki hata parçalarında ilgili yollar ayrıca kaydedilir. Mağaza görselleri
için mevcut `store-*` akışları normal uygulamayı hedefler; yerel test
komutundan ayrı tutulur.

## Yaz sekmesi kontrolü

`yarn qa:ui run local-write-tab`, aynı yerel okur hesabı ve İngilizce arayüzle
ana sayfadan gerçek **Write** sekmesine basar; **Writing Studio** başlığını
doğrular. Derin bağlantı kullanmaz. `tab-write` kalıcı test kimliğidir.

16 Ekim 2026: 7 adım başarılı, 0 hata; yaklaşık 16 saniye. Stüdyodaki
`idle` küçük ekran hareketi uyarısı nedeniyle sonuç `WARN` olarak korunur.
Görsel kontrolde stüdyo başlığı, yeni hikâye aksiyonu ve boş liste durumu
doğrulandı, yükleme göstergesi görülmedi. Uyarının hareket kaynağı kesin
belirlenmedi; bu kayıt uyarısız test diye sunulmaz.
