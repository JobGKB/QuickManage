<?php

namespace App\Http\Controllers;
use App\Models\AppCategorie;
use App\Models\Page;
use Illuminate\Http\Request;

class AppGalleryController extends Controller
{

    //GKB_AppGallery_Page is de public page van de app gallery, deze is te bereiken zonder in te loggen. 
    // Hier kunnen gebruikers een overzicht krijgen van de apps die er zijn en kunnen ze doorklikken naar de categorieën.
    public function GKB_AppGallery_Page() 
    {   
        $app_categories = AppCategorie::all();

        return view('pages.app_gallery.GKB_AppGallery_Page', [
            'app_categories' => $app_categories
        ]);
    }





     public function index() 
    {   
        $app_categories = AppCategorie::all();
       

        return view('pages.app_gallery.index', [
            'app_categories' => $app_categories
        ]);
    }

    public function create() 
    {
        

        return view('pages.app_gallery.app_category.create_cat', [
                
        ]);
    }

      public function store(Request $request) 
    {
       
        $app_category = new AppCategorie();
        $app_category->category_name = $request['category_name'];
        $app_category->save();

        return back()->with('success','Categorie aangemaakt!');
    }


    public function show($unique) 
    {   
        $app_category = AppCategorie::where('id', $unique)->first();

        $all_apps = Page::all();

        $apps_w_cat_id = Page::where('cat_id', $app_category->id)->get();

        // dd($apps_w_cat_id);

     

        return view('pages.app_gallery.app_category.show_cat', [
            'app_category' => $app_category,
            'apps_w_cat_id' => $apps_w_cat_id,
            'all_apps' => $all_apps
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'category_name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $app_category = AppCategorie::findOrFail($id);

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


     public function destroy($id)
    {
        // $id = Hash::make('1');
        $pages = Page::where('cat_id',$id)->get();

        foreach ($pages as $page) {
            $page->cat_id = null;
             
            $page->save();
        }
         
        
        AppCategorie::where('id',$id)->delete();
       
        // $app_categories = AppCategorie::get();
        // $var = 'TEST'; 
        // dd($app_categories);
        return redirect('/app-gallery')->with('success','Categorie verwijderd!');
    }









   
     
}
