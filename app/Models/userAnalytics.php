<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class userAnalytics extends Model
{
      protected $table = 'user_analytics';

      protected $fillable = [
            'visitor_id',
            'active',
            'page_url',
            'last_seen_at',
      ];

      protected $casts = [
            'last_seen_at' => 'datetime',
      ];
}
