# --- Stage 1: Build Frontend Assets (React/Inertia) ---
FROM node:18-alpine as frontend_build

WORKDIR /app

# Copy package files first to leverage cache
COPY package*.json vite.config.js ./
RUN npm install

# Copy resources and build
COPY resources ./resources
COPY public ./public
# If you have other config files used by vite, copy them here
COPY tsconfig.json .
COPY vite.config.js .
RUN npm run build

# --- Stage 2: Build Backend (Laravel 11 / PHP 8.2) ---
FROM php:8.2-fpm

# Arguments defined in docker-compose.yml
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
    default-mysql-client

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions required by Laravel
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create system user to run Composer and Artisan Commands
RUN useradd -G www-data,root -u $uid -d /home/$user $user
RUN mkdir -p /home/$user/.composer && \
    chown -R $user:$user /home/$user

# Set working directory
WORKDIR /var/www

# Copy only composer files first (for caching)
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy the rest of the application
COPY . .

# Copy built frontend assets from Stage 1
COPY --from=frontend_build /app/public/build ./public/build

# Generate autoloader
RUN composer dump-autoload --optimize

# Set permissions
RUN chown -R 777 /var/www/storage /var/www/bootstrap/cache

# Switch to our user
USER $user

# --- CHANGED SECTION ---

# Expose port 8000 (standard Laravel port) instead of 9000
EXPOSE 8000

