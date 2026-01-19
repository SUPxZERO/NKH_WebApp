<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('attendance_metrics');
        Schema::dropIfExists('daily_settlements');
        Schema::dropIfExists('employee_feedback');
        Schema::dropIfExists('inventory_order_deductions');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('payment_audit_logs');
        Schema::dropIfExists('payroll_details');
        Schema::dropIfExists('shift_swaps');
        Schema::dropIfExists('shift_templates');
        Schema::dropIfExists('stock_alerts');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('table_sessions');
        Schema::dropIfExists('time_off_balances');
        Schema::dropIfExists('user_settings');
        Schema::dropIfExists('authentication_methods');
        Schema::dropIfExists('order_holds');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tables are dropped permanently. Reconstruction would require original migrations.
    }
};
