<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppCategorie extends Model
{
       // use HasFactory;
    protected $table = 'app_categories';

     public function app_categorie_app_galleries()
    {
        return $this->belongsTo(AppGallery::class, 'app_gallery_id', 'id');
    }

     public function app_categorie_pages()
    {
        return $this->belongsTo(Page::class, 'page_id', 'id');
    }

    
   
}
