# Bluma — Endonezya Lansman Planı (Pilot Pazar 1)

> Rakip analizi: [RAKIP-ANALIZI-ENDONEZYA.md](RAKIP-ANALIZI-ENDONEZYA.md). Metadata
> formatı ve konumlama ilkeleri: [APP-STORE-METADATA.md](APP-STORE-METADATA.md)
> (görünür metinde rakip adı GEÇMEZ; "wattpad" yalnızca gizli Keywords alanında).
> Endonezce metinler taslaktır — canlıya almadan önce ana dili Endonezce olan birine
> okutulmalı (Fiverr/Upwork'te ~$20-30'lık iş).

## ⚠️ Kritik gerçek: Android
Endonezya'da telefon pazarının ~%85-90'ı Android. Salt App Store ile pilot, kitlenin
onda birine oynamak demek. **Play Store çıkışı bu pilotun ön şartı sayılmalı** —
zaten TR stratejisinde de "Play'e hızla çık" kararı vardı; Endonezya bunu öne çeker.

## Sıralama (özet)
1. **Hafta 0-1 — hazırlık:** id.json ana-dil kontrolü, mağaza metinleri hazır (aşağıda), Play çıkış süreci başlar.
2. **Hafta 1-2 — davet:** Penulis Pendiri programı duyurulur; hedefli DM + açık çağrı (şablonlar aşağıda).
3. **Hafta 2-6 — yazım dönemi:** hedef 15-20 Endonezce hikâye (her biri ≥3 bölüm).
4. **Hafta 6-7 — değerlendirme + vitrin:** kazananlar seçilir, ana sayfada öne çıkarılır.
5. **Hafta 7+ — ASO açılır:** id mağaza metinleri canlıya, ekran görüntüleri id.
6. **Sürekli:** id-locale D1/D7, haftalık yeni id hikâye sayısı izlenir; işleyen taktik Brezilya'ya kopyalanır.

---

## 1. "Penulis Pendiri" (Kurucu Yazar) Programı

**Hedef kitle** (rakip analizinden):
- NovelToon'da kontrat eşiğine (20 bölüm / 20k kelime) takılan hevesli yazarlar,
- Wattpad'de reklamdan bunalmış hobi yazarları,
- Storial.co kapanınca evsiz kalan topluluk yazarları.

**Teklif (dürüst kurgu — para vaadi YOK):**
- Kalıcı **"Penulis Pendiri"** rozeti + profildeki kurucu unvanı,
- Lansmanda ana sayfa vitrini (id kullanıcılarına ilk görünen hikâyeler),
- Kurucularla doğrudan iletişim hattı (DM) — ürün kararlarında söz hakkı,
- İlk 3'e küçük e-cüzdan ödülü (DANA/GoPay/OVO; toplam bütçe önerisi ~1,5-2,5 jt Rp ≈ $100-150).
- **Bilinçli konumlama:** "Uang/cuan" vaat eden Fizzo-tipi uygulamaların tersine
  topluluk + görünürlük vaat ediyoruz. Bu, "para için okuyan/yazan" kitleyi
  filtreler — istediğimiz bu.

**Kurallar:**
- Orijinal, Endonezce hikâye; program sonunda ≥3 bölüm (bölüm başı ~1.000+ kelime),
- Münhasırlık YOK — hikâye başka platformda da durabilir, haklar tamamen yazarda
  (NovelToon kontratlarına karşı en güçlü çekim noktamız; davette açıkça söylenir),
- İçerik politikası: müstehcen içerik yasak (16+ hedef — TR ile aynı "Yol B" kuralı).

**Operasyon notu:** Challenges sistemi kodda sabit tanımlı (`store/challengeStore.ts`),
kampanya v1'de uygulama DIŞINDA yürür (sosyal + manuel takip). Rozet için küçük iş:
profile "foundingWriter" alanı + profil ekranında rozet gösterimi (ileride).

