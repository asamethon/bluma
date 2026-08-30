#!/usr/bin/env bash
#
# Zamanlanmış worker komutları için sarmalayıcı.
#
# Cron'un ortamı boştur: ne RESEND_API_KEY ne GOOGLE_APPLICATION_CREDENTIALS
# bulunur. Her crontab satırında bunları tekrarlamak yerine burada bir kez
# yükleniyor. Çıktı journald'a düşüyor:  journalctl -t bluma-cron
#
# Kullanım:  bluma-cron.sh <script.js> [argümanlar...]
set -euo pipefail

APP_DIR=/opt/bluma-push-worker
ENV_FILE=/etc/bluma/push-worker.env

cd "$APP_DIR"

# shellcheck disable=SC1090
set -a; . "$ENV_FILE"; set +a

if [[ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]]; then
  echo "GOOGLE_APPLICATION_CREDENTIALS tanımsız — $ENV_FILE içine ekle." >&2
  exit 1
fi

exec /usr/bin/node "$@"
