<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\OrderCalculationService;
use App\Models\Category;
use App\Models\Location;
use App\Models\Setting;
use App\Models\MenuItem;
use App\Models\Promotion;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class OrderCalculationServiceTest extends TestCase
{
    use DatabaseTransactions;

    protected OrderCalculationService $service;
    protected int $locationId;
    protected int $categoryId;

    protected function setUp(): void
    {
        parent::setUp();
        // dump(config('database.default')); 
        // dump(config('database.connections.'.config('database.default').'.database'));
        
        $this->service = new OrderCalculationService();
        
        // Create location
        try {
            $location = Location::factory()->create();
        } catch (\Throwable $e) {
            $location = Location::create([
                'name' => 'Test Location ' . Str::random(5),
                'address' => '123 Test St',
                'phone' => '1234567890',
                'is_active' => true,
            ]);
        }
        $this->locationId = $location->id;

        // Create category
        $category = Category::first();
        if (!$category) {
            try {
               $category = Category::create([
                   'name' => 'Test Category',
                   'slug' => 'test-category-' . Str::random(5),
                   'display_order' => 1,
                   'is_active' => true,
                   // 'location_id' => $this->locationId, // Assuming category might not be location specific or nullable
               ]); 
            } catch (\Exception $e) {
                // If location_id is required
                 $category = Category::create([
                   'name' => 'Test Category',
                   'slug' => 'test-category-' . Str::random(5),
                   'display_order' => 1,
                   'is_active' => true,
                   'location_id' => $this->locationId, 
               ]); 
            }
        }
        $this->categoryId = $category->id;
        
        // Seed settings
        Setting::create(['location_id' => $this->locationId, 'key' => 'tax_rate', 'value' => 0.10]);
        Setting::create(['location_id' => $this->locationId, 'key' => 'delivery_fee', 'value' => 5.00]);
    }

    protected function createMenuItem(float $price): MenuItem
    {
        return MenuItem::create([
            'location_id' => $this->locationId,
            'category_id' => $this->categoryId,
            'name' => 'Item ' . Str::random(5),
            'sku' => 'SKU-' . Str::random(8),
            'slug' => 'item-' . Str::random(8),
            'price' => $price,
            'cost' => $price * 0.5,
            'is_active' => true,
            'display_order' => 1,
            // 'availability_status' => 'available' // Removed to rely on default
        ]);
    }

    public function test_calculate_basic_totals()
    {
        $item1 = $this->createMenuItem(10.00);
        $item2 = $this->createMenuItem(20.00);

        $items = [
            ['menu_item_id' => $item1->id, 'quantity' => 2], // 20.00
            ['menu_item_id' => $item2->id, 'quantity' => 1], // 20.00
        ];

        $result = $this->service->calculate($items, $this->locationId);

        $this->assertEquals(40.00, $result['subtotal']);
        $this->assertEquals(0.00, $result['discount_amount']);
        $this->assertEquals(4.00, $result['tax_amount']); // 10%
        $this->assertEquals(0.00, $result['delivery_fee']); 
        $this->assertEquals(44.00, $result['total_amount']);
    }

    public function test_calculate_with_delivery()
    {
        $item = $this->createMenuItem(30.00);

        $items = [
            ['menu_item_id' => $item->id, 'quantity' => 1],
        ];

        $result = $this->service->calculate($items, $this->locationId, null, null, null, 'delivery');

        $this->assertEquals(30.00, $result['subtotal']);
        $this->assertEquals(5.00, $result['delivery_fee']);
        $this->assertEquals(3.00, $result['tax_amount']);
        $this->assertEquals(38.00, $result['total_amount']);
    }

    public function test_calculate_with_fixed_discount()
    {
        $item = $this->createMenuItem(50.00);
        
        Promotion::create([
            'location_id' => $this->locationId,
            'code' => 'SAVE10',
            'name' => 'Save 10',
            'type' => 'fixed',
            'value' => 10.00,
            'is_active' => true,
        ]);

        $items = [
            ['menu_item_id' => $item->id, 'quantity' => 1],
        ];

        $result = $this->service->calculate($items, $this->locationId, 'SAVE10');

        $this->assertEquals(50.00, $result['subtotal']);
        $this->assertEquals(10.00, $result['discount_amount']);
        $this->assertEquals(4.00, $result['tax_amount']); // 10% of (50 - 10)
        $this->assertEquals(44.00, $result['total_amount']);
    }

    public function test_calculate_throws_exception_for_invalid_promotion()
    {
        $item = $this->createMenuItem(10.00);
        $items = [['menu_item_id' => $item->id, 'quantity' => 1]];

        $this->expectException(ValidationException::class);
        $this->service->calculate($items, $this->locationId, 'INVALIDCODE');
    }

    public function test_calculate_respects_minimum_promotion_amount()
    {
        Promotion::create([
            'location_id' => $this->locationId,
            'code' => 'MIN50',
            'name' => 'Min 50',
            'type' => 'fixed',
            'value' => 5.00,
            'min_order_amount' => 50.00,
            'is_active' => true,
        ]);

        $item = $this->createMenuItem(20.00);
        $items = [['menu_item_id' => $item->id, 'quantity' => 1]];

        $this->expectException(ValidationException::class);
        $this->service->calculate($items, $this->locationId, 'MIN50');
    }
}
