<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticReport extends Model
{
    protected $table = 'analytic_reports';

    /**
     * Pages that are not in the apps table, keyed by route path (stored in `page`) with their display name.
     */
    public const TRACKED_PAGES = [
        'manage/quickdataviewer'          => 'QuickDataViewer',
        'PBA-FMUTA6-VerwerkWeekIndexatie' => 'PBA - Verwerk week indexatie',
        'Ontvangstloket-IW'               => 'Ontvangstloket IW',
        'FmeRunDynamicURL'                => 'FME Run Dynamic URL',
    ];

    protected $fillable = [
        'date',
        'app_id',
        'page',
        'views',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function app()
    {
        return $this->belongsTo(App::class, 'app_id', 'id');
    }

    /**
     * Display name: the app name, or the tracked page's name.
     */
    public function getLabelAttribute(): string
    {
        if ($this->app_id !== null) {
            return $this->app->name ?? 'Verwijderde app';
        }

        return self::TRACKED_PAGES[$this->page] ?? '/' . $this->page;
    }
}
