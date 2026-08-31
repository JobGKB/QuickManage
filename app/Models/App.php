<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class App extends Model
{
    // use HasFactory;
    protected $table = 'apps';

    // Never expose the (encrypted) workspace token when the model is serialized to JSON.
    protected $hidden = ['wsp_token'];

     public function template()
    {
        return $this->belongsTo(Template::class, 'template_id', 'id');
    }
     public function folder()
    {
        return $this->belongsTo(Folder::class, 'folder_id', 'id');
    }

     public function app_category()
    {
        return $this->belongsTo(AppCategorie::class, 'cat_id', 'id');
    }
}
