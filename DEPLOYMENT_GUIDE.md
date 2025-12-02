# Render.com Deployment Guide for NKH Restaurant App

This guide will walk you through deploying your Laravel + React application to Render.com.

## Prerequisites

1. A [Render.com](https://render.com) account (free tier available)
2. Your GitHub repository should be pushed and up to date
3. All local changes committed

## Deployment Steps

### Step 1: Push Your Code to GitHub

```bash
cd e:\promgramming\NKH_WebApp
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create a New Blueprint on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the repository: `NKH_WebApp`
5. Render will automatically detect the `render.yaml` file
6. Click **"Apply"**

### Step 3: Configure Environment Variables

After the blueprint is applied, you need to set some environment variables manually:

1. Go to your web service in the Render dashboard
2. Navigate to **"Environment"** tab
3. Add/Update these variables:

```
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_URL=https://your-app-name.onrender.com
SANCTUM_STATEFUL_DOMAINS=your-app-name.onrender.com,localhost,127.0.0.1
SESSION_DOMAIN=.onrender.com
```

**To generate APP_KEY:**
- If you have PHP locally: `php artisan key:generate --show`
- Or use the Shell tab in Render: `php artisan key:generate --show`

### Step 4: Run Post-Deployment Commands

Once the initial deployment is complete:

1. Go to your web service
2. Click on **"Shell"** tab
3. Run these commands:

```bash
# Run migrations
php artisan migrate --force

# Seed database if needed (optional)
php artisan db:seed --force

# Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link
php artisan storage:link
```

### Step 5: Verify Deployment

1. Visit your app URL: `https://your-app-name.onrender.com`
2. Check if the application loads correctly
3. Test login functionality
4. Verify database connections

## Automatic Deployments

Render will automatically deploy your app when you push changes to your main branch.

## Database Management

### Accessing the Database

1. Go to your database service in Render dashboard
2. Click **"Info"** tab to see connection details
3. Use these credentials with any MySQL client (e.g., MySQL Workbench, TablePlus)

### Running Migrations

Option 1 - Via Shell:
1. Go to your web service → Shell tab
2. Run: `php artisan migrate`

Option 2 - Via Deploy Hook:
1. Add to `render.yaml` under your web service:
   ```yaml
   buildCommand: php artisan migrate --force
   ```

### Backup Database

```bash
# From Render Shell
mysqldump -h [DB_HOST] -u [DB_USER] -p[DB_PASSWORD] [DB_NAME] > backup.sql
```

## Troubleshooting

### Build Failures

1. Check the build logs in the Render dashboard
2. Common issues:
   - Missing environment variables
   - Database connection issues
   - Node/NPM version mismatches

### Database Connection Issues

1. Verify database is running (check database service status)
2. Confirm environment variables are correctly set
3. Check if database is in the same region as web service

### 502 Bad Gateway

This usually means the app isn't responding:
1. Check logs for errors
2. Verify `php artisan serve` is running correctly
3. Ensure port 8000 is exposed in Dockerfile

### Storage Issues

If file uploads aren't working:
1. Run `php artisan storage:link` in the Shell
2. Verify permissions: `chmod -R 775 storage`
3. Consider using S3 for production file storage

### Session/Authentication Issues

1. Ensure `SESSION_DOMAIN` is set correctly
2. Update `SANCTUM_STATEFUL_DOMAINS` to include your Render domain
3. Set `SESSION_DRIVER=database` for better reliability

## Performance Optimization

### Enable Caching

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Upgrade from Free Tier

Free tier limitations:
- Apps spin down after 15 minutes of inactivity
- 750 hours/month
- Shared resources

Consider upgrading to Starter ($7/month) for:
- No spin down
- More resources
- Better performance

## Monitoring

1. **Logs**: Available in the "Logs" tab of your service
2. **Metrics**: CPU, Memory usage in "Metrics" tab
3. **Alerts**: Set up in "Notifications" settings

## Production Checklist

- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] Strong `APP_KEY` generated
- [ ] Database backups configured
- [ ] Environment variables secured
- [ ] HTTPS enabled (automatic on Render)
- [ ] Caching enabled
- [ ] Error logging configured
- [ ] Rate limiting configured
- [ ] CORS settings reviewed

## Support

- [Render Documentation](https://render.com/docs)
- [Laravel Deployment Guide](https://laravel.com/docs/deployment)
- [Render Community Forum](https://community.render.com)

## Quick Commands Reference

```bash
# Migrations
php artisan migrate --force
php artisan migrate:fresh --force --seed

# Cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Queue
php artisan queue:work --daemon

# Storage
php artisan storage:link
```

---

**Need help?** Check the deployment logs in your Render dashboard or open a support ticket.
