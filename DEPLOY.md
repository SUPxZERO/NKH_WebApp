Deployment Instructions for NKH RestaurantPrerequisitesDocker & Docker Compose installed on your machine/VPS.Ubuntu 22.04 (recommended for VPS).1. Local Development (Build & Run)Prepare Environment:Copy .env.example to .env if you haven't already.Make sure DB_HOST=db in your .env file (matching the service name in docker-compose).Build and Run:docker-compose up -d --build
Setup Database & Keys (First time only):# Enter the app container
docker-compose exec app bash

# Run migrations
php artisan migrate

# Generate key if needed (though usually in .env already)
php artisan key:generate

# Link storage
php artisan storage:link

# Exit container
exit
Access the App:Go to http://localhost:80002. Production Deployment (VPS/Ubuntu)Step A: Prepare the ServerSSH into your Ubuntu server.Install Docker & Docker Compose:sudo apt update
sudo apt install docker.io docker-compose-plugin
Step B: Deploy CodeClone your repository to the server.Create a production .env file. Crucial: Set APP_ENV=production and APP_DEBUG=false.Step C: Build & RunRun the containers:docker compose up -d --build
Run production optimization commands (inside the container):docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache
docker compose exec app php artisan migrate --force
Step D: Permissions (If you encounter 500 errors)Ensure the storage directory is writable by the container user:docker compose exec app chown -R www-data:www-data /var/www/storage
