<?php

namespace App\Models;

use App\Support\DocHtml;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DocSubjectContent extends Model
{
    protected $table = 'doc_subjects_content';

    protected $fillable = ['doc_subject_id', 'title', 'slug', 'content', 'sort_order'];

    protected static function booted(): void
    {
        static::creating(function (DocSubjectContent $content) {
            $content->uniqid ??= (string) Str::uuid();
        });
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(DocSubject::class, 'doc_subject_id');
    }

    /**
     * Content is cleaned when it is written, so the database never holds unsafe HTML.
     */
    protected function content(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value) => DocHtml::sanitize($value),
        );
    }

    /**
     * Content cleaned again for output. This is the only value views may print unescaped:
     * it also covers rows that were changed outside the application.
     */
    protected function safeContent(): Attribute
    {
        return Attribute::make(
            get: fn () => DocHtml::sanitize($this->content),
        );
    }

    /**
     * The title is shown as the section heading unless the content brings its own.
     */
    public function startsWithHeading(): bool
    {
        return preg_match('/^\s*<h[1-6]\b/i', (string) $this->content) === 1;
    }
}
