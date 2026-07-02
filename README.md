# Welcome to Bluma 👋

Bu, [`create-expo-app`](https://www.npmjs.com/package/create-expo-app) ile oluşturulmuş bir [Expo](https://expo.dev) projesidir.

## Özellikler

- 🔐 **Google Sign-In**: Google hesabı ile giriş yapma
- 🍎 **Apple Sign-In**: Apple hesabı ile giriş yapma (iOS)
- 📧 **Email/Password**: E-posta ve şifre ile giriş yapma
- 👤 **Kullanıcı Profili**: Kişiselleştirilmiş profil sayfası
- 🚀 **Onboarding**: İlk kullanım deneyimi
- 📱 **Responsive Design**: Tüm cihazlarda uyumlu tasarım

## Başlangıç

1. Bağımlılıkları yükleyin

   ```bash
   yarn install
   ```

2. Uygulamayı başlatın

   ```bash
   yarn start
   ```

Çıktıda uygulamayı açma seçeneklerini bulacaksınız:

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), Expo ile uygulama geliştirmeyi denemek için sınırlı bir sandbox

**app** dizini içindeki dosyaları düzenleyerek geliştirmeye başlayabilirsiniz. Bu proje [file-based routing](https://docs.expo.dev/router/introduction) kullanır.

## Kimlik Doğrulama Akışı

1. **Giriş Yapmamış Kullanıcı**: Uygulama walkthrough ekranıyla başlar
2. **Giriş Yapma**: Google, Apple veya e-posta ile giriş yapabilir
3. **Onboarding**: İlk kez giriş yapan kullanıcılar profil bilgilerini tamamlar
4. **Ana Uygulama**: Tamamlanmış kullanıcılar ana uygulamaya erişir

## Google Sign-In Kurulumu

Google Sign-In için gerekli dosyalar zaten yapılandırılmıştır:

- `GoogleService-Info.plist` (iOS)
- `google-services.json` (Android)
- `app.json` konfigürasyonu

## Yeni Proje Oluştur

Hazır olduğunda şu komutu çalıştırın:

```bash
yarn reset-project
```

Bu komut başlangıç kodunu **app-example** dizinine taşıyacak ve geliştirmeye başlayabileceğiniz boş bir **app** dizini oluşturacak.

## Daha Fazla Bilgi

Expo ile projenizi geliştirme hakkında daha fazla bilgi için şu kaynaklara bakın:

- [Expo documentation](https://docs.expo.dev/): Temelleri öğrenin veya [rehberlerimizle](https://docs.expo.dev/guides) ileri konulara geçin.
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Android, iOS ve web'de çalışan bir proje oluşturacağınız adım adım öğreticiyi takip edin.

## Topluluğa Katılın

Evrensel uygulamalar oluşturan geliştiriciler topluluğumuza katılın.

- [Expo on GitHub](https://github.com/expo/expo): Açık kaynak platformumuzu görüntüleyin ve katkıda bulunun.
- [Discord community](https://chat.expo.dev): Expo kullanıcılarıyla sohbet edin ve sorular sorun.
