<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Widen page_url so full route paths (e.g. PBA-FMUTA6-VerwerkWeekIndexatie) fit.
        DB::statement('ALTER TABLE user_analytics MODIFY page_url VARCHAR(255) NULL');

        Schema::table('user_analytics', function (Blueprint $table) {
            // One row per visitor; prevents race-condition duplicates on updateOrCreate.
            $table->unique('visitor_id');
            // The live-count query filters on this every few seconds.
            $table->index('last_seen_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_analytics', function (Blueprint $table) {
            $table->dropUnique(['visitor_id']);
            $table->dropIndex(['last_seen_at']);
        });

        DB::statement('ALTER TABLE user_analytics MODIFY page_url VARCHAR(10) NULL');
    }
};
