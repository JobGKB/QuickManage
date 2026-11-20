<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `page` holds the route path of tracked pages that are not in the apps table (app_id is NULL for those rows).
     */
    public function up(): void
    {
        // Guarded: existing databases already have this column (added by hand).
        if (Schema::hasColumn('analytic_reports', 'page')) {
            return;
        }

        Schema::table('analytic_reports', function (Blueprint $table) {
            $table->string('page', 255)->nullable()->after('app_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('analytic_reports', 'page')) {
            Schema::table('analytic_reports', function (Blueprint $table) {
                $table->dropColumn('page');
            });
        }
    }
};
