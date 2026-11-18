<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doc_subjects_content', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doc_subject_id')->constrained('doc_subjects')->cascadeOnDelete();
            $table->uuid('uniqid')->unique();
            $table->string('title', 150);
            // Anchor in the documentation URL (/docs#slug).
            $table->string('slug', 160)->unique();
            $table->longText('content')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doc_subjects_content');
    }
};
