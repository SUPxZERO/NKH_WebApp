# 🚀 Quick Deployment Guide - Render.com

## ✅ Pre-deployment Complete!

Your project is ready for deployment. All files have been pushed to GitHub.

## 📋 What Was Added:

1. **`render.yaml`** - Blueprint configuration for automatic deployment
2. **`DEPLOYMENT_GUIDE.md`** - Comprehensive deployment documentation
3. **`deployment/render-deploy.sh`** - Post-deployment automation script
4. **Updated Dockerfile** - Production-optimized with health checks
5. **Health Check Endpoint** - `/api/health` for monitoring

## 🎯 Next Steps - Deploy Now!

### Option 1: Automatic Blueprint Deployment (Recommended)

1. **Go to Render Dashboard**
   👉 [https://dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)

2. **Click "New Blueprint Instance"**

3. **Connect Your GitHub Repository**
   - If not already connected, authorize Render to access your GitHub
   - Select repository: `SUPxZERO/NKH_WebApp`

4. **Render Auto-Detects `render.yaml`**
   - Review the configuration
   - Click "Apply"

5. **Wait for Deployment** (5-10 minutes)
   - Database will be created first
   - Then the web app will build and deploy
   - You'll see live logs

6. **Set Environment Variable**
   - After deployment, go to your web service
   - Navigate to "Environment" tab
   - Update `APP_URL` to your Render URL (e.g., `https://nkh-restaurant-app.onrender.com`)
   - Generate and set `APP_KEY`:
     ```bash
     # In Render Shell
     php artisan key:generate --show
     ```
   - Add the output to `APP_KEY` environment variable

7. **Run Migrations**
   - Go to your web service → "Shell" tab
   - Run:
     ```bash
     php artisan migrate --force
     php artisan db:seed --force  # If you have seeders
     ```

### Option 2: Manual Service Creation

If you prefer manual setup, follow the detailed guide in `DEPLOYMENT_GUIDE.md`

## 🔐 Important Environment Variables to Set After Deployment:

```env
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_URL=https://your-app-name.onrender.com
SANCTUM_STATEFUL_DOMAINS=your-app-name.onrender.com,localhost,127.0.0.1
SESSION_DOMAIN=.onrender.com
```

## ⚡ Post-Deployment Commands:

Once deployed, run these in the Render Shell:

```bash
# Generate application key
php artisan key:generate --show

# Run migrations
php artisan migrate --force

# Seed database (if needed)
php artisan db:seed --force

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
```

## 🎉 Access Your App:

Your app will be available at:
- Free tier: `https://your-app-name.onrender.com`
- Custom domain: Set up in Render dashboard

## ⚠️ Known Issues & Solutions:

### 1. "502 Bad Gateway"
- **Cause**: App not responding
- **Solution**: Check logs, ensure migrations ran successfully

### 2. "Database connection failed"
- **Cause**: Database not ready
- **Solution**: Wait 30 seconds and redeploy

### 3. "Mix manifest not found"
- **Cause**: Frontend build failed
- **Solution**: Check build logs, ensure all npm packages installed

### 4. Free Tier Sleep Mode
- **Note**: Free tier apps sleep after 15 min inactivity
- **First request** after sleep takes ~30 seconds to wake up
- **Upgrade to Starter ($7/mo)** to disable sleep mode

## 📊 Monitoring:

- **Logs**: Real-time in Render dashboard
- **Metrics**: CPU/Memory usage tracked automatically
- **Health Check**: Automatic checks at `/api/health`

## 🆘 Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed troubleshooting
2. Review Render logs for specific errors
3. Render Community Forum: https://community.render.com

---

**Ready to deploy?** Go to: https://dashboard.render.com/blueprints

**Questions?** Read the full guide: `DEPLOYMENT_GUIDE.md`
