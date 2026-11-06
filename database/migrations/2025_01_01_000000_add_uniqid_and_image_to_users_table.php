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
        Schema::table('users', function (Blueprint $table) {
            // Guarded: existing databases already have these columns (added before migrations were committed).
            if (! Schema::hasColumn('users', 'uniqid')) {
                $table->string('uniqid', 100)->nullable();
            }
            if (! Schema::hasColumn('users', 'image')) {
                $table->string('image', 100)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['uniqid', 'image']);
        });
    }
};
