<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiningTable extends Model
{
    use HasFactory;

    protected $table = 'tables';

    protected $fillable = [
        'floor_id',
        'code',
        'capacity',
        'status',
    ];

    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'table_id');
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'table_id');
    }
}
