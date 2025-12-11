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
        Schema::create('shift_swaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users')->onDelete('cascade'); // Who is asking
            $table->foreignId('shift_id')->constrained()->onDelete('cascade'); // The shift to be swapped/dropped
            $table->foreignId('recipient_id')->nullable()->constrained('users')->onDelete('cascade'); // Specific person asked (optional)
            $table->enum('type', ['give_away', 'trade'])->default('give_away');
            $table->enum('status', ['pending', 'accepted_by_peer', 'approved', 'rejected', 'cancelled'])->default('pending');
            $table->text('reason')->nullable();
            $table->foreignId('manager_id')->nullable()->constrained('users'); // Who approved it
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_swaps');
    }
};
