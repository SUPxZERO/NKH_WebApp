<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory, \App\Traits\BranchScopable;

    protected $guarded = [
        'id',
        'location_id',
        'key',
        'value',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'value' => 'array',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}
