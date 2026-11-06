<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
 
use App\Models\AppGallery;

class SettingsController extends Controller
{
      public function index() 
    {
         
        $appGalleries = AppGallery::where('id', '1')->firstOrFail();

        $title = $appGalleries->name ?? '';                 
        $omschrijving = $appGalleries->description ?? '';   
        $footer = $appGalleries->footer_text ?? '';
 
        return view('pages.settings.index', [
              'title' => $title,
              'omschrijving' => $omschrijving,
              'footer_text' => $footer,

        ]);
    }
    public function update(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'omschrijving' => 'required|string|max:255',
            'footer_text' => 'required|string|max:255',
        ]);

        $appGallery = AppGallery::where('id', '1')->firstOrFail();
        $appGallery->name = $request->input('title');
        $appGallery->description = $request->input('omschrijving');
        $appGallery->footer_text = $request->input('footer_text');
        $appGallery->save();

        return back()->with('success', 'Instellingen bijgewerkt!');
    }
}
