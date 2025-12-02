#!/bin/bash
set -e

echo "Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Running database migrations..."
php artisan migrate --force || echo "Migration failed, continuing..."

echo "Starting Laravel server..."
exec php artisan serve --host=0.0.0.0 --port=8000
