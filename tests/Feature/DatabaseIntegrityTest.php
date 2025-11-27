<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DatabaseIntegrityTest extends TestCase
{
    use RefreshDatabase;
    /** @test */
    public function customer_requests_table_does_not_exist()
    {
        $this->assertFalse(
            Schema::hasTable('customer_requests'),
            'customer_requests table should be deleted after consolidation'
        );
    }

    /** @test */
    public function orders_table_has_approval_columns()
    {
        $this->assertTrue(Schema::hasColumn('orders', 'approval_status'));
        $this->assertTrue(Schema::hasColumn('orders', 'approved_by'));
        $this->assertTrue(Schema::hasColumn('orders', 'approved_at'));
        $this->assertTrue(Schema::hasColumn('orders', 'rejection_reason'));
        $this->assertTrue(Schema::hasColumn('orders', 'is_auto_approved'));
    }

    /** @test */
    public function customer_request_model_does_not_exist()
    {
        $this->assertFalse(
            file_exists(app_path('Models/CustomerRequest.php')),
            'CustomerRequest model file should be deleted'
        );
    }

    /** @test */
    public function customer_request_controller_does_not_exist()
    {
        $this->assertFalse(
            file_exists(app_path('Http/Controllers/Api/CustomerRequestController.php')),
            'CustomerRequestController (API) file should be deleted'
        );

        $this->assertFalse(
            file_exists(app_path('Http/Controllers/Admin/CustomerRequestController.php')),
            'CustomerRequestController (Admin) file should be deleted'
        );
    }
}
