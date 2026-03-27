<?php

namespace App\Http\Controllers;
use Illuminate\Support\Str;
use App\Models\AppCategorie;
use App\Models\App;
use App\Models\CustomApp;
use App\Models\AppGallery;
use Illuminate\Http\Request;

class AppGalleryController extends Controller
{

    //GKB_AppGallery_Container is de public page van de app gallery, deze is te bereiken zonder in te loggen. 
    // Hier kunnen gebruikers een overzicht krijgen van de apps die er zijn en kunnen ze doorklikken naar de categorieën.
    public function GKB_AppGallery_Container() 
    {   

        $app_gallery_items  = AppGallery::first();
        // dd($app_gallery_items);
        $app_categories = AppCategorie::all();

        return view('pages.app_gallery.GKB_AppGallery_Container', [
            'app_categories' => $app_categories,
            'app_gallery_items' => $app_gallery_items

        ]);
    }

    public function GKB_AppGallery_CatContainer($uniqid) 
    {   
        $category_items = AppCategorie::where('uniqid', $uniqid)->first();

        $category_apps = App::where('cat_id', $category_items->id)->get();


         
        $category_custom_apps = CustomApp::where('cat_id', $category_items->id)->get();


        // dd($category_apps);

        return view('pages.app_gallery.app_category.GKB_AppGallery_CatContainer', [
            'category_items' => $category_items,
            'category_apps' => $category_apps,
            'category_custom_apps' => $category_custom_apps

        ]);
    }







     public function index() 
    {   
        $app_categories = AppCategorie::all();
       

        return view('pages.app_gallery.index', [
            'app_categories' => $app_categories
        ]);
    }

    public function createCat() 
    {
        

        return view('pages.app_gallery.app_category.create_cat', [
                
        ]);
    }

      public function storeCat(Request $request) 
    {
        $request->validate([
            'category_name' => 'required|string|max:255',
            'category_description' => 'nullable|string|max:1000',
            'gallery_id' => 'required|integer|exists:app_galleries,id',
        ]);

        do {
            $uniqid = Str::random(12);
        } while (AppCategorie::where('uniqid', $uniqid)->exists());

        $app_category = new AppCategorie();
        $app_category->category_name = $request['category_name'];
        $app_category->description = $request['category_description'];
        $app_category->app_gallery_id = $request['gallery_id'];
        $app_category->uniqid = $uniqid;
        $app_category->save();

        return back()->with('success','Categorie aangemaakt!');
    }


    public function showCat($uniqid) 
    {   
        $app_category = AppCategorie::where('uniqid', $uniqid)->first();

        $fme_apps = App::all();
        $custom_apps = CustomApp::all();

        $apps_w_cat_id = App::where('cat_id', $app_category->id)->get();
        $custom_apps_w_cat_id = CustomApp::where('cat_id', $app_category->id)->get();
    
        // dd($apps_w_cat_id);

     

        return view('pages.app_gallery.app_category.show_cat', [
            'app_category' => $app_category,
            'apps_w_cat_id' => $apps_w_cat_id,
            'custom_apps_w_cat_id' => $custom_apps_w_cat_id,
            'fme_apps' => $fme_apps,
            'custom_apps' => $custom_apps

        ]);
    }

    public function updateCat(Request $request, $uniqid)
    {
        $request->validate([
            'category_name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $app_category = AppCategorie::where('uniqid', $uniqid)->firstOrFail();
        // dd($app_category);
        if ($request->has('category_name')) {
            $app_category->category_name = $request->category_name;
        }
        if ($request->has('description')) {
            $app_category->description = $request->description;
        }

        $app_category->save();

        return response()->json([
            'category_name' => $app_category->category_name,
            'description' => $app_category->description,
        ]);
    }


     public function destroyCat($uniqid)
    {
        // $id = Hash::make('1');
        $app_category = AppCategorie::where('uniqid', $uniqid)->firstOrFail();
        $apps = App::where('cat_id', $app_category->id)->get();
        $custom_apps = CustomApp::where('cat_id', $app_category->id)->get();

        foreach ($apps as $app) {
            $app->cat_id = null;
             
            $app->save();
        }

        foreach ($custom_apps as $custom_app) {
            $custom_app->cat_id = null;

            $custom_app->save();
        }
        
        AppCategorie::where('id',$app_category->id)->delete();
       
        // $app_categories = AppCategorie::get();
        // $var = 'TEST'; 
        // dd($app_categories);
        return redirect('/manage/app-gallery')->with('success','Categorie verwijderd!');
    }









   
     
}
