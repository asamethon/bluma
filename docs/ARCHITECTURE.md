# Bluma Mimari Rehberi

Amaç: sürdürülebilir, okunabilir, yüksek DX'li bir kod tabanı.
İki ilke: **feature-based dizin yapısı** + **atomic design UI katmanı**.
Dosya boyutu hedefi ~150 satır (katı sınır 200).

## Hedef dizin yapısı

```
app/                      # SADECE rota/ekran kompozisyonu (expo-router)
  (tabs)/index.tsx        #   ekran = hook'ları çağır + bileşenleri diz (<150 satır)
features/                 # İş mantığının evi
  social/                 #   takip, engelleme, raporlama
    hooks/useFollow.ts
    components/FollowButton.tsx
  story/                  #   okuma, yazma, beğeni/kaydetme
    hooks/useStory.ts
    services/storyApi.ts  #   Firestore erişimi SADECE services katmanında
    components/ChapterNav.tsx
  library/  auth/  notifications/  conversation/  profile/
components/ui/            # Atomlar + moleküller (Button, Text, Avatar, StoryRow...)
store/                    # Redux Toolkit store (slices/ + alan-başına servis aksiyonları)
lib/                      # Firebase yardımcıları, ortak util'ler
constants/                # theme, config
types/                    # Paylaşılan tipler
```

## Katman sorumlulukları

| Katman | Yapar | Yapmaz |
|---|---|---|
| `app/` ekran | Hook çağırır, bileşen dizer, navigasyon | Firestore çağrısı, iş mantığı, 150+ satır |
| `features/*/hooks` | Ekran state'i + aksiyon orkestrasyonu (optimistic dahil) | JSX render, doğrudan Firestore |
| `features/*/services` | Firestore/HTTP erişimi, veri dönüşümü | React import etmek |
| `features/*/components` | Feature'a özgü organizmalar | Başka feature'ın servisine erişmek |
| `components/ui` | Tema uyumlu, prop-driven atom/molekül | İş mantığı, store erişimi |
| `store/` | RTK slice'ları (`slices/`) + alan-başına servis aksiyonları | 300+ satırlık dev store'lar |

## Atomic design haritası

- **Atom:** Button, Text, Avatar, Badge, Chip, IconButton, Switch (mevcut `components/ui` büyük ölçüde bu)
- **Molekül:** StoryRow, StoryCard, SectionHeader, SegmentedControl
- **Organizma:** feature'a taşınır — ör. `features/story/components/CommentThread`, `features/social/components/FollowButton`
- **Şablon/Sayfa:** `app/` rotaları

## Hook disiplini — "neyin yerine ne"

`useEffect`/`useState`/`useRef` reflekslerini bırak; önce bu tabloya bak:

| İhtiyaç | YANLIŞ refleks | DOĞRU araç |
|---|---|---|
| Türetilmiş değer (filtre, sıralama, format) | `useState` + `useEffect` ile senkron | Render'da hesapla; pahalıysa `useMemo` |
| Kullanıcı aksiyonuna tepki | Aksiyonu state'e yazıp effect'te dinleme | Doğrudan event handler |
| Sunucu/paylaşılan veri | Ekranda `useState` + `useEffect` fetch | Redux slice + feature hook'u (`useFollow` gibi) |
| Ekranlar arası ortak durum | Prop drilling (3+ seviye) | Redux store (`useAppSelector`) veya context (Theme, GuestGate) |
| Dış sisteme abonelik (Firestore, klavye) | Ekranda çıplak `useEffect` | Feature hook'u içinde tek `useEffect` (izole, cleanup'lı) |
| Render tetiklemeyen değişken | `useRef` hack'i | Tasarımı sorgula; çoğu zaman store ya da parametre |
| Modal açık/kapalı, input metni | — | `useState` burada DOĞRUDUR — yerel geçici UI durumu onun işi |

Turnusol testi: bir ekranda 3+ `useEffect` varsa mantık feature hook'una
taşınmamış demektir; 5+ `useState` varsa o state'in bir kısmı ya türetilmiş
ya da store'a aittir.

### Örnek — yanlış → doğru

