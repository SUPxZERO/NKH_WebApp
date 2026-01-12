<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Ingredient;
use App\Models\User;
use App\Models\InventoryTransaction;
use App\Services\Inventory\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InventoryServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new InventoryService();
    }

    public function test_can_adjust_stock_add()
    {
        $item = Ingredient::factory()->create([
            'current_stock' => 10,
            'cost_per_unit' => 5.00
        ]);
        
        $admin = User::factory()->create();

        $transaction = $this->service->adjustStock($item, 5, InventoryTransaction::TYPE_ADJUSTMENT, 'Manual add', $admin);

        $this->assertEquals(15, $item->refresh()->current_stock);
        $this->assertDatabaseHas('inventory_transactions', [
            'id' => $transaction->id,
            'ingredient_id' => $item->id,
            'quantity' => 5,
            'movement_type' => 'in',
            'type' => InventoryTransaction::TYPE_ADJUSTMENT
        ]);
    }

    public function test_can_adjust_stock_subtract()
    {
        $item = Ingredient::factory()->create([
            'current_stock' => 10,
            'cost_per_unit' => 5.00
        ]);

        $this->service->adjustStock($item, -3, InventoryTransaction::TYPE_USAGE);

        $this->assertEquals(7, $item->refresh()->current_stock);
        $this->assertDatabaseHas('inventory_transactions', [
            'ingredient_id' => $item->id,
            'quantity' => -3,
            'movement_type' => 'out'
        ]);
    }

    public function test_record_wastage()
    {
        $item = Ingredient::factory()->create(['current_stock' => 10]);
        $user = User::factory()->create();

        $this->service->recordWastage($item, 2, 'Spoiled', $user);

        $this->assertEquals(8, $item->refresh()->current_stock);
        $this->assertDatabaseHas('inventory_transactions', [
            'type' => InventoryTransaction::TYPE_WASTAGE,
            'notes' => 'Spoiled',
            'user_id' => $user->id
        ]);
    }
}
