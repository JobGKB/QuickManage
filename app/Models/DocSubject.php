<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DocSubject extends Model
{
    protected $table = 'doc_subjects';

    protected $fillable = ['name', 'sort_order'];

    protected static function booted(): void
    {
        static::creating(function (DocSubject $subject) {
            $subject->uniqid ??= (string) Str::uuid();
        });
    }

    public function contents(): HasMany
    {
        return $this->hasMany(DocSubjectContent::class, 'doc_subject_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }
}
