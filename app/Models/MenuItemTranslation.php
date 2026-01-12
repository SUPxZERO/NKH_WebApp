<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuItemTranslation extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'menu_item_id',
        'locale',
        'name',
        'description',
            'created_at',
        'updated_at',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