```tsx
// YANLIŞ: türetilmiş değeri state'e kopyalayıp effect ile senkronlamak
const [filtered, setFiltered] = useState<Story[]>([]);
useEffect(() => { setFiltered(stories.filter(s => s.category === cat)); }, [stories, cat]);

// DOĞRU: render'da hesapla
const filtered = useMemo(() => stories.filter(s => s.category === cat), [stories, cat]);
```

## Performans ilkeleri

- **Liste = `FlatList`.** `ScrollView` + `.map()` yalnızca kısa, sabit sayılı
  bölümlerde (ör. 5 elemanlı raf) kabul edilir; akış/arama sonuçları gibi
  büyüyebilen listelerde yasak.
- Satır bileşeni ayrı dosya + `React.memo`; `keyExtractor` stabil.
- `useAppSelector` ince taneli: bütün slice yerine en dar dilimi seç ve
  selector'ı ihtiyaç duyan en küçük bileşene indir — kök ekranda geniş selector
  = her değişimde tüm ağaç render. Servis katmanında `store.getState()` /
  `store.dispatch()` kullanılır (React dışı kod hook çağıramaz).
- Pahalı hesap render içinde çıplak durmaz: `useMemo` ya da store'da hesapla.
- Görsel her zaman `expo-image`; boyut bilinen yerde `contentFit` + sabit boyut ver.

## Kalıplar (kopyala-uyarla)

### Optimistic aksiyon hook'u
`features/social/hooks/useFollow.ts` referans implementasyondur:
state'i anında çevir → servisi arka planda çağır → hatada geri al → `busy` ile çift tıklamayı engelle. Spinner gösterme.

### Firestore servis fonksiyonu
- Sayaç: `increment(±1)`, asla koleksiyon sayma.
- Tekil ilişki dokümanı: deterministik ID (`likes/{userId}`).
- Bildirim/analytics: fire-and-forget (`.catch(() => {})`), akışı bloklamaz.

## Refactor yol haritası (durum takibi)

Sıra: bir feature'ı taşı → `npx tsc --noEmit` 0 hata → commit → sıradaki.
Büyük dosyalar big-bang bölünmez; önce hook/servis çıkarılır, ekran en son inceltilir.

- [x] Pilot: `features/social/hooks/useFollow` (reader + kullanıcı profili bağlandı)
- [x] `features/social`: FollowButton bileşeni; search.tsx kullanıcı satırlarını bağla
- [x] `store/storyStore.ts` (2000+ satır) → `features/story/services/` modüllerine böl
  (storyApi, likes, saves, views, comments, offline ayrı dosyalar)
- [x] `app/(tabs)/write.tsx` (1250) → form hook'u + bölüm editörü bileşenleri
- [x] `app/story/edit/[id].tsx` (2050) → kendi hook'u + bileşenlerine bölündü
  (write.tsx henüz farklı tasarımda olduğu için bileşen paylaşımı yapılmadı)
- [x] `store/authStore.ts` (1250) → auth servisleri (signIn/signUp/social ayrı)
- [x] `app/user/[id].tsx` + `app/(tabs)/profile.tsx` → profile feature'ı
  (paylaşılan bileşenler: ProfileStatCell, ProfileGradientHero, ProfileStoryShelf,
  ProfileConversationCard)
- [ ] RNFirebase namespaced → modular API migrasyonu (deprecation uyarıları) —
  ERTELENDİ, ayrı bir oturumda ele alınacak (15-20+ dosyayı etkiler, riskli)
- [x] Ekranlardaki `Colors[colorScheme]` kalıntılarını `useTheme()`'e taşı
- [x] Hook disiplini ihlalleri (bilinen): ana sayfada `editorsPicks`
  useEffect'i her render'da çalışıyordu (`allStories` artık `useMemo`'da);
  arama ekranında filtre sonucu artık `useMemo` ile render'da hesaplanıyor
- [x] Liste performansı: ana sayfa / arama `FlatList`, kütüphane `SectionList`'e
  taşındı; sabit sayıda öğe gösteren yatay raflar (`.slice`) olduğu gibi kaldı

Bir maddeyi bitirince işaretle ve commit mesajında belirt.
