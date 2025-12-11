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
        Schema::create('employee_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Nullable for anonymity
            $table->foreignId('shift_id')->nullable()->constrained()->onDelete('set null'); // Optional context
            $table->enum('type', ['general', 'suggestion', 'complaint', 'shift_rating'])->default('general');
            $table->unsignedTinyInteger('rating')->nullable(); // 1-5 stars
            $table->text('comment')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->enum('status', ['pending', 'reviewed', 'actioned'])->default('pending');
            $table->text('admin_response')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
            $table->timestamps();
            
            // Index for faster querying by type/status
            $table->index(['type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_feedback');
    }
};
