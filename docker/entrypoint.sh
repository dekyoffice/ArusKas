#!/bin/sh
set -e

# Pastikan permission storage & database aman
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

# Jalankan storage link jika belum ada
php artisan storage:link || true

# Jalankan migrasi jika database baru
php artisan migrate --force || true

# Jalankan supervisor (PHP-FPM + Nginx)
exec /usr/bin/supervisord -c /etc/supervisord.conf
