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
        // Guarded: existing databases already have this table (created before migrations were committed).
        if (Schema::hasTable('analytic_reports')) {
            return;
        }

        Schema::create('analytic_reports', function (Blueprint $table) {
            $table->integer('id', true);
            $table->date('date')->nullable();
            $table->integer('app_id')->nullable();
            $table->integer('views')->nullable();
            $table->dateTime('created_at')->nullable();
            $table->dateTime('updated_at')->nullable();

            $table->foreign('app_id', 'analytic_reports_apps_FK')
                ->references('id')->on('apps');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytic_reports');
    }
};
