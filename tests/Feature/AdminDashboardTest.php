<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentStatus;
use Carbon\Carbon;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Setup Admin User
        $this->adminUser = User::factory()->create();
        $role = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Administrator', 'description' => 'System Administrator']
        );
        $this->adminUser->roles()->attach($role);
    }

    public function test_admin_can_view_dashboard()
    {
        $response = $this->actingAs($this->adminUser)->get(route('admin.dashboard'));
        $response->assertStatus(200);
    }

    public function test_dashboard_data_endpoint_returns_json()
    {
        $response = $this->actingAs($this->adminUser)->getJson(route('admin.dashboard.data', [
            'start_date' => Carbon::now()->subDays(7)->toDateString(),
            'end_date' => Carbon::now()->toDateString()
        ]));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'kpis' => ['total_revenue', 'total_orders', 'avg_order_value'],
                'revenue',
                'order_status',
                'top_items'
            ]);
    }

    public function test_sales_report_pdf_download()
    {
        $response = $this->actingAs($this->adminUser)->get(route('admin.reports.sales.pdf'));
        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }
}
