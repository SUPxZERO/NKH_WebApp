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

echo "Starting Laravel server..."
exec php artisan serve --host=0.0.0.0 --port=8000
