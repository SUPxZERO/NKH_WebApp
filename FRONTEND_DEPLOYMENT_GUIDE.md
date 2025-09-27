# 🚀 NKH Restaurant Management System - Frontend Deployment Guide

## 📋 Overview

This guide covers the deployment of the Gen-Z styled restaurant management system frontend built with React, TypeScript, Inertia.js, and Tailwind CSS.

## 🏗️ Architecture Summary

### **Three-Tier System**
- **Admin Dashboard** (`/admin/*`) - Restaurant owners/managers
- **Employee Interface** (`/employee/*`) - Waiters, kitchen staff, cashiers  
- **Customer Interface** (`/`) - Restaurant customers

### **Tech Stack**
- **Frontend**: React 18 + TypeScript + Inertia.js
- **Styling**: Tailwind CSS with custom Gen-Z aesthetic
- **State**: React Query + Zustand
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **PWA**: Service Worker + Web App Manifest

## 🔧 Prerequisites

### **Development Environment**
```bash
Node.js >= 18.0.0
npm >= 9.0.0
PHP >= 8.1
Composer >= 2.0
```

### **Production Environment**
```bash
Web server (Nginx/Apache)
PHP-FPM >= 8.1
Node.js >= 18.0.0 (for build process)
SSL certificate (required for PWA)
```

## 📦 Installation & Setup

### **1. Clone and Install Dependencies**
```bash
git clone <repository-url>
cd NKH_WebApp

# Install PHP dependencies
composer install --optimize-autoloader --no-dev

# Install Node dependencies
npm install
```

### **2. Environment Configuration**
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### **3. Environment Variables**
```env
# App Configuration
APP_NAME="NKH Restaurant"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nkh_restaurant
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Real-time Features (Optional)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_APP_KEY=your_pusher_key
PUSHER_APP_SECRET=your_pusher_secret
PUSHER_APP_CLUSTER=mt1

# Frontend Environment Variables
VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_CLUSTER="${PUSHER_APP_CLUSTER}"
```

### **4. Database Setup**
```bash
# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed
```

### **5. Build Frontend Assets**
```bash
# Production build
npm run build

# Verify build output
ls -la public/build/
```

## 🌐 Web Server Configuration

