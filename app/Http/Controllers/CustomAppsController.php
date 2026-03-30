<?php

namespace App\Http\Controllers;

use App\Models\CustomApp;
use Illuminate\Support\Str;
 
use App\Models\AppCategorie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class CustomAppsController extends Controller
{
    public function create() 
    {   
         
 
        return view('pages.custom_apps.create', [
             

        ]);
    }

    public function store(Request $request) 
    {   
        // Validate input
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url',
            'description' => 'nullable|string',
            'category' => 'nullable|integer',
            'app_thumbnail' => 'nullable|image|max:2048',
        ]);
        
        // Generate unique hash_id

        do {
            $uniqid = Str::uuid();
        } while (CustomApp::where('uniqid', $uniqid)->exists());
         
        
        $app = new CustomApp();
        $app->name = $request['name'];
        $app->description = $request['description'] ?? '';
        $app->custom_app_url = $request['url'];
        $app->folder_id = session('folder_id');
        $app->cat_id = $request['category'] ?? null;
        $app->uniqid = $uniqid;
         
        if ($request->hasFile('app_thumbnail')) { 
            $app->custom_app_thumbnail = base64_encode(file_get_contents($request->file('app_thumbnail'))); 
        }
        
        $app->save();

        // Return JSON response for AJAX
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'App aangemaakt!',
                'app' => $app
            ], 201);
        }
        
        // Redirect for form submit
        return back()->with('success','App aangemaakt!');
    }


    public function edit($uniqid) 
    {
        $custom_app = CustomApp::with('custom_app_category')
        ->where('uniqid', $uniqid)
        ->first();

        $categories = AppCategorie::get();

        // dd($custom_app);

        //redirect
        return view('pages.custom_apps.edit', [
            'custom_app' => $custom_app,       
            'categories' => $categories,
        ]);
    }

    public function update(Request $req, $uniqid) 
    {
        // dd($req->input());
        $custom_app = CustomApp::where('uniqid', $uniqid)->firstOrFail();
        $custom_app->name = $req->input('name');
        $custom_app->custom_app_url = $req->input('url');
       
        $custom_app->description = $req->input('description');
        $custom_app->cat_id = $req->input('category');
 
        if ($req->hasFile('app_thumbnail')) {

             $custom_app->custom_app_thumbnail = base64_encode(file_get_contents($req->file('app_thumbnail'))); 

             }

        $custom_app->save();
        //redirect
        return back()->with('success','App bijgewerkt!');
    }

    public function updateCategoryCustomApps(Request $request, $uniqid)
    {
        $request->validate([
            'custom_app_ids' => ' ',
            'custom_app_ids.*' => ' ',
        ]);

        $category = AppCategorie::where('uniqid', $uniqid)->firstOrFail();
        $selectedIds = $request->input('custom_app_ids', []);

        // Remove cat_id from apps that were in this category but are now deselected
        CustomApp::where('cat_id', $category->id)
            ->whereNotIn('id', $selectedIds)
            ->update(['cat_id' => null]);

        // Assign cat_id to newly selected apps
        if (!empty($selectedIds)) {
            CustomApp::whereIn('id', $selectedIds)
                ->update(['cat_id' => $category->id]);
        }

        return response()->json(['success' => true]);
    }


      public function destroy($uniqid)
    {
        // $id = Hash::make('1');
         
        $app = CustomApp::where('uniqid',$uniqid)->delete();
       
        // $apps = App::get();
        // $var = 'TEST'; 
        // dd($apps);
        return back()->with('success','App verwijderd!');
    }


}
