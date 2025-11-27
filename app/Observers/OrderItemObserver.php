<?php

namespace App\Observers;

use App\Models\OrderItem;
use App\Services\InventoryConsumptionService;

class OrderItemObserver
{
    public function updated(OrderItem $orderItem): void
    {
        if ($orderItem->wasChanged('status')) {
            app(InventoryConsumptionService::class)->recordForOrderItem($orderItem);
        }
    }
}
