<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomApp extends Model
{
     protected $table = 'custom_apps';
     public function custom_app_category()
    {
        return $this->belongsTo(AppCategorie::class, 'cat_id', 'id');
    }
}