### Davet kanalları
- **X / Threads / Lemon8:** #menulis #penulis #wattpadindonesia #noveltoon etiketleri;
  rakip şikâyet gönderilerinin altındaki aktif yazarlar birincil DM hedefi.
- **Facebook grupları:** Endonezya'da yazar toplulukları FB'de devasa (KBM tarzı
  "Komunitas Bisa Menulis" grupları); grup kurallarına uyarak açık çağrı paylaş.

### DM şablonu (id)
> Halo Kak! Aku dari tim Bluma — aplikasi baca-tulis cerita yang baru. Kami lagi
> cari 20 penulis pertama ("Penulis Pendiri") untuk komunitas Indonesia. Tanpa
> iklan, tanpa koin, tanpa antrean moderasi — cerita langsung tayang, dan hakmu
> tetap 100% milikmu (nggak ada kontrak eksklusif). Penulis Pendiri dapat badge
> permanen + cerita kamu tampil di halaman utama saat kami launching di Indonesia.
> Tertarik? Aku kirim detailnya 🙂

### Açık çağrı gönderisi (id)
> 📢 Dicari: 20 Penulis Pendiri Bluma Indonesia!
> Bluma itu tempat baca & nulis cerita — tanpa iklan, tanpa koin, dan ceritamu
> langsung tayang tanpa antre moderasi. Hak cerita 100% tetap di kamu, tanpa
> kontrak eksklusif.
> Yang kami cari: cerita orisinal berbahasa Indonesia, minimal 3 bab.
> Yang kamu dapat: badge Penulis Pendiri permanen, cerita kamu di halaman utama
> saat launching, dan hadiah e-wallet untuk 3 cerita terbaik.
> Minat? Komen "MAU" atau DM ya!

---

## 2. App Store metinleri — Endonezce (id locale)

### Uygulama Adı — "App Name" (maks. 30 karakter)
```
Bluma: Baca & Tulis Novel
```
*(25 karakter)*

### Alt Başlık — "Subtitle" (maks. 30 karakter)
```
Cerita gratis, tanpa iklan
```
*(26 karakter)*

### Anahtar Kelimeler — "Keywords" (maks. 100 karakter; başlık/alt başlıktaki kelimeler tekrarlanmadı)
```
wattpad,webnovel,romantis,fantasi,fanfik,horor,cerpen,komunitas,penulis,bab,cinta,remaja
```
*(~88 karakter)*

### Tanıtım Metni — "Promotional Text" (maks. 170 karakter)
```
Tempat cerita bertemu pembaca. Baca novel, fanfik, dan cerpen gratis; tulis ceritamu dan ngobrol langsung dengan penulis favoritmu. Tanpa iklan, tanpa koin.
```
*(~156 karakter)*

