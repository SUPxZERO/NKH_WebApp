<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
        'latitude',
        'longitude',
        'avatar',
        'image_path',
        'default_location_id',
        'is_active',
        'role',
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
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the full URL for the user's avatar (uses image_path or avatar)
     */
    public function getAvatarUrlAttribute(): ?string
    {
        // Prefer image_path, then fall back to avatar
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

    /**
     * Relationships
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function defaultLocation()
    {
        return $this->belongsTo(Location::class, 'default_location_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

    public function customer()
    {
        return $this->hasOne(Customer::class);
    }

    /**
     * RBAC helpers
     */
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
