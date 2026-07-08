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

```bash
sudo mkdir -p /opt/bluma-push-worker
# server/push-worker/ klasörünü sunucuya kopyala (node_modules HARİÇ):
#   rsync -av --exclude node_modules server/push-worker/ root@SUNUCU:/opt/bluma-push-worker/
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

```bash
rsync -av --exclude node_modules server/push-worker/ root@SUNUCU:/opt/bluma-push-worker/
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
