<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Reservation extends Model
{
    use HasFactory;

    /**
     * SECURITY: Use $guarded to protect reservation system fields
     * 
     * Protected fields:
     * - System: code, reservation_number (auto-generated)
     * - Workflow: status (managed by reservation service)
     */
    protected $guarded = [
        'id',
        'code',                 // ⚠️ System-generated code
        'reservation_number',   // ⚠️ System-generated number
        'status',               // ⚠️ Workflow-managed (pending/confirmed/completed/cancelled/no-show)
        'created_at',
        'updated_at',
    ];


    protected $casts = [
        'reservation_date' => 'date',
        'party_size' => 'integer',
        'duration_minutes' => 'integer',
        'guest_count' => 'integer',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function table()
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function canCustomerCancel(): bool
    {
        if (! in_array($this->status, ['pending', 'confirmed'], true)) {
            return false;
        }

        if (! $this->reservation_date) {
            return false;
        }

        $today = Carbon::today()->toDateString();

        $reservationDate = $this->reservation_date instanceof Carbon
            ? $this->reservation_date->format('Y-m-d')
            : substr((string) $this->reservation_date, 0, 10);

        return $reservationDate > $today;
    }
}
