<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class Ontvangstloket_IWController extends Controller
{
     public function index()
    {
        $data = json_decode(file_get_contents(public_path('js/ontvangstloket_iw/app_settings.json')), true);    

        // dd($data);

        return view('ontvangstloket_iw.index', [
            'data' => $data,
        ]);
    }
}
