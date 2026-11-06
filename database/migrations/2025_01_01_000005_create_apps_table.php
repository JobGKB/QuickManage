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
        if (Schema::hasTable('apps')) {
            return;
        }

        Schema::create('apps', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('name', 100)->nullable();
            $table->text('description')->nullable();
            $table->integer('template_id')->nullable();
            $table->string('repository', 100)->nullable();
            $table->string('workspace', 100)->nullable();
            $table->string('service', 100)->nullable();
            $table->integer('folder_id')->nullable();
            $table->text('hash_id')->nullable();
            $table->timestamps();
            $table->integer('cat_id')->nullable();
            $table->string('app_thumbnail', 100)->nullable();
            $table->text('wsp_token')->nullable();

            $table->foreign('cat_id', 'apps_app_categories_FK')
                ->references('id')->on('app_categories');
            $table->foreign('folder_id', 'apps_folders_FK')
                ->references('id')->on('folders')
                ->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreign('template_id', 'apps_templates_FK')
                ->references('id')->on('templates');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('apps');
    }
};
