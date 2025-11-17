# 🔧 Authentication Fix Guide - Laravel + React (Vite) with Sanctum

## 🎯 Problem Summary
You were experiencing 401/403 errors because of a **mixed authentication setup**:
- Login via **Inertia.js** (session-based)
- API calls via **Axios** expecting token-based auth
- Sanctum configured for stateful but missing proper CORS/session setup

## ✅ What Was Fixed

### 1. **Frontend API Configuration** (`resources/js/app/utils/api.ts`)
- ✅ Added XSRF token extraction from cookies
- ✅ Automatically attaches XSRF-TOKEN header to state-changing requests
- ✅ Properly initializes CSRF cookie before any API call
- ✅ Uses `withCredentials: true` for session cookies

### 2. **Dashboard API Calls** (`resources/js/Pages/admin/Dashboard.tsx`)
- ✅ Changed from direct `axios` to configured `apiGet` helper
- ✅ Now properly uses CSRF protection and session cookies

### 3. **Backend Routes** (`routes/api.php`)
- ✅ Added missing `/api/admin/categories/hierarchy` endpoint

### 4. **CategoryController** (`app/Http/Controllers/Api/CategoryController.php`)
- ✅ Added `hierarchy()` method for category tree view

---

## 🔐 Required .env Configuration

Add/verify these settings in your `.env` file:

```env
# App Configuration
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:5173

# Session Configuration (CRITICAL for Sanctum stateful auth)
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=127.0.0.1
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax

# Sanctum Configuration (CRITICAL)
SANCTUM_STATEFUL_DOMAINS=127.0.0.1:5173,localhost:5173,127.0.0.1:8000,localhost:8000

# CORS Configuration
# Laravel 10+ uses config/cors.php, but if you have these:
# CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
# CORS_SUPPORTS_CREDENTIALS=true
```

---

## 🚀 Frontend Environment Variables

Create/update `resources/js/.env` or your Vite `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 🔄 How Authentication Now Works

### **Login Flow:**
1. User visits `/login` (Inertia page)
2. User submits credentials via `router.post('/login')`
3. Laravel creates a **session** and sets cookies:
   - `laravel_session` (encrypted session ID)
   - `XSRF-TOKEN` (CSRF protection)
4. User is redirected to role-based dashboard

### **API Call Flow:**
1. React component calls `apiGet('/api/admin/dashboard/analytics')`
2. `api.ts` interceptor:
   - Ensures CSRF cookie is initialized
   - Extracts `XSRF-TOKEN` from cookie
   - Adds `X-XSRF-TOKEN` header
   - Sends with `withCredentials: true`
3. Request hits Laravel with:
   - `Cookie: laravel_session=...`
   - `X-XSRF-TOKEN: ...`
4. Sanctum's `EnsureFrontendRequestsAreStateful` middleware:
   - Checks if request is from stateful domain
   - Validates session cookie
   - Authenticates user via `web` guard
5. `auth:sanctum` middleware passes
6. `role:admin,manager` middleware checks user role
7. Controller returns data

---

## 🧪 Testing the Fix

### 1. **Clear All Caches**
```bash
# Backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Frontend
npm run build
# Or if using dev server, restart it
```

### 2. **Clear Browser Data**
- Open DevTools → Application → Clear site data
- Or use Incognito/Private window

### 3. **Restart Servers**
```bash
# Terminal 1: Laravel
php artisan serve

# Terminal 2: Vite
npm run dev
```

### 4. **Test Login**
1. Go to `http://127.0.0.1:5173/login`
2. Login as admin (demo@admin.com / demo123)
3. Check browser DevTools → Network:
   - Should see `laravel_session` cookie
   - Should see `XSRF-TOKEN` cookie
4. Navigate to `/admin/dashboard`
5. Check Network tab:
   - API calls should return 200 OK
   - Request headers should include:
     - `Cookie: laravel_session=...`
     - `X-XSRF-TOKEN: ...`

---

## 🐛 Troubleshooting

### **Still getting 401 errors?**

#### Check 1: CSRF Cookie
```javascript
// In browser console:
document.cookie
// Should see: XSRF-TOKEN=...
```

#### Check 2: Session Cookie
```javascript
// In browser console:
document.cookie
// Should see: laravel_session=... or nkh_restaurant-session=...
```

