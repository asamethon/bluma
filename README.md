# Bluma

Bluma; Expo SDK 56, React Native ve Firebase ile geliştirilen Türkçe hikâye
okuma/yazma uygulamasıdır.

## Geliştirme

```bash
yarn install
yarn start
```

Native modül değişikliklerinden sonra geliştirme istemcisini yeniden üretin:

```bash
yarn ios
# veya
yarn android
```

## Kalite kapısı

Her değişiklikten önce teslimat kontrolünü çalıştırın:

```bash
yarn check
```

Bu komut sırasıyla strict TypeScript kontrolünü, sıfır uyarılı ESLint denetimini
ve erişilemeyen dosya/export/bağımlılık analizini çalıştırır.

## Mimari

- Rotalar yalnızca `app/` altında kompozisyon yapar.
- İş mantığı `features/<alan>/hooks`, veri erişimi `features/<alan>/services`
  altında yaşar.
- Paylaşılan atom ve moleküller `components/ui/` altındadır.
- Dosya başına hedef yaklaşık 150, üst sınır 200 satırdır.

Ayrıntılı kurallar için [mimari rehberini](docs/ARCHITECTURE.md) okuyun.

## Operasyon

- Firestore kuralı değiştiğinde: `firebase deploy --only firestore:rules`
- Görsel sunucusu değiştiğinde: [sunucu kurulum rehberi](server/README.md)
- Bölüm alt koleksiyon migrasyonu: `yarn migrate:chapters:dry-run`
