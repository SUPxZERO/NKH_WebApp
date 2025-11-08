# Authentication and Session Fix

## Issues Fixed

### 1. **Missing Authentication Middleware**

The `Authenticate.php` middleware was missing, causing authentication checks to fail silently.

**Created:** `/app/Http/Middleware/Authenticate.php`

-   Redirects unauthenticated users to login page
-   Handles JSON requests properly

**Created:** `/app/Http/Middleware/RedirectIfAuthenticated.php`

-   Prevents already authenticated users from accessing guest-only pages (login, register)
-   Redirects authenticated users to their appropriate dashboard based on role

### 2. **Session Domain Configuration**

The session domain was set to the string `"null"` instead of actual `null`, causing cookies to be set for the wrong domain.

**Fixed in:**

-   `config/session.php`: Changed `'domain' => env('SESSION_DOMAIN')` to `'domain' => env('SESSION_DOMAIN', null)`
-   `config/session.php`: Added default value for `secure` cookie setting
-   `.env`: Removed the string "null" from `SESSION_DOMAIN=`

### 3. **Route Middleware Issues**

Authentication routes were not properly wrapped in `guest` and `auth` middleware groups.

**Fixed in:** `routes/auth.php`

-   Login and register routes now use `guest` middleware (prevents authenticated users from accessing)
-   Logout and password routes now use `auth` middleware (requires authentication)
-   Removed commented-out code that was causing confusion

**Fixed in:** `routes/web.php`

-   Removed duplicate login/register route definitions
-   Auth routes are now only defined in `routes/auth.php`

### 4. **Sanctum Configuration**

Added missing `SANCTUM_STATEFUL_DOMAINS` to support SPA authentication.

**Added to `.env`:**

```
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
```

### 5. **Inertia Props Optimization**

Updated `HandleInertiaRequests` to properly serialize user data and prevent circular references.

**Fixed in:** `app/Http/Middleware/HandleInertiaRequests.php`

-   Now explicitly defines which user properties to share
-   Prevents entire user model from being serialized

## Current Configuration

### Session Settings (.env)

```
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=
```

### Important Notes

1. **Session Driver**: Using `database` driver - sessions are stored in the `sessions` table
2. **Session Table**: Exists and is properly structured with the migration `0001_01_01_000000_create_users_table.php`
3. **Cookie Security**:
    - For local development (HTTP): `SESSION_SECURE_COOKIE` is not set (defaults to false)
    - For production (HTTPS): Should set `SESSION_SECURE_COOKIE=true`

## Testing the Fix

1. **Clear browser cookies** - Old cookies with wrong domain might still exist
2. **Clear Laravel config cache**:

    ```bash
    php artisan config:clear
    php artisan route:clear
    ```

3. **Test login flow**:

    - Go to `/login`
    - Log in with valid credentials
    - Should redirect to appropriate dashboard based on role
    - Refresh the page - should stay authenticated
    - Session should NOT create multiple entries in database

4. **Check session persistence**:
    - After login, check database: `SELECT * FROM sessions WHERE user_id IS NOT NULL`
    - Should see ONE session per user per browser
    - Refreshing page should NOT create new sessions

## Common Issues & Solutions

### Multiple Sessions in Database

**Cause**: Cookie not being sent back to server due to domain mismatch
**Solution**: Ensure `SESSION_DOMAIN` is empty (not "null"), clear browser cookies

### Redirect to Login After Refresh

**Cause**: Session cookie not persisting or middleware missing
**Solution**:

-   Check browser DevTools > Application > Cookies - should see session cookie
-   Verify `StartSession` middleware is in `web` middleware group
-   Ensure `Authenticate` middleware exists

### Guest Users Can Access Protected Routes

**Cause**: Missing `auth` middleware on routes
**Solution**: Check that protected routes have `->middleware('auth')` or are in an `auth` middleware group

## Files Modified

1. `app/Http/Middleware/Authenticate.php` (created)
2. `app/Http/Middleware/RedirectIfAuthenticated.php` (created)
3. `routes/auth.php` (reorganized with proper middleware)
4. `routes/web.php` (removed duplicate routes)
5. `config/session.php` (fixed domain and secure defaults)
6. `.env` (fixed SESSION_DOMAIN, added SANCTUM_STATEFUL_DOMAINS)
7. `app/Http/Middleware/HandleInertiaRequests.php` (optimized user serialization)

## Production Checklist

Before deploying to production:

-   [ ] Set `SESSION_SECURE_COOKIE=true` in production .env
-   [ ] Set `SESSION_DOMAIN` to your production domain (e.g., `.yourdomain.com`)
-   [ ] Update `SANCTUM_STATEFUL_DOMAINS` to include production domain
-   [ ] Ensure HTTPS is enabled
-   [ ] Run `php artisan config:cache` after deployment
-   [ ] Clear all sessions: `TRUNCATE sessions;` (forces all users to re-login)
