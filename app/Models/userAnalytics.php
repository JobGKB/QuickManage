<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class userAnalytics extends Model
{
      protected $table = 'user_analytics';

      protected $fillable = [
            'visitor_id',
            'visitorName',
            'active',
            'page_url',
            'last_seen_at',
      ];

      /**
       * The heartbeat pings every 5s while the visitor is active; matches the live-count window.
       */
      public const INACTIVE_AFTER_SECONDS = 10;

      protected $casts = [
            'last_seen_at' => 'datetime',
      ];

      /**
       * Set active to 0 for visitors without a heartbeat within the inactivity window.
       *
       * @return int Number of visitors marked inactive.
       */
      public static function markInactive(): int
      {
            return static::where('active', '1')
                  ->where(function ($query) {
                        $query->where('last_seen_at', '<', now()->subSeconds(self::INACTIVE_AFTER_SECONDS))
                              ->orWhereNull('last_seen_at');
                  })
                  ->update(['active' => '0']);
      }
}
