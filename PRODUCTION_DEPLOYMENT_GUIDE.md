# NKH Restaurant Management System - Production Deployment Guide

## 🚀 **Production Deployment Checklist**

### **1. Server Requirements**

**Minimum Server Specifications:**
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+

**Software Requirements:**
- PHP 8.2+
- Node.js 18+
- MySQL 8.0+ or PostgreSQL 13+
- Redis 6.0+
- Nginx or Apache
- SSL Certificate

### **2. Pre-Deployment Setup**

#### **2.1 Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y php8.2-fpm php8.2-mysql php8.2-redis php8.2-xml php8.2-gd php8.2-curl php8.2-mbstring php8.2-zip php8.2-bcmath

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install MySQL
sudo apt install -y mysql-server

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx
```

#### **2.2 Database Setup**
```sql
-- Create database and user
CREATE DATABASE nkh_restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nkh_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON nkh_restaurant.* TO 'nkh_user'@'localhost';
FLUSH PRIVILEGES;
```

### **3. Application Deployment**

#### **3.1 Clone and Setup**
```bash
# Clone repository
git clone https://github.com/your-repo/nkh-restaurant.git /var/www/nkh-restaurant
cd /var/www/nkh-restaurant

# Set permissions
sudo chown -R www-data:www-data /var/www/nkh-restaurant
sudo chmod -R 755 /var/www/nkh-restaurant
sudo chmod -R 775 /var/www/nkh-restaurant/storage
sudo chmod -R 775 /var/www/nkh-restaurant/bootstrap/cache
```

#### **3.2 Environment Configuration**
```bash
# Copy production environment file
cp deployment/production.env.example .env

# Generate application key
php artisan key:generate

# Configure your .env file with production values
nano .env
```

#### **3.3 Install Dependencies**
```bash
# Install PHP dependencies
composer install --optimize-autoloader --no-dev

# Install Node.js dependencies
npm ci

# Build frontend assets
npm run build
```

#### **3.4 Database Migration**
```bash
# Run migrations
php artisan migrate --force

# Seed initial data
php artisan db:seed --force

# Create storage link
php artisan storage:link
```

### **4. Web Server Configuration**

#### **4.1 Nginx Configuration**
Create `/etc/nginx/sites-available/nkh-restaurant`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    root /var/www/nkh-restaurant/public;
    index index.php index.html;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location /api/login {
        limit_req zone=login burst=3 nodelay;
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }
    
    location ~ /\.(?!well-known).* {
        deny all;
    }
    
    # Asset optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### **4.2 Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/nkh-restaurant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **5. Security Hardening**

#### **5.1 PHP-FPM Security**
Edit `/etc/php/8.2/fpm/php.ini`:
```ini
expose_php = Off
max_execution_time = 30
max_input_time = 60
memory_limit = 256M
post_max_size = 10M
upload_max_filesize = 10M
session.cookie_httponly = 1
session.cookie_secure = 1
session.use_strict_mode = 1
```

#### **5.2 Firewall Configuration**
```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3306/tcp
sudo ufw deny 6379/tcp
```

#### **5.3 File Permissions**
```bash
# Set secure permissions
sudo find /var/www/nkh-restaurant -type f -exec chmod 644 {} \;
sudo find /var/www/nkh-restaurant -type d -exec chmod 755 {} \;
sudo chmod -R 775 /var/www/nkh-restaurant/storage
sudo chmod -R 775 /var/www/nkh-restaurant/bootstrap/cache
sudo chmod 600 /var/www/nkh-restaurant/.env
```

### **6. Performance Optimization**

#### **6.1 Laravel Optimizations**
```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize

# Cache events
php artisan event:cache
```

#### **6.2 Redis Configuration**
Edit `/etc/redis/redis.conf`:
```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### **7. Monitoring & Logging**

#### **7.1 Log Rotation**
Create `/etc/logrotate.d/nkh-restaurant`:
```
/var/www/nkh-restaurant/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0644 www-data www-data
}
```

#### **7.2 Health Checks**
```bash
# Add to crontab
* * * * * cd /var/www/nkh-restaurant && php artisan schedule:run >> /dev/null 2>&1

# Health check endpoint
curl -f https://your-domain.com/up || exit 1
```

### **8. SSL Certificate Setup**

#### **8.1 Let's Encrypt (Recommended)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### **8.2 Auto-renewal**
```bash
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **9. Backup Strategy**

#### **9.1 Database Backup Script**
Create `/usr/local/bin/backup-nkh.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/nkh-restaurant"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u nkh_user -p'secure_password_here' nkh_restaurant > $BACKUP_DIR/db_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/nkh-restaurant --exclude=/var/www/nkh-restaurant/node_modules

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

#### **9.2 Automated Backups**
```bash
sudo chmod +x /usr/local/bin/backup-nkh.sh
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-nkh.sh
```

### **10. Post-Deployment Verification**

#### **10.1 System Health Checks**
```bash
# Check services
sudo systemctl status nginx
sudo systemctl status php8.2-fpm
sudo systemctl status mysql
sudo systemctl status redis

# Check application
curl -I https://your-domain.com
curl -I https://your-domain.com/api/categories

# Check logs
tail -f /var/www/nkh-restaurant/storage/logs/laravel.log
```

#### **10.2 Performance Testing**
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API endpoints
ab -n 100 -c 10 https://your-domain.com/api/categories
ab -n 50 -c 5 https://your-domain.com/api/menu-items
```

### **11. Maintenance Commands**

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Update application
git pull origin main
composer install --optimize-autoloader --no-dev
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 🔒 **Security Checklist**

- [ ] SSL certificate installed and configured
- [ ] Firewall properly configured
- [ ] Database access restricted
- [ ] File permissions set correctly
- [ ] Security headers implemented
- [ ] Rate limiting enabled
- [ ] Error reporting disabled in production
- [ ] Debug mode disabled
- [ ] Secure session configuration
- [ ] Regular security updates scheduled

## 📊 **Monitoring Checklist**

- [ ] Log rotation configured
- [ ] Health checks implemented
- [ ] Performance monitoring setup
- [ ] Backup strategy implemented
- [ ] Error alerting configured
- [ ] Resource usage monitoring
- [ ] Database performance monitoring

## 🚨 **Emergency Procedures**

### **Rollback Process**
```bash
# Restore from backup
mysql -u nkh_user -p'password' nkh_restaurant < /var/backups/nkh-restaurant/db_YYYYMMDD_HHMMSS.sql
tar -xzf /var/backups/nkh-restaurant/app_YYYYMMDD_HHMMSS.tar.gz -C /
sudo systemctl reload nginx
```

### **Emergency Contacts**
- System Administrator: [contact-info]
- Database Administrator: [contact-info]
- Development Team: [contact-info]

---

**⚠️ Important Notes:**
1. Always test deployment process in staging environment first
2. Keep backups before any major changes
3. Monitor system resources after deployment
4. Update security patches regularly
5. Review logs daily for the first week after deployment
