<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalyticReport extends Model
{
    protected $table = 'analytic_reports';

    protected $fillable = [
        'date',
        'app_id',
        'views',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function app()
    {
        return $this->belongsTo(App::class, 'app_id', 'id');
    }
}
