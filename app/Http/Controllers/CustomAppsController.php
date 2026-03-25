<?php

namespace App\Http\Controllers;


use App\Models\CustomApp;
use Illuminate\Http\Request;

class CustomAppsController extends Controller
{
    public function create() 
    {   
         

        
       

        return view('pages.custom_apps.create', [
             

        ]);
    }

    public function store() 
    {   
         

       

        // dd($category_apps);

        return back()->with('success','App aangemaakt!');
    }


}