#### Check 3: Sanctum Stateful Domains
```bash
# In Laravel tinker:
php artisan tinker
>>> config('sanctum.stateful')
# Should include: ["127.0.0.1:5173", "localhost:5173", ...]
```

#### Check 4: Session Driver
```bash
php artisan tinker
>>> config('session.driver')
# Should be: "database"

# Verify sessions table exists:
>>> \DB::table('sessions')->count()
```

### **Still getting 403 errors?**

#### Check 1: User Role
```bash
php artisan tinker
>>> $user = \App\Models\User::where('email', 'demo@admin.com')->first();
>>> $user->role
# Should be: "admin"

# Or if using roles table:
>>> $user->roles->pluck('slug')
# Should include: "admin"
```

#### Check 2: CheckRole Middleware
The middleware checks both:
- `$user->hasRole($role)` method
- `$user->role` property

Make sure your User model has the correct role attribute.

### **CORS Issues?**

If you see CORS errors in console:

1. **Check `config/cors.php`** (if it exists):
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://127.0.0.1:5173', 'http://localhost:5173'],
'supports_credentials' => true,
```

2. **Or add to `.env`**:
```env
CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

---

## 🔒 Service Worker Issues

If you have a service worker caching requests:

### **Clear Service Worker Cache**
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});

// Then refresh the page
location.reload();
```

### **Disable Service Worker During Development**
In your service worker file, add:
```javascript
if (process.env.NODE_ENV === 'development') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', () => self.clients.claim());
}
```

---

## 📝 Production Deployment Checklist

When deploying to production:

1. **Update .env**:
```env
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
SESSION_DOMAIN=yourdomain.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
```

2. **Enable HTTPS**:
   - Session cookies with `secure=true` require HTTPS

3. **Update CORS**:
   - Remove localhost from allowed origins
   - Add production domain

4. **Clear caches**:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🎓 Understanding the Architecture

### **Why Sanctum Stateful?**
- You're using **Inertia.js** for server-side rendering
- Inertia works best with **session-based auth**
- Sanctum's stateful mode allows API routes to use sessions
- No need to manage tokens in localStorage

### **When to Use Token Auth Instead?**
- If you had a **separate SPA** (not Inertia)
- If you needed **mobile app** authentication
- If you wanted **API-only** backend

### **Your Current Setup:**
```
┌─────────────────────────────────────────┐
│  Browser (http://127.0.0.1:5173)        │
│  ┌────────────────────────────────────┐ │
│  │  React + Inertia.js                │ │
│  │  - Login via Inertia router        │ │
│  │  - API calls via Axios (api.ts)    │ │
│  └────────────────────────────────────┘ │
│           │                              │
│           │ HTTP Requests                │
│           │ + Cookies (session, XSRF)    │
│           ▼                              │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Laravel (http://127.0.0.1:8000)        │
│  ┌────────────────────────────────────┐ │
│  │  Middleware Stack:                 │ │
│  │  1. HandleCors                     │ │
│  │  2. EncryptCookies                 │ │
│  │  3. StartSession                   │ │
│  │  4. VerifyCsrfToken                │ │
│  │  5. EnsureFrontendRequestsAreStateful │
│  │  6. auth:sanctum                   │ │
│  │  7. role:admin,manager             │ │
│  └────────────────────────────────────┘ │
│           │                              │
│           ▼                              │
│  ┌────────────────────────────────────┐ │
│  │  Controllers (return JSON)         │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## ✅ Summary

Your authentication now works via:
1. **Session-based login** (Inertia)
2. **Stateful Sanctum** for API routes
3. **CSRF protection** via XSRF-TOKEN
4. **Role-based access** via CheckRole middleware

All admin API routes (`/api/admin/*`) now:
- ✅ Accept session cookies
- ✅ Validate CSRF tokens
- ✅ Check user roles
- ✅ Return proper JSON responses

---

## 🆘 Still Having Issues?

Run this debug route to check your session:
```bash
# Visit: http://127.0.0.1:8000/debug-session
```

This will show:
- Session configuration
- Current session ID
- Authenticated user ID
- All cookies
- All headers

---

**Last Updated:** 2024
**Laravel Version:** 10+
**Sanctum Version:** 3+
