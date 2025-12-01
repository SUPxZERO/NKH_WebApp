<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->timestamp('confirmed_at')->nullable()->after('status');
            $table->timestamp('cancelled_at')->nullable()->after('confirmed_at');
            $table->string('cancellation_reason')->nullable()->after('cancelled_at');
            $table->boolean('reminder_sent')->default(false)->after('cancellation_reason');
            
            $table->index('confirmed_at');
            $table->index(['status', 'reservation_date']);
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['confirmed_at']);
            $table->dropIndex(['status', 'reservation_date']);
            $table->dropColumn(['confirmed_at', 'cancelled_at', 'cancellation_reason', 'reminder_sent']);
        });
    }
};