### Açıklama — "Description" (maks. 4000 karakter; emoji yok, bölüm başlıkları BÜYÜK HARF)
```
Bluma adalah komunitas cerita yang terus bertumbuh — tempat bertemunya mereka yang suka membaca dan menulis. Temukan novel, fanfik, dan cerpen gratis; atau tulis ceritamu sendiri, terbitkan bab demi bab, dan temui pembacamu.

Suka membaca sampai lupa waktu, atau punya cerita yang ingin kamu ceritakan — Bluma dibuat untuk keduanya.

BACA GRATIS TANPA BATAS
Romantis, fantasi, misteri, horor, fiksi ilmiah, remaja, sejarah, puisi, dan banyak lagi. Semua cerita sepenuhnya gratis — baca sampai tamat, sepuasnya.

YANG TIDAK ADA DI SINI
Tidak ada iklan yang memotong bacaanmu (atau tulisanmu). Tidak ada langganan "hapus iklan". Tidak ada layar "beli koin untuk lanjut baca" di bab paling seru. Tidak ada antrean moderasi berhari-hari — begitu kamu tekan terbitkan, ceritamu langsung tayang. Hanya cerita, kamu, dan waktu membaca yang tenang.

TULIS DAN TERBITKAN CERITAMU
Menulis di studio yang tenang dan bebas gangguan. Simpan sebagai draf, terbitkan dengan satu ketukan saat sudah siap. Pembaca pertamamu datang hari ini, bukan minggu depan.

MUDAH MENEMUKAN CERITA BARU
Jelajahi genre, lihat cerita pilihan, temukan penulis baru. Cerita berikutnya selalu hanya selangkah darimu.

LANJUT DARI POSISI TERAKHIR
Progres bacamu tersimpan di akunmu. Ganti ponsel pun, kamu tetap lanjut dari baris terakhir; perpustakaanmu selalu ikut.

BACA TANPA INTERNET
Unduh cerita favoritmu dengan satu ketukan dan baca offline — di kereta, di pesawat, di mana saja.

TANTANGAN DAN MISI
Selesaikan misi membaca dan menulis, kumpulkan XP, jaga streak harianmu. Lihat progresmu di profil; setiap misi membawamu ke misi berikutnya.

KOMUNITAS PEMBACA-PENULIS SUNGGUHAN
Suka, komentar, ikuti penulis favoritmu. Penulis melihat reaksi pembacanya; pembaca jadi bagian dari cerita yang mereka cintai.

NGOBROL DENGAN PENULIS DAN PEMBACA
Kirim pesan langsung ke penulis cerita favoritmu. Di Bluma, pembaca dan penulis hanya sejauh satu pesan.

NYAMAN DI MATA
Tema baca terang, sepia, gelap, dan hitam OLED; pilihan font dan jarak baris. Dirancang untuk sesi baca panjang dan larut malam.

KOMUNITAS YANG AMAN
Konten yang dilaporkan akan ditinjau; konten dewasa ditandai dengan jelas dan difilter sesuai usia. Blokir pengguna yang mengganggu dan laporkan konten dengan satu ketukan.

Untuk kamu yang tak pernah puas membaca dan kamu yang punya cerita untuk diceritakan — Bluma menunggumu. Unduh gratis, baca atau tulis cerita pertamamu hari ini.
```

### Ekran görüntüleri
İlk görsel mesajı: **"Tanpa iklan • Tanpa koin • Langsung tayang"**. Kalanlar TR
setiyle aynı akış (okuma temaları, yazı stüdyosu, topluluk/mesajlaşma), metinler id.

---

## 3. Ön koşul kontrol listesi
- [x] Hikâye dili otomatik atanıyor (`storyApi` → `language: i18n.language`)
- [x] Öneri algoritması dil eşleşmesini öne çıkarıyor (1.3x / 0.5x, `recommendations.ts`)
- [ ] `i18n/locales/id.json` ana-dil kontrolünden geçirilecek
- [ ] **Play Store çıkışı** (Endonezya ~%85-90 Android — pilotun ön şartı)
- [ ] App Store Connect'e id locale metinleri girilecek (bu doküman, Bölüm 2)
- [ ] Ekran görüntüleri id olarak üretilecek
- [ ] Endonezce içerik raporlarını yönetme planı (çeviri destekli manuel moderasyon)
- [ ] (İleride) `foundingWriter` profil alanı + rozet gösterimi

## 4. Ölçüm (başarı kriterleri)
- Davet dönemi: başvuran yazar sayısı (hedef ≥30 başvuru → ~20 aktif),
- Yazım dönemi sonu: ≥3 bölümlü Endonezce hikâye sayısı (hedef 15-20),
- ASO sonrası: id-locale indirme, D1/D7 retention (TR kohortuyla kıyas),
- Kalıcılık: yarışma bittikten 4 hafta sonra haftalık yeni id hikâye sayısı
  (sıfıra düşüyorsa topluluk tutmadı demektir — Brezilya'ya geçmeden nedeni anlaşılmalı).
