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
        if (Schema::hasTable('app_categories')) {
            return;
        }

        Schema::create('app_categories', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('category_name', 100)->nullable();
            $table->timestamps();
            $table->text('description')->nullable();
            $table->integer('app_gallery_id')->nullable();
            $table->string('uniqid', 100);

            $table->foreign('app_gallery_id', 'app_categories_app_galleries_FK')
                ->references('id')->on('app_galleries');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_categories');
    }
};
