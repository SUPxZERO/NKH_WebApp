# 🚀 Quick Fix Steps - 401/403 Authentication Errors

## ⚡ Immediate Actions (Do These Now)

### 1. Update Your .env File
Add these lines to your `.env` file:

```env
SESSION_DRIVER=database
SESSION_DOMAIN=127.0.0.1
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=127.0.0.1:5173,localhost:5173,127.0.0.1:8000,localhost:8000
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:5173
```

### 2. Clear All Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 3. Verify Sessions Table Exists
```bash
php artisan migrate
```

### 4. Restart Your Servers
```bash
# Terminal 1
php artisan serve

# Terminal 2
npm run dev
```

### 5. Clear Browser Data
- Open DevTools (F12)
- Go to Application tab
- Click "Clear site data"
- Refresh page (Ctrl+F5)

### 6. Test Login
1. Go to `http://127.0.0.1:5173/login`
2. Login with: `demo@admin.com` / `demo123`
3. Should redirect to `/admin/dashboard`
4. Check Network tab - API calls should return 200 OK

---

## ✅ What Was Fixed

### Code Changes Made:
1. ✅ **Dashboard.tsx** - Now uses `apiGet` instead of direct `axios`
2. ✅ **api.ts** - Added XSRF token extraction and header injection
3. ✅ **CategoryController.php** - Added missing `hierarchy()` method
4. ✅ **api.php** - Added `/api/admin/categories/hierarchy` route

### Configuration Required:
5. ⚠️ **YOU NEED TO UPDATE .env** - See step 1 above

---

## 🔍 Verify It's Working

### Check 1: Cookies Present
Open DevTools → Application → Cookies → `http://127.0.0.1:5173`

Should see:
- ✅ `laravel_session` or `nkh_restaurant-session`
- ✅ `XSRF-TOKEN`

### Check 2: API Requests Include Cookies
Open DevTools → Network → Click any API request → Headers

Should see:
- ✅ `Cookie: laravel_session=...`
- ✅ `X-XSRF-TOKEN: ...` (for POST/PUT/DELETE)

### Check 3: No More 401/403 Errors
- ✅ Dashboard loads without errors
- ✅ Categories page loads
- ✅ All admin routes work

---

## 🐛 Still Not Working?

### Problem: "401 Unauthorized"
**Cause:** Session not being sent or CSRF token missing

**Fix:**
1. Check `.env` has `SESSION_DOMAIN=127.0.0.1`
2. Check `SANCTUM_STATEFUL_DOMAINS` includes `127.0.0.1:5173`
3. Clear browser cookies and try again
4. Make sure you're accessing via `127.0.0.1`, not `localhost`

### Problem: "403 Forbidden"
**Cause:** User doesn't have admin role

**Fix:**
```bash
php artisan tinker
>>> $user = \App\Models\User::where('email', 'demo@admin.com')->first();
>>> $user->role
# Should output: "admin"

# If not, update it:
>>> $user->update(['role' => 'admin']);
```

### Problem: "CSRF token mismatch"
**Cause:** XSRF token not being sent

**Fix:**
1. Clear browser cache completely
2. Check `api.ts` has the XSRF token extraction code
3. Verify `withCredentials: true` is set in axios config

---

## 📚 Full Documentation

For detailed explanation, see:
- **AUTH_FIX_GUIDE.md** - Complete technical guide
- **.env.sanctum.example** - Environment variable reference

---

## 🎯 Expected Behavior After Fix

### Login Flow:
1. User enters credentials on `/login`
2. Laravel creates session → sets cookies
3. User redirected to `/admin/dashboard`
4. Dashboard makes API calls with session cookies
5. Laravel validates session → returns data
6. ✅ Everything works!

### API Call Flow:
```
React Component
    ↓ calls apiGet('/api/admin/...')
api.ts interceptor
    ↓ adds XSRF-TOKEN header
    ↓ sends with session cookie
Laravel Sanctum
    ↓ validates session
    ↓ checks role
Controller
    ↓ returns JSON
React Component
    ↓ displays data
✅ Success!
```

---

## ⏱️ Time to Fix: ~5 minutes

1. Update .env (1 min)
2. Clear caches (1 min)
3. Restart servers (1 min)
4. Clear browser data (1 min)
5. Test login (1 min)

---

**Need Help?** Check the debug endpoint:
```
http://127.0.0.1:8000/debug-session
```

This shows your current session, cookies, and auth status.
