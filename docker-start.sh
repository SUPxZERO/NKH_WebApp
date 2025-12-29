#!/bin/bash
set -e

# Ensure production environment variables are set
export APP_ENV=production
export APP_DEBUG=false

echo "Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage symbolic link for public disk
echo "Creating storage symbolic link..."
mkdir -p /var/www/storage/app/public
php artisan storage:link || echo "Storage link may already exist"

# Ensure storage permissions are correct
chmod -R 775 /var/www/storage/app/public 2>/dev/null || true
chown -R www-data:www-data /var/www/storage/app/public 2>/dev/null || true

echo "Running pre-migration fixes..."
if [ -f /var/www/database/pre-migrate.sql ]; then
    psql "${DATABASE_URL}" -f /var/www/database/pre-migrate.sql || echo "Pre-migration SQL failed, continuing..."
fi

echo "Running database migrations..."
php artisan migrate --force 2>&1 || {
    echo "Migration attempt 1 failed, retrying..."
    sleep 5
    php artisan migrate --force 2>&1 || echo "Migration failed after retry"
}

echo "Seeding database with initial data..."
php artisan db:seed --force || echo "Seeding failed, continuing..."

echo "Starting Laravel server..."
echo "Environment check:"
echo "APP_ENV: $APP_ENV"
echo "APP_DEBUG: $APP_DEBUG"
echo "APP_URL: $APP_URL"
echo "Asset manifest exists: $([ -f /var/www/public/build/manifest.json ] && echo 'YES' || echo 'NO')"

exec php artisan serve --host=0.0.0.0 --port=8000
