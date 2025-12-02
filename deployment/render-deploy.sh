#!/bin/bash

# Render.com Deployment Script for NKH Restaurant App
# This script runs post-deployment tasks

set -e

echo "🚀 Starting Render deployment tasks..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

until php artisan db:show || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  echo "Database not ready, waiting... (Attempt $((RETRY_COUNT+1))/$MAX_RETRIES)"
  RETRY_COUNT=$((RETRY_COUNT+1))
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Database connection timeout"
  exit 1
fi

echo "✅ Database connection established"

# Run migrations
echo "📊 Running database migrations..."
php artisan migrate --force --no-interaction

# Clear and cache config
echo "🔧 Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link if it doesn't exist
echo "🔗 Creating storage link..."
php artisan storage:link || true

# Set correct permissions
echo "🔒 Setting permissions..."
chmod -R 775 storage bootstrap/cache

echo "✅ Deployment tasks completed successfully!"
