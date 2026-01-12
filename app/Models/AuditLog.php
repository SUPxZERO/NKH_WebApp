<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    /**
     * SECURITY: Audit logs are append-only (never editable)
     * All fields protected to ensure audit trail integrity
     */
    protected $guarded = [
        'id',
        'user_id',              // ⚠️ CRITICAL: Who performed action
        'action',               // ⚠️ CRITICAL: What was done
        'ip_address',           // ⚠️ Audit trail
        'user_agent',           // ⚠️ Audit trail
        'metadata',             // ⚠️ Audit details
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function auditable()
    {
        return $this->morphTo();
    }
}
