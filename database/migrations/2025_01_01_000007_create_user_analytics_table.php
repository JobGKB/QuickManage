<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The unique/index keys and the page_url widening are added later by
     * 2026_06_10_000000_add_indexes_to_user_analytics_table.
     */
    public function up(): void
    {
        // Guarded: existing databases already have this table (created before migrations were committed).
        if (Schema::hasTable('user_analytics')) {
            return;
        }

        Schema::create('user_analytics', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('visitor_id', 100)->nullable();
            $table->string('active', 100)->nullable();
            $table->string('page_url', 10)->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('created_at')->nullable();
            // Mirrors the existing production schema, where updated_at is a VARCHAR.
            $table->string('updated_at', 100)->nullable();
            $table->integer('app_id')->nullable();
            $table->string('visitorName', 100)->nullable();

            $table->foreign('app_id', 'user_analytics_apps_FK')
                ->references('id')->on('apps');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_analytics');
    }
};
