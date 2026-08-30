# Bluma Push Worker — VPS Kurulumu

Uygulama içi bildirimler (`notifications` koleksiyonu) ve DM'ler
(`messageThreads/*/messages`) oluşturulduğunda Expo push gönderen arka plan
servisi. Cloud Functions'a (Blaze planı gerektirir) alternatif — bkz.
docs/YAPILACAKLAR.md 3.1.

Önceden bu işi istemci (herhangi bir oturumlu kullanıcı) yapıyordu; bu da
`userPushTokens` koleksiyonunun herkese açık okunmasını gerektiriyordu
(spam/phishing riski, bkz. YAPILACAKLAR 0.3). Bu servis Firebase Admin SDK
kullanır — güvenlik kurallarına tabi değildir, token'ı yalnızca burada okur.

## 1. Firebase servis hesabı anahtarı al

1. [Firebase Console](https://console.firebase.google.com) → Project Settings
   (dişli ikonu) → **Service Accounts** → **Generate new private key**.
2. İnen `.json` dosyasını **asla repoya commitleme**. VPS'e ayrı yükleyeceğiz.

## 2. Sunucuya kur

> **Tek dizin:** kurulum dizini ve servis adı artık aynı —
> `/opt/bluma-push-worker` + `bluma-push-worker.service`. (Eskiden servis
> `/opt/push-worker`'dan koşuyordu ve yanlış kopyaya deploy edilme riski
> vardı; 2026-08 itibarıyla birleştirildi.) Şüphelenirsen canlıyı
> `systemctl show bluma-push-worker -p WorkingDirectory` ile doğrula.


```bash
sudo mkdir -p /opt/bluma-push-worker
# server/push-worker/ klasörünü sunucuya kopyala (node_modules HARİÇ):
#   rsync -av --exclude node_modules --exclude package-lock.json server/push-worker/ root@SUNUCU:/opt/bluma-push-worker/
cd /opt/bluma-push-worker && npm install --omit=dev

# Servis hesabı anahtarını güvenli bir konuma koy (repo dışı, dar izinli):
sudo mkdir -p /etc/bluma
sudo cp /path/to/serviceAccountKey.json /etc/bluma/firebase-service-account.json
sudo chmod 600 /etc/bluma/firebase-service-account.json
```

## 3. systemd servisi (görsel servisiyle aynı desende)

```bash
useradd --system --home /opt/bluma-push-worker --shell /usr/sbin/nologin bluma-push
chown -R bluma-push:bluma-push /opt/bluma-push-worker
chown bluma-push:bluma-push /etc/bluma/firebase-service-account.json
```

`/etc/systemd/system/bluma-push-worker.service`:

```ini
[Unit]
Description=Bluma push notification worker
After=network.target

[Service]
User=bluma-push
Group=bluma-push
WorkingDirectory=/opt/bluma-push-worker
ExecStart=/usr/bin/node index.js
Restart=always
Environment=GOOGLE_APPLICATION_CREDENTIALS=/etc/bluma/firebase-service-account.json
Environment=PORT=8789
Environment=HOST=127.0.0.1
# Sandbox
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bluma-push-worker
sudo systemctl status bluma-push-worker
curl http://127.0.0.1:8789/health   # { "ok": true }
```

## 4. Güncelleme

> **`--delete` kullanacaksan dikkat:** repo yarn kullandığı için
> `package-lock.json` `.gitignore`'da ve rsync onu sunucudan siler. Aşağıdaki
> komutta bu yüzden `--exclude package-lock.json` var. Yanlışlıkla silinirse
> `npm install --package-lock-only` ile geri üretilir.

```bash
rsync -av --exclude node_modules --exclude package-lock.json server/push-worker/ root@SUNUCU:/opt/bluma-push-worker/
ssh root@SUNUCU "cd /opt/bluma-push-worker && npm install --omit=dev && systemctl restart bluma-push-worker"
```

## Notlar

- Servis her başladığında yalnızca **o andan sonraki** yeni `notifications`/
  `messages` dokümanlarını işler — geçmişe push atmaz (bkz. index.js'teki
  "skip initial snapshot" deseni).
- `messages` collectionGroup sorgusu için gereken index
  `firestore.indexes.json`'da tanımlı; `firebase deploy --only
  firestore:indexes` ile deploy edilmiş olmalı (zaten yapıldı).
- Loglar: `journalctl -u bluma-push-worker -f`.

## Hesap silme (`POST /delete-account`)

Aynı servis, `Authorization: Bearer <Firebase ID token>` ile çağrılan bir
`/delete-account` endpoint'i de sunar (bkz. deleteAccount.js). İstemci
(`features/auth/services/userProfile.ts`) bu endpoint'i `constants/config.ts`
→ `API_SERVER_URL` doluysa kullanır; boşsa eski istemci-taraflı silme akışına
düşer (hiçbir şey kırılmaz).

**Bu endpoint'i canlıya almak için:**
1. `constants/config.ts`'te `API_SERVER_URL`'i gerçek adresine ayarla (nginx
   reverse proxy ile bu servisi dışa aç — görsel servisiyle aynı desen, ör.
   `https://api.d4tecompany.com`).
2. nginx'te `/delete-account` ve `/health`'i `127.0.0.1:8789`'a yönlendir.
3. Uygulamayı bu yeni `API_SERVER_URL` ile yeniden build/deploy et.

## Sayaç düzeltme cron'u (`reconcile-counters.js`)

Beğeni/yorum/görüntülenme sayaçlarındaki zaman içinde oluşabilecek sapmayı
(ağ kopması, yarım kalan işlem vb.) gerçek alt koleksiyon sayılarından
yeniden hesaplayıp düzeltir. Haftada bir crontab ile çalıştır:

```bash
# Önce kontrol et (hiçbir şey yazmaz):
GOOGLE_APPLICATION_CREDENTIALS=/etc/bluma/firebase-service-account.json \
  node /opt/bluma-push-worker/reconcile-counters.js --dry-run

# crontab -e (bluma-push kullanıcısı için):
0 4 * * 0 GOOGLE_APPLICATION_CREDENTIALS=/etc/bluma/firebase-service-account.json \
  node /opt/bluma-push-worker/reconcile-counters.js >> /var/log/bluma-reconcile.log 2>&1
```

## Cihaz banı (moderasyon)

Hesabı silinen tacizci yeni bir Apple/Google hesabıyla geri dönebiliyordu. Ban
artık hesaba değil **cihaza** yazılır (`bannedDevices/{deviceId}`), yani hesap
silinse de durur.

Cihaz kimliği istemcide üretilir (`features/moderation/services/deviceId.ts`):
iOS'ta Keychain kaydı uygulama silinse bile kalır, Android'de ANDROID_ID imza
anahtarı başına sabittir — ikisi de "sil-kur" ile sıfırlanmaz.

```bash
cd /opt/bluma-push-worker
export GOOGLE_APPLICATION_CREDENTIALS=/etc/bluma/firebase-service-account.json

node ban-device.js --devices                       # hesap → cihaz eşlemesi
node ban-device.js --uid <uid> --reason "hakaret"  # o hesabın cihazını banla
node ban-device.js --list                          # aktif banlar
node ban-device.js --unban --device <deviceId>     # banı kaldır
```

Ban iki katmanda uygulanır: cihaza bağlı Firebase Auth hesapları **devre dışı**
bırakılır (token anında geçersiz) ve güvenlik kuralları o cihazdan gelen yeni
içeriği/yeni hesap kaydını reddeder.

Uygulama içinden (admin custom claim'i olan hesapla) aynı işlem:

```
POST /admin/ban-device    { "uid": "...", "reason": "..." }
POST /admin/unban-device  { "deviceId": "..." }
Authorization: Bearer <idToken>
```

**Önemli:** ban, kullanıcının cihaz kaydına (`userDevices/{uid}`) dayanır. Hesap
silinince bu kayıt da gider — yani tacizciyi **hesabını silmeden önce** banla,
sonra sil.

## E-posta gönderimi (doğrulama, adres değişikliği, şifre sıfırlama)

Firebase'in şablon düzenlemesi bu projede kilitli ve gönderen adresi
paylaşımlı `firebaseapp.com` — Gmail spam'e atıyordu. Bu yüzden postayı
kendimiz gönderiyoruz: Admin SDK yalnızca bağlantıyı üretir, tasarım ve
gönderim bizde (bkz. `docs/email-templates/README.md`).

Uç noktalar:

```
POST /send-auth-email    { kind: verify | change | reset, newEmail? }
                         Bearer idToken şart; posta YALNIZCA çağıranın
                         kendi hesabına gider.
GET  /auth/action        Kendi işlem sayfamız (templates/action.html).
```

`/etc/bluma/push-worker.env` içeriği (systemd drop-in ile bağlanır:
`/etc/systemd/system/bluma-push-worker.service.d/mail.conf` →
`EnvironmentFile=/etc/bluma/push-worker.env`):

```
RESEND_API_KEY=re_...
MAIL_FROM="Bluma <bluma@d4tecompany.com>"
MAIL_REPLY_TO=destek@d4tecompany.com
ACTION_PAGE_URL=https://bluma-api.d4tecompany.com/auth/action
```

Dosya `bluma-push` kullanıcısına ait ve `600` olmalı. systemd ortam dosyasını
YALNIZCA servis başlarken okur — değiştirdiğinde `systemctl restart` şart.

`RESEND_API_KEY` tanımsızsa uç nokta `503` döner ve istemci Firebase'in kendi
gönderimine düşer; yani anahtarsız da güvenle deploy edilebilir.

Sağlık kontrolü (token'sız çağrı):

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST 127.0.0.1:8789/send-auth-email
# 401 → mailer yüklü ve çalışıyor    503 → anahtar okunamıyor
```

## Zamanlanmış işler (cron)

`cron/bluma-cron.sh` sarmalayıcısı ortam dosyasını yükler; cron'un boş
ortamında `RESEND_API_KEY` ve `GOOGLE_APPLICATION_CREDENTIALS` aksi halde
bulunmaz. Çıktı journald'a düşer.

```bash
# Servis hesabı yolunu ortam dosyasına ekle (sarmalayıcı oradan okur):
echo 'GOOGLE_APPLICATION_CREDENTIALS=/etc/bluma/<servis-hesabi>.json' >> /etc/bluma/push-worker.env

crontab -e   # cron/crontab.example içeriğini yapıştır
journalctl -t bluma-cron --since today
```

Kurulan işler: günlük son hatırlatma (`--grace-day 6`) ve haftalık sayaç
mutabakatı. **Askıya alma satırı bilinçli olarak kapalı** — açma koşulları
`crontab.example` içinde yazılı.

## Yönetim komutları

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/etc/bluma/firebase-service-account.json

node reconcile-counters.js --dry-run        # sayaç mutabakatı (haftalık)
node notify-unverified.js --dry-run         # doğrulama hatırlatması
node announce.js --tag v2.1 --title "..." --message "..." --dry-run
node deactivate-unverified.js --dry-run     # süresi dolanları askıya al
node ban-device.js --devices                # cihaz banı
```

Hepsi `--dry-run` destekler; önce onunla çalıştır.
