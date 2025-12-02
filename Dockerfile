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
    postgresql-client \
    libpq-dev \
    supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions required by Laravel
RUN docker-php-ext-install pdo_pgsql pgsql mbstring exif pcntl bcmath gd zip

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

# Ensure www user owns /var/www
RUN chown -R $user:$user /var/www

# Install dependencies
USER $user
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader

# Create necessary directories and set permissions
USER root
RUN mkdir -p /var/www/storage/framework/{sessions,views,cache} \
    && mkdir -p /var/www/storage/logs \
    && mkdir -p /var/www/bootstrap/cache \
    && chown -R $user:$user /var/www/storage \
    && chown -R $user:$user /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage \
    && chmod -R 775 /var/www/bootstrap/cache

# Copy and setup startup script
COPY docker-start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Switch to our user
USER $user

# Expose port 8000
EXPOSE 8000

# Start Laravel with optimizations and migrations
CMD ["/usr/local/bin/start.sh"]
