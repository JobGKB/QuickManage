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
        if (Schema::hasTable('folders')) {
            return;
        }

        Schema::create('folders', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('folder_name', 100)->nullable();
            $table->timestamps();
            $table->string('uniqid', 100)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('folders');
    }
};
