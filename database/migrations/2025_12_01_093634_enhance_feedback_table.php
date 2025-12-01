<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            $table->unsignedTinyInteger('service_rating')->nullable()->after('rating')->comment('1-5 scale');
            $table->unsignedTinyInteger('food_rating')->nullable()->after('service_rating')->comment('1-5 scale');
            $table->unsignedTinyInteger('ambiance_rating')->nullable()->after('food_rating')->comment('1-5 scale');
            $table->text('response')->nullable()->after('comments')->comment('Restaurant response');
            $table->timestamp('responded_at')->nullable()->after('response');
            $table->unsignedBigInteger('responded_by')->nullable()->after('responded_at')->comment('FK to users');
            $table->json('tags')->nullable()->after('responded_by')->comment('Feedback categorization');
            
            $table->foreign('responded_by')->references('id')->on('users')->onDelete('set null');
            $table->index('responded_at');
        });
    }

    public function down(): void
    {
        Schema::table('feedback', function (Blueprint $table) {
            $table->dropForeign(['responded_by']);
            $table->dropIndex(['responded_at']);
            $table->dropColumn([
                'service_rating', 'food_rating', 'ambiance_rating',
                'response', 'responded_at', 'responded_by', 'tags'
            ]);
        });
    }
};
