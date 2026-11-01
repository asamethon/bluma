# Bluma Medya Servisi — VPS Kurulumu

Uygulamanın profil fotoğrafı / kapak / yorum görsellerini, hikâye içi GIF ve
videolarını, DM ses kayıtlarını barındıran küçük servis. Firebase ID token
doğrular (service account gerekmez), görseli webp'e çevirip diske yazar,
1 yıl cache ile sunar.

Dosya düzeni: `index.js` (rotalar) + `auth.js` (token) + `files.js` (diske
yazma) + `nsfw.js` (moderasyon) + `ffmpeg.js` (zaman sınırlı, TEK SIRALI ffmpeg)
+ `video.js` / `gif.js` / `voice.js` (tür başına boru hattı).

**Hikâye videosu (`POST /upload-video`, alan adı `file`):** sırayla doğrula →
moderasyondan geçir → yeniden kodla → poster üret. Döner:
`{ "video": ".../i/video/<id>.mp4", "poster": ".../i/video/<id>.webp" }`.
Poster ile video AYNI adı paylaşır; istemci metne yalnızca posteri gömer
(bkz. `features/story/utils/mediaToken.ts`), böylece mağazadaki eski sürümler
token metni değil duran kareyi gösterir. En fazla 20 sn / 50 MB giriş; çıktı
uzun kenarı 1280'e sığdırılmış H.264 + AAC (küçük kaynak BÜYÜTÜLMEZ),
`-maxrate 2M` ile tavanlı ≈ 3-5 MB. `-map_metadata -1` konum/cihaz üstverisini
siler.

**Hikâye GIF'i (`POST /upload-gif`, alan adı `file`):** kare örnekle →
moderasyondan geçir → **animasyonlu webp** üret (en fazla 12 MB / 400 kare,
genişlik 480). Çıktının webp olması bilinçli: token `[[img:…webp]]` olarak
kaldığı için eski istemciler de animasyonu `expo-image` ile oynatır.

**Sesli mesajlar (`POST /upload-voice`):** DM'lerdeki ses kayıtları da buraya
gider (multipart alan adı `file`, m4a/AAC, en fazla 6 MB). Görsel hattından
geçmez: sharp ve NSFW kontrolü uygulanmaz, dosya `data/voice/` altına olduğu
gibi yazılır ve `/i/voice/<id>.m4a` adresinden sunulur. Tür kontrolü uzantıya
değil MPEG-4 kutu imzasına (`ftyp`) bakar.

**NSFW moderasyonu ([nsfw.js](nsfw.js)):** Her yükleme, diske yazılmadan önce
`nsfwjs` (TensorFlow.js) ile YEREL olarak sınıflandırılır — dış API yok, ücretsiz.
Explicit (Porn/Hentai/Sexy eşik üstü) görsel `HTTP 451` ile reddedilir; client bunu
base64 fallback'e düşmeden kullanıcıya hata olarak gösterir. **Video ve GIF aynı
kapıdan geçer:** videodan ffmpeg ile süre boyunca eşit aralıklı 5 kare çıkarılır,
GIF'ten sharp ile 4 kare örneklenir; kareden biri bile explicit ise dosya
reddedilir ve DİSKE YAZILMAZ. Sıra bilinçli — pahalı transcode, kareler
moderasyondan geçmeden çalışmaz. Model açılışta bir kez
belleğe yüklenir (~25MB). Eşikler env ile ayarlanır (aşağıya bak). Model yüklenemezse
varsayılan davranış fail-open'dır (yükleme geçer, reaktif moderasyon devreye girer);
`NSFW_FAIL_CLOSED=true` ile katı moda alınabilir.

> **Canlı kurulum (Tem 2026):** Hostinger VPS (srv1344443, 76.13.254.132),
> `https://blumaimg.d4tecompany.com` — nginx reverse proxy + certbot (Let's Encrypt).
> Aynı nginx `arabatahmin.com` sitelerini de barındırıyor; Caddy KULLANILMIYOR.

## 1. Sunucuya kur (Ubuntu/Debian)

```bash
# Node 20+ yoksa:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs

# Video/GIF için ffmpeg ZORUNLU (yoksa /upload-video HTTP 503 döner):
sudo apt-get install -y ffmpeg && ffmpeg -version | head -1

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
Environment=PUBLIC_BASE_URL=https://blumaimg.d4tecompany.com
# NSFW moderasyon eşikleri (opsiyonel — varsayılanlar nsfw.js'te)
# Environment=NSFW_PORN_THRESHOLD=0.6
# Environment=NSFW_HENTAI_THRESHOLD=0.6
# Environment=NSFW_SEXY_THRESHOLD=0.9
# Environment=NSFW_FAIL_CLOSED=false
# Video/GIF sınırları (opsiyonel — varsayılanlar video.js / gif.js'te)
# Environment=VIDEO_MAX_SECONDS=20
# Environment=VIDEO_MAX_BYTES=52428800
# Environment=GIF_MAX_BYTES=12582912
# Environment=FFMPEG_TIMEOUT_MS=90000
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
    server_name blumaimg.d4tecompany.com;

    # nginx varsayılanı 1MB — yüklemeler için yetmez. Video girişi 50 MB
    # olabildiği için 20m YETMEZ: yükseltilmeden video yüklemesi 413 alır.
    client_max_body_size 50m;

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
certbot --nginx -d blumaimg.d4tecompany.com --redirect   # sertifika + otomatik yenileme
```

## 4. Uygulamayı bağla

[constants/config.ts](../constants/config.ts):

```ts
export const IMAGE_SERVER_URL = 'https://blumaimg.d4tecompany.com';
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

> **NSFW bağımlılığı (ilk kurulumda dikkat):** `@tensorflow/tfjs-node` yerel (native)
> bir pakettir; `npm install` prebuilt binary indirir, ilk kurulum birkaç dakika
> sürebilir. Kurulumdan sonra başlangıç logunda **`nsfw: model yüklendi`** satırını
> gör: `journalctl -u bluma-image-server -n 20`. Bu satır yerine "model YÜKLENEMEDİ"
> görüyorsan model indirilememiştir (fail-open: yüklemeler çalışır ama filtre pasiftir).
> Testi: bariz explicit bir görsel yüklemeyi dene → `HTTP 451` + logda "upload rejected (explicit)".

## Disk ve trafik (Hostinger KVM2: 8 GB RAM, 100 GB disk, 8 TB/ay)

20 sn / 720p video ≈ **3,7 MB** saklanır:

| | 40 GB ayrılırsa | 100 GB tamamı |
|---|---|---|
| Video sayısı | ~10.800 | ~27.000 |

Trafik: 8 TB ÷ 3,7 MB ≈ **2,1 milyon izlenme/ay**. Okuyucu videoyu otomatik
oynatmaz (poster + dokun-oynat), yani trafik sayfa görüntüleme başına değil
İZLENME başına harcanır. CPU 2 çekirdek olduğu için `ffmpeg.js` transcode'ları
tek sıraya alır — paralel kodlama nsfwjs'i ve görsel servisini aç bırakırdı.

## Yedekleme

Görseller `/var/lib/bluma-images` altında düz dosya:

```bash
# örnek: günlük tar yedeği (crontab -e)
0 4 * * * tar czf /root/backups/bluma-images-$(date +\%F).tar.gz /var/lib/bluma-images
```
