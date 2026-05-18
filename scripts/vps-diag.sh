#!/usr/bin/env bash
# Marka World — VPS teşhis (salt okunur, veri silmez)
# Kullanım: bash vps-diag.sh 2>&1 | tee ~/marka-world-diag.txt
# Çıktıyı paylaşırken şifre/API anahtarı satırlarını silin.

set -euo pipefail

REPORT="${REPORT:-marka-world-diag.txt}"
exec > >(tee "$REPORT") 2>&1

section() { echo ""; echo "========== $* =========="; }

section "SİSTEM"
date -u 2>/dev/null || date
uname -a
command -v hostname >/dev/null && hostname -f 2>/dev/null || hostname

section "KULLANICI / DİZİN"
whoami
pwd
echo "HOME=$HOME"

section "DİSK"
df -h 2>/dev/null | head -20

section "WEB SUNUCUSU"
for cmd in nginx apache2 httpd; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "--- $cmd ---"
    "$cmd" -v 2>&1 | head -3 || true
  fi
done
systemctl is-active nginx 2>/dev/null && echo "nginx: active" || true
systemctl is-active apache2 2>/dev/null && echo "apache2: active" || true
systemctl is-active httpd 2>/dev/null && echo "httpd: active" || true

section "PHP"
command -v php >/dev/null && php -v | head -2 || echo "php yok"
command -v composer >/dev/null && composer --version 2>/dev/null | head -1 || true

section "NODE"
command -v node >/dev/null && node -v || echo "node yok"
command -v npm >/dev/null && npm -v || true
command -v pm2 >/dev/null && pm2 list 2>/dev/null | head -15 || true

section "DOCKER"
command -v docker >/dev/null && docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' 2>/dev/null | head -20 || echo "docker yok"

section "MYSQL / MARIADB (sadece sürüm, şifre sormaz)"
command -v mysql >/dev/null && mysql --version || echo "mysql client yok"
command -v mariadb >/dev/null && mariadb --version || true

section "OLASI PROJE KÖKLERİ"
CANDIDATES=(
  /var/www
  /var/www/html
  /home/*/public_html
  /home/*/domains/*
  /srv/www
  /opt
  "$HOME"
  "$HOME/public_html"
  "$HOME/www"
  "$HOME/htdocs"
)
for base in /var/www /home /srv/www /opt; do
  [[ -d "$base" ]] || continue
  echo "--- $base (maxdepth 3, web dosyaları) ---"
  find "$base" -maxdepth 4 -type f \( \
    -name 'wp-config.php' -o -name 'artisan' -o -name 'composer.json' -o \
    -name 'package.json' -o -name '.env' -o -name 'index.php' -o -name 'index.html' \
  \) 2>/dev/null | head -40
done

section "NGINX SİTE TANIMLARI (varsa)"
if [[ -d /etc/nginx/sites-enabled ]]; then
  ls -la /etc/nginx/sites-enabled/ 2>/dev/null
  for f in /etc/nginx/sites-enabled/*; do
    [[ -f "$f" ]] || continue
    echo "--- $f (root / server_name) ---"
    grep -E '^\s*(root|server_name|listen|ssl_certificate)' "$f" 2>/dev/null || true
  done
fi

section "APACHE VHOST (varsa)"
if [[ -d /etc/apache2/sites-enabled ]]; then
  ls -la /etc/apache2/sites-enabled/ 2>/dev/null
elif [[ -d /etc/httpd/conf.d ]]; then
  ls -la /etc/httpd/conf.d/ 2>/dev/null
fi

section "GIT (bulunan projelerde)"
for marker in artisan composer.json package.json wp-config.php; do
  find /var/www /home -maxdepth 6 -name "$marker" -type f 2>/dev/null | while read -r f; do
    dir=$(dirname "$f")
    echo "--- $dir ---"
    if [[ -d "$dir/.git" ]]; then
      git -C "$dir" remote -v 2>/dev/null | head -2
      git -C "$dir" branch --show-current 2>/dev/null
      git -C "$dir" log -1 --oneline 2>/dev/null
    else
      echo "(git yok)"
    fi
    ls -la "$dir" 2>/dev/null | head -15
  done
done | head -80

section "CRON"
crontab -l 2>/dev/null | head -30 || echo "kullanıcı crontab yok"
[[ -f /etc/crontab ]] && grep -v '^#' /etc/crontab 2>/dev/null | head -15

section "ÇALIŞAN PORTLAR (80,443,3000,8000,3306)"
command -v ss >/dev/null && ss -tlnp 2>/dev/null | grep -E ':80|:443|:3000|:8000|:3306|:5432' || \
  netstat -tlnp 2>/dev/null | grep -E ':80|:443|:3000|:8000|:3306|:5432' || echo "ss/netstat yok"

section "SON LOG HATALARI (nginx/apache, son 5 satır)"
for log in /var/log/nginx/error.log /var/log/apache2/error.log /var/log/httpd/error_log; do
  [[ -f "$log" ]] || continue
  echo "--- $log ---"
  tail -5 "$log" 2>/dev/null
done

section "BİTTİ"
echo "Rapor dosyası: $(pwd)/$REPORT"
echo "Paylaşmadan önce .env, şifre ve API key satırlarını kontrol edin."
