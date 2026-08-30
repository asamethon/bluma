#!/usr/bin/env bash
#
# Zamanlanmış worker komutları için sarmalayıcı.
#
# Üç iş yapar:
#   1) Ortam dosyasını yükler — cron'un ortamı boştur, RESEND_API_KEY ve
#      GOOGLE_APPLICATION_CREDENTIALS aksi halde bulunmaz.
#   2) Çıktıyı journald'a yazar:  journalctl -t bluma-cron
#   3) İş başarısız olursa yöneticiye e-posta atar. Bu olmadan bir cron
#      hatası haftalarca fark edilmezdi.
#
# Kullanım:  bluma-cron.sh <script.js> [argümanlar...]
set -uo pipefail

APP_DIR=/opt/bluma-push-worker
ENV_FILE=/etc/bluma/push-worker.env

cd "$APP_DIR" || { echo "bluma-cron: $APP_DIR bulunamadı" | logger -t bluma-cron -p user.err; exit 1; }

if [[ ! -r "$ENV_FILE" ]]; then
  echo "bluma-cron: $ENV_FILE okunamıyor" | logger -t bluma-cron -p user.err
  exit 1
fi
# shellcheck disable=SC1090
set -a; . "$ENV_FILE"; set +a

if [[ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]]; then
  echo "bluma-cron: GOOGLE_APPLICATION_CREDENTIALS tanımsız ($ENV_FILE)" | logger -t bluma-cron -p user.err
  exit 1
fi

JOB="$*"
# Çıktıyı yakalıyoruz ki çıkış kodu boruya kurban gitmesin — `node ... | logger`
# yazsaydık cron her zaman başarı görürdü.
OUTPUT=$(/usr/bin/node "$@" 2>&1)
STATUS=$?

printf '%s\n' "$OUTPUT" | logger -t bluma-cron

if [[ $STATUS -ne 0 ]]; then
  echo "bluma-cron: BAŞARISIZ (kod $STATUS): $JOB" | logger -t bluma-cron -p user.err
  printf '%s\n' "$OUTPUT" | /usr/bin/node "$APP_DIR/cron/alert.js" "$JOB" 2>&1 | logger -t bluma-cron
fi

exit $STATUS