### **Nginx Configuration**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;
    root /var/www/NKH_WebApp/public;

    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # PWA Headers
    add_header Service-Worker-Allowed "/" always;

    index index.php;

    charset utf-8;

    # Handle Laravel routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM Configuration
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker (no cache)
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # PWA Manifest
    location = /manifest.json {
        add_header Content-Type "application/manifest+json";
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### **Apache Configuration (.htaccess)**
```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Service-Worker-Allowed "/"
</IfModule>

# Caching for static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

## 🔄 Deployment Process

### **1. Automated Deployment Script**
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting deployment..."

# Pull latest changes
git pull origin main

# Install/update dependencies
composer install --optimize-autoloader --no-dev
npm ci

# Build frontend assets
npm run build

# Clear caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations (if needed)
php artisan migrate --force

# Set permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

echo "✅ Deployment completed!"
```

### **2. Zero-Downtime Deployment**
```bash
#!/bin/bash
# zero-downtime-deploy.sh

DEPLOY_PATH="/var/www"
APP_NAME="NKH_WebApp"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NEW_RELEASE="$DEPLOY_PATH/releases/$TIMESTAMP"
CURRENT_LINK="$DEPLOY_PATH/$APP_NAME"

# Create release directory
mkdir -p $NEW_RELEASE

# Clone repository
git clone <repository-url> $NEW_RELEASE

cd $NEW_RELEASE

# Install dependencies
composer install --optimize-autoloader --no-dev
npm ci && npm run build

# Copy environment file
cp $DEPLOY_PATH/.env $NEW_RELEASE/.env

# Link storage
ln -nfs $DEPLOY_PATH/storage $NEW_RELEASE/storage

# Run optimizations
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Switch to new release
ln -nfs $NEW_RELEASE $CURRENT_LINK

# Cleanup old releases (keep last 5)
cd $DEPLOY_PATH/releases && ls -t | tail -n +6 | xargs rm -rf

echo "✅ Zero-downtime deployment completed!"
```

## 📱 PWA Configuration

### **1. Required Files**
- ✅ `public/manifest.json` - Web app manifest
- ✅ `public/sw.js` - Service worker
- ✅ PWA icons (192x192, 512x512)
- ✅ Apple touch icons

### **2. HTTPS Requirement**
PWA features require HTTPS in production. Ensure SSL certificate is properly configured.

### **3. Service Worker Registration**
The service worker is automatically registered via `resources/js/app/utils/pwa.ts`.

## 🔧 Performance Optimization

### **1. Frontend Optimizations**
```bash
# Enable Vite build optimizations
npm run build

# Verify bundle size
npx vite-bundle-analyzer dist
```

### **2. Laravel Optimizations**
```bash
# Production optimizations
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Enable OPcache in php.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
```

### **3. Database Optimizations**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_menu_items_active ON menu_items(active);
```

## 🔍 Monitoring & Logging

### **1. Application Monitoring**
```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### **2. Performance Monitoring**
- Use Laravel Telescope for development debugging
- Implement application performance monitoring (APM)
- Monitor Core Web Vitals for frontend performance

## 🔒 Security Checklist

### **Production Security**
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables secured (no .env in version control)
- [ ] Database credentials secured
- [ ] CSRF protection enabled
- [ ] XSS protection headers configured
- [ ] File upload restrictions in place
- [ ] Rate limiting configured
- [ ] Regular security updates applied

### **Frontend Security**
- [ ] Content Security Policy (CSP) configured
- [ ] Input sanitization with DOMPurify
- [ ] API endpoints properly authenticated
- [ ] Sensitive data not exposed in client-side code

## 🧪 Testing

### **1. Frontend Testing**
```bash
# Unit tests (when implemented)
npm run test

# E2E tests (when implemented)
npm run test:e2e

# Type checking
npm run type-check
```

### **2. Manual Testing Checklist**
- [ ] All three interfaces load correctly (Admin, Employee, Customer)
- [ ] Real-time features work (if Pusher configured)
- [ ] PWA install prompt appears on mobile
- [ ] Offline functionality works
- [ ] Theme switching works
- [ ] Responsive design on all screen sizes
- [ ] Form submissions work correctly
- [ ] Image uploads work (if implemented)

## 🚨 Troubleshooting

### **Common Issues**

**1. Assets not loading**
```bash
# Rebuild assets
npm run build
php artisan config:clear
```

**2. Service Worker not updating**
```bash
# Clear browser cache or use incognito mode
# Check browser dev tools > Application > Service Workers
```

**3. Real-time features not working**
```bash
# Check Pusher configuration
php artisan config:clear
# Verify VITE_PUSHER_KEY is set correctly
```

**4. PWA not installing**
- Ensure HTTPS is enabled
- Check manifest.json is accessible
- Verify service worker is registered
- Check browser console for errors

### **Performance Issues**
```bash
# Check Laravel performance
php artisan optimize
php artisan config:cache

# Check database queries
# Enable query logging in development
```

## 📈 Scaling Considerations

### **Horizontal Scaling**
- Use load balancer for multiple app servers
- Separate database server
- CDN for static assets
- Redis for session/cache storage

### **Vertical Scaling**
- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable PHP OPcache
- Use application-level caching

## 🎯 Success Metrics

### **Performance Targets**
- Page load time < 2 seconds
- First Contentful Paint < 1.5 seconds
- Cumulative Layout Shift < 0.1
- Mobile usability score > 95%

### **Business Metrics**
- Order completion rate > 90%
- User engagement time
- PWA installation rate
- Customer satisfaction scores

---

## 🎉 Deployment Complete!

Your Gen-Z styled restaurant management system is now ready for production! 

**Next Steps:**
1. Configure monitoring and alerts
2. Set up automated backups
3. Plan regular security updates
4. Monitor performance metrics
5. Gather user feedback for improvements

For support or questions, refer to the codebase documentation or contact the development team.
