<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * SECURITY: Protect authentication and verification fields
     * 
     * Protected fields:
     * - Auth: password, remember_token (Laravel auth)
     * - Verification: email_verified_at, phone_verified_at
     * - System: last_login_at
     */
    protected $guarded = [
        'id',
        'password',                 // ⚠️ CRITICAL: Hashed password
        'remember_token',           // ⚠️ CRITICAL: Auth token  
        'email_verified_at',        // ⚠️ Verification system only
        'phone_verified_at',        // ⚠️ Verification system only
        'last_login_at',            // ⚠️ System-tracked
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'telegram_id' => 'integer',
            'is_active' => 'boolean',
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    // ============================================
    // PHASE 3: UNIFIED IDENTITY RELATIONSHIPS
    // ============================================

    /**
     * Get the user's profile (Phase 3 - replaces Customer).
     */
    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    /**
     * Get user's addresses.
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    /**
     * Get user's orders.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    // ============================================
    // EXISTING RELATIONSHIPS (Legacy)
    // ============================================

    /**
     * Get the full URL for the user's avatar (uses image_path or avatar)
     */
    public function getAvatarUrlAttribute(): ?string
    {
        // Phase 3: prefer avatar_url column,then fall back to image_path or avatar
        if ($this->attributes['avatar_url'] ?? null) {
            return $this->attributes['avatar_url'];
        }
        
        $path = $this->image_path ?: $this->avatar;
        if (!$path) {
            return null;
        }
        return \Illuminate\Support\Facades\Storage::url($path);
    }

    /**
     * Get the full URL for image_path specifically
     */
    public function getImagePathUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }
        return \Illuminate\Support\Facades\Storage::url($this->image_path);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function defaultLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'default_location_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    /**
     * Legacy customer relationship (Phase 3: to be deprecated).
     */
    public function customer(): HasOne
    {
        return $this->hasOne(Customer::class);
    }

    // ============================================
    // PHASE 3: AUTHENTICATION HELPERS
    // ============================================

    /**
     * Check if user authenticates via Telegram.
     */
    public function isTelegramUser(): bool
    {
        return !empty($this->telegram_id);
    }

    /**
     * Check if user has a password (email/password auth).
     */
    public function hasPassword(): bool
    {
        return !empty($this->password);
    }

    /**
     * Check if user can login with email.
     */
    public function canLoginWithEmail(): bool
    {
        return !empty($this->email) && $this->hasPassword();
    }

    /**
     * Check if user can login with phone (OTP).
     */
    public function canLoginWithPhone(): bool
    {
        return !empty($this->phone);
    }

    /**
     * Get primary authentication method.
     */
    public function getPrimaryAuthMethod(): string
    {
        if ($this->isTelegramUser()) {
            return 'telegram';
        }
        if ($this->canLoginWithEmail()) {
            return 'email_password';
        }
        if ($this->canLoginWithPhone()) {
            return 'phone_otp';
        }
        return 'qr_guest';
    }

    // ============================================
    // PHASE 3: QUERY SCOPES
    // ============================================

    /**
     * Scope to get only customer users.
     */
    public function scopeCustomers(Builder $query): Builder
    {
        return $query->where('role', 'customer');
    }

    /**
     * Scope to get users by Telegram ID.
     */
    public function scopeByTelegram(Builder $query, int $telegramId): Builder
    {
        return $query->where('telegram_id', $telegramId);
    }

    /**
     * Scope to get users by phone.
     */
    public function scopeByPhone(Builder $query, string $phone): Builder
    {
        return $query->where('phone', $phone);
    }

    /**
     * Scope to get active users only.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    // ============================================
    // RBAC HELPERS
    // ============================================

    public function hasRole(string $slug): bool
    {
        return $this->roles()->where('slug', $slug)->exists();
    }

    public function hasAnyRole(array|string $slugs): bool
    {
        $slugs = is_array($slugs) ? $slugs : [$slugs];
        return $this->roles()->whereIn('slug', $slugs)->exists();
    }

    public function hasPermission(string $slug): bool
    {
        return $this->roles()
            ->whereHas('permissions', function ($q) use ($slug) {
                $q->where('slug', $slug);
            })
            ->exists();
    }
}
