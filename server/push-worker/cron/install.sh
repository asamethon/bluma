#!/usr/bin/env bash
#
# Crontab'ı GÜVENLE kurar/günceller.
#
# `crontab -` kullanmıyoruz: mevcut crontab'ı komple değiştirir ve başka
# işleri sessizce siler. Bunun yerine işaretlenmiş bir blok yönetiyoruz —
# blok dışındaki her şeye dokunulmaz ve script tekrar tekrar çalıştırılabilir.
#
# Kullanım:  cron/install.sh          kur/güncelle
#            cron/install.sh --remove yönetilen bloğu kaldır
set -euo pipefail

BEGIN='# >>> bluma-cron (yönetilen blok) >>>'
END='# <<< bluma-cron <<<'
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP="/etc/bluma/crontab.$(date +%Y%m%d-%H%M%S).bak"

current=$(crontab -l 2>/dev/null || true)

# Ne olursa olsun önce yedek al.
mkdir -p /etc/bluma
printf '%s\n' "$current" > "$BACKUP"
echo "Mevcut crontab yedeklendi: $BACKUP"

# Varsa eski yönetilen bloğu çıkar; blok dışındaki satırlar korunur.
without_block=$(printf '%s\n' "$current" | sed "\|^${BEGIN}\$|,\|^${END}\$|d")

if [[ "${1:-}" == "--remove" ]]; then
  printf '%s\n' "$without_block" | crontab -
  echo "Yönetilen blok kaldırıldı."
  exit 0
fi

block=$(sed -e "1i${BEGIN}" -e "\$a${END}" "$DIR/crontab.example")

printf '%s\n%s\n' "$without_block" "$block" | sed '/^$/N;/^\n$/D' | crontab -
echo "Kuruldu. Aktif bluma işleri:"
crontab -l | grep -c 'bluma-cron.sh' || true
