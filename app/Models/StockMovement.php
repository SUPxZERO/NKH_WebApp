<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use App\Traits\HasLocation;

class StockMovement extends Model
{
    use HasFactory, HasLocation;

    // The ledger is append-only, so we disable the default updated_at column
    public const UPDATED_AT = null;

    protected $fillable = [
        'ingredient_id',
        'location_id',
        'movement_type',
        'quantity',
        'running_balance',
        'reference_type',
        'reference_id',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'running_balance' => 'decimal:3',
        'created_at' => 'datetime',
    ];

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
