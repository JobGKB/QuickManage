<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class Ontvangstloket_IWController extends Controller
{
     public function index()
    {
        
        // $var = 'TEST'; 
        // dd($apps);
        
        return view('ontvangstloket_iw.index',[
          
            
        ]);
    }
}
