# Bluma — Proje Kuralları

Expo (SDK 56) + React Native Firebase hikâye okuma/yazma uygulaması.
Mimari hedefler ve detaylı rehber: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — **yeni kod yazmadan önce oku.**

## Komutlar
- Tip kontrolü: `npx tsc --noEmit` (her değişiklikten sonra ZORUNLU — 0 hata beklenir)
- Lint: `npx eslint <dosyalar>`
- Çalıştırma: `npx expo start` (native modül eklendiyse `npx expo run:ios`)

## Mimari (zorunlu)
- **Feature-based:** yeni kod `features/<alan>/` altına (components/, hooks/, services/). Ekranlar (`app/`) yalnızca kompozisyon yapar: hook çağır + bileşen diz. Ekranda iş mantığı ve doğrudan Firestore çağrısı YASAK.
- **Atomic UI:** paylaşılan görsel parçalar `components/ui/` (atom/molekül). Feature'a özgü organizmalar `features/<alan>/components/`.
- **Dosya boyutu:** hedef ~150 satır, katı sınır 200. Aşıyorsan böl — bölemiyorsan tasarım yanlıştır.
- **Eski kod:** dokunduğun eski dosyayı fırsat varsa bu mimariye taşı (boy-scout). Dokunmadığın yeri toptan refactor etme.

## Firestore kuralları
- Sayaçlar HER ZAMAN atomik `increment()` — koleksiyon okuyup saymak yasak.
- Kullanıcı-başına tekil kayıtlar (beğeni, kaydetme) deterministik doküman ID'siyle (`likes/{userId}` gibi), `addDoc` değil.
- Kullanıcıya dönük aksiyonlar **optimistic**: UI anında güncellenir, yazma arka planda, hatada geri al. Bildirim/push gönderimi asla `await` edilmez.
- Görseller base64 olarak Firestore'a YAZILMAZ — `imageUploadService` üzerinden VPS görsel servisine gider (`constants/config.ts` → `IMAGE_SERVER_URL`).
- Güvenlik kuralları `firestore.rules` içinde; yeni koleksiyon eklersen kuralını da ekle (varsayılan deny).

## React kuralları
- **`useEffect` son çaredir.** Kullanmadan önce sor: türetilmiş değer mi? → render'da hesapla. Kullanıcı aksiyonuna tepki mi? → event handler. Sunucu verisi mi? → feature hook'u / store listener'ı. Meşru tek kullanım: dış sistemlere abonelik (Firestore listener, klavye, AppState) — o da ekranda değil, feature hook'unun İÇİNDE durur.
- **`useState` yalnızca geçici, ekrana-özel UI durumu için** (modal açık mı, input metni). Paylaşılan/sunucu verisi Redux store'unda yaşar (`store/slices/*`); türetilen değer state'e KOPYALANMAZ, render'da hesaplanır.
- **`useRef` yalnızca imperative tutamaç için** (scroll, TextInput odağı). "Render tetiklemeyen değişken" hack'i olarak kullanma.
- **Prop drilling yasak (2 seviyeden derine prop geçirme):** paylaşılan durum için Redux store veya mevcut context'ler (Theme, GuestGate); yapı için `children` kompozisyonu.
- Effect bağımlılıklarında store'dan gelen OBJE kullanma — primitive kullan (`user?.id`, `user` değil). (Bu, "sayfa gidip geliyor" bug'ının köküydü.)
- Hook'lar erken return'den önce; global `isLoading` ile tam ekran spinner'a düşüp sayfayı remount etme.
- Tema: `useTheme()` — `Colors[colorScheme]` doğrudan kullanma.
- Real-time listener kuran her fonksiyon idempotent olmalı (öncekini kapat veya no-op).

## Performans kuralları
- Uzun/dinamik listelerde `FlatList` (veya `FlashList`) — `ScrollView` + `.map()` yasak.
- Liste satırları ayrı bileşen + `React.memo`; satıra inline closure yerine stabil callback.
- Reaktivite `useAppSelector` ile ince taneli tutulur: bütün slice'ı değil, mümkün olan en dar dilimi seç (`s => s.auth.user?.id` gibi) ve selector'ı ihtiyaç duyan en alt bileşende çağır ki üst ağaç yeniden render olmasın. Bileşenlerde `useAppSelector`/`useAppDispatch` (`store/hooks.ts`), servislerde `store.getState()`/`store.dispatch()` kullanılır.
- Görseller `expo-image` (cache'li); render içinde ağır hesap varsa `useMemo`.

## Dil ve metin
- Kullanıcıya görünen tüm metinler Türkçe; kod yorumları Türkçe tercih edilir.
- Bölüm ayracı: hikâye içeriğinde `\n§§\n` (write/edit/reader hepsinde aynı).

## Yayın notları
- Firestore kural değişikliği → `firebase deploy --only firestore:rules` gerekir (hatırlat).
- `server/` = VPS görsel servisi (blumaimg.d4tecompany.com); değişiklikte rsync + `systemctl restart bluma-image-server` (bkz. server/README.md).
