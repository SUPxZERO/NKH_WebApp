# --- Stage 1: Build Frontend Assets (React/Inertia) ---
FROM node:20-alpine as frontend_build

WORKDIR /app

# Copy package files first to leverage cache
COPY package*.json vite.config.js ./
RUN npm install

# Copy resources and build
COPY resources ./resources
COPY public ./public
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
RUN npm run build

# --- Stage 2: Build Backend (Laravel 11 / PHP 8.4) ---
FROM php:8.4-fpm

# Arguments
ARG user=www
ARG uid=1000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    default-mysql-client \
    supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions required by Laravel
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Redis extension (useful for caching/queues in production)
RUN pecl install redis && docker-php-ext-enable redis

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create system user
RUN useradd -G www-data,root -u $uid -d /home/$user $user \
    && mkdir -p /home/$user/.composer \
    && chown -R $user:$user /home/$user

# Set working directory
WORKDIR /var/www

# Copy entire application first (needed for Laravel's post-install scripts)
COPY --chown=$user:$user . .

# Copy built frontend assets from Stage 1
COPY --from=frontend_build --chown=$user:$user /app/public/build ./public/build

# Install dependencies and run optimizations
USER $user
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
    && php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

# Create necessary directories and set permissions
USER root
RUN mkdir -p /var/www/storage/framework/{sessions,views,cache} \
    && mkdir -p /var/www/storage/logs \
    && mkdir -p /var/www/bootstrap/cache \
    && chown -R $user:$user /var/www/storage \
    && chown -R $user:$user /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage \
    && chmod -R 775 /var/www/bootstrap/cache



# Switch to our user
USER $user

# Expose port 8000
EXPOSE 8000



# Start Laravel's built-in server
CMD php artisan serve --host=0.0.0.0 --port=8000
