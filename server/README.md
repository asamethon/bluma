# Bluma Görsel Servisi — VPS Kurulumu

Uygulamanın profil fotoğrafı / kapak / yorum görsellerini barındıran küçük servis.
Firebase ID token doğrular (service account gerekmez), görseli webp'e çevirip
diske yazar, 1 yıl cache ile sunar.

> **Canlı kurulum (Tem 2026):** Hostinger VPS (srv1344443, 76.13.254.132),
> `https://img.d4tecompany.com` — nginx reverse proxy + certbot (Let's Encrypt).
> Aynı nginx `arabatahmin.com` sitelerini de barındırıyor; Caddy KULLANILMIYOR.

## 1. Sunucuya kur (Ubuntu/Debian)

```bash
# Node 20+ yoksa:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs

sudo mkdir -p /opt/bluma-image-server /var/lib/bluma-images
# server/ klasörünü sunucuya kopyala (node_modules HARİÇ — platform bağımlı):
#   rsync -av --exclude node_modules --exclude data server/ root@SUNUCU:/opt/bluma-image-server/
cd /opt/bluma-image-server && npm install --omit=dev
```

## 2. systemd servisi (ayrı kullanıcıyla, sıkılaştırılmış)

```bash
# Servis için yetkisiz sistem kullanıcısı
useradd --system --home /opt/bluma-image-server --shell /usr/sbin/nologin bluma
chown -R bluma:bluma /var/lib/bluma-images
```

`/etc/systemd/system/bluma-image-server.service`:

```ini
[Unit]
Description=Bluma image server
After=network.target

[Service]
User=bluma
Group=bluma
WorkingDirectory=/opt/bluma-image-server
ExecStart=/usr/bin/node index.js
Restart=always
Environment=PORT=8788
Environment=HOST=127.0.0.1
Environment=FIREBASE_PROJECT_ID=bluma-dc10e
Environment=DATA_DIR=/var/lib/bluma-images
Environment=PUBLIC_BASE_URL=https://img.d4tecompany.com
# Sandbox
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/bluma-images

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now bluma-image-server
curl -s localhost:8788/health   # {"ok":true}
```

## 3. nginx reverse proxy + HTTPS (certbot)

`/etc/nginx/sites-available/bluma-img`:

```nginx
server {
    listen 80;
    server_name img.d4tecompany.com;

    # nginx varsayılanı 1MB — yüklemeler için yetmez
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:8788;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/bluma-img /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
apt install -y certbot python3-certbot-nginx
certbot --nginx -d img.d4tecompany.com --redirect   # sertifika + otomatik yenileme
```

## 4. Uygulamayı bağla

[constants/config.ts](../constants/config.ts):

```ts
export const IMAGE_SERVER_URL = 'https://img.d4tecompany.com';
```

Boş bırakılırsa uygulama eski davranışa (sıkıştırılmış base64) düşer —
sunucu erişilemezse de aynı fallback otomatik devreye girer.

## Güncelleme

```bash
# Mac'ten:
rsync -av --exclude node_modules --exclude data server/ root@76.13.254.132:/opt/bluma-image-server/
# Sunucuda:
cd /opt/bluma-image-server && npm install --omit=dev && systemctl restart bluma-image-server
```

## Yedekleme

Görseller `/var/lib/bluma-images` altında düz dosya:

```bash
# örnek: günlük tar yedeği (crontab -e)
0 4 * * * tar czf /root/backups/bluma-images-$(date +\%F).tar.gz /var/lib/bluma-images
```
