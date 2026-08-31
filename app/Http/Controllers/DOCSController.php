<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DOCSController extends Controller
{
    public function index() 
    {  
      
        //redirect
        return view('documentation.index', [
                 
        ]);
    }
}
