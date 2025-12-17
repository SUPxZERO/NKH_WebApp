#!/bin/bash
set -e

# Ensure production environment variables are set
export APP_ENV=production
export APP_DEBUG=false

echo "Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Running pre-migration fixes..."
if [ -f /var/www/database/pre-migrate.sql ]; then
    psql "${DATABASE_URL}" -f /var/www/database/pre-migrate.sql || echo "Pre-migration SQL failed, continuing..."
fi

echo "Running database migrations..."
php artisan migrate --force || echo "Migration failed, continuing..."

echo "Seeding database with initial data..."
php artisan db:seed --force || echo "Seeding failed, continuing..."

echo "Starting Laravel server..."
echo "Environment check:"
echo "APP_ENV: $APP_ENV"
echo "APP_DEBUG: $APP_DEBUG"
echo "APP_URL: $APP_URL"
echo "Asset manifest exists: $([ -f /var/www/public/build/manifest.json ] && echo 'YES' || echo 'NO')"

exec php artisan serve --host=0.0.0.0 --port=8000
