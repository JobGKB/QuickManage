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
        if (Schema::hasTable('custom_apps')) {
            return;
        }

        Schema::create('custom_apps', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('name', 100)->nullable();
            $table->text('description')->nullable();
            $table->text('custom_app_url')->nullable();
            $table->timestamp('created_at')->nullable();
            // Mirrors the existing production schema, where updated_at is a VARCHAR.
            $table->string('updated_at', 100)->nullable();
            $table->integer('cat_id')->nullable();
            $table->integer('folder_id')->nullable();
            $table->string('uniqid', 100)->nullable();
            $table->string('custom_app_thumbnail', 100)->nullable();

            $table->foreign('cat_id', 'custom_apps_app_categories_FK')
                ->references('id')->on('app_categories');
            $table->foreign('folder_id', 'custom_apps_folders_FK')
                ->references('id')->on('folders');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_apps');
    }
};
