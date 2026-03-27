<?php

namespace App\Http\Controllers;
use Illuminate\Support\Str;
use App\Models\App;
use App\Models\AppCategorie;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
 
use Hashids\Hashids;

class AppsController extends Controller
{
    public function index()
    {
        $apps = App::get();
        // $var = 'TEST'; 
        // dd($apps);
        
        return view('pages.apps.index',[
            'apps' => $apps,
            
        ]);
    }

    public function create()
    {
        // $obj = "1";
        // $id = Hashids::encode($obj);
        // $hashids = new Hashids();       
        // dd($numb2);
        // $code = $date+" "+$text; 
        // $time = date("m-d-Y H:i:s:");
        // $id = $hashids->encode(23); // o2fXhV
        // $numbers = $hashids->decode($id); // [1, 2, 3]
        // $apps = App::get();
        // $var = 'TEST'; 

         $templates = Template::get();
         $categories = AppCategorie::get();

        return view('pages.apps.create',[
            'templates' => $templates,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request) 
    {

        $allData = $request->all();
      
    // Separate parameter_* fields
        do {
            $uniqid = Str::uuid();
        } while (App::where('hash_id', $uniqid)->exists());

        
        $app = new App();
        $app->name = $request['name'];
        $app->description = $request['description'];
        $app->template_id = $request['template'];
        $app->repository = $request['repo'];
        $app->workspace = $request['workspace'];
        $app->service = $request['service'];
        $app->folder_id = session('folder_id');
        $app->cat_id = $request['category'];
        $app->hash_id = $uniqid;
       
        if ($request->hasFile('app_thumbnail')) { $app->app_thumbnail = base64_encode(file_get_contents($request->file('app_thumbnail'))); }
        $app->save();

 
      
        // //redirect
        return back()->with('success','App aangemaakt!');
    }

    public function show($unique) 
    {
        $data = App::with('template')
        ->where('hash_id', $unique)
        ->first();

         
        // dd($DBparameters);
         
        // dd($data);   

        //redirect
        return view('html_templates.GKB_Realisatie_Style', [
                 'data'=> $data,
                 
                //  'DBparameters'=> $DBparameters
        ]);
    }

    public function edit($uniqid) 
    {
        $app = App::with('template','folder','app_category')
        ->where('hash_id', $uniqid)
        ->first();
        $categories = AppCategorie::get();
     


        // dd($app);

        //redirect
        return view('pages.apps.edit', [
            'app' => $app,       
            'categories' => $categories,
        ]);
    }

    public function update(Request $req, $uniqid) 
    {
        // dd($req->input());
        $app = App::where('hash_id', $uniqid)->firstOrFail();
        $app->name = $req->input('name');
       
        $app->description = $req->input('description');
        $app->cat_id = $req->input('category');

     

        if ($req->hasFile('app_thumbnail')) {

             $app->app_thumbnail = base64_encode(file_get_contents($req->file('app_thumbnail'))); 

             }

        $app->save();
        //redirect
        return back()->with('success','App bijgewerkt!');
    }

    public function updateCategoryApps(Request $request, $uniqid)
    {
        $request->validate([
            'app_ids' => ' ',
            'app_ids.*' => ' ',
        ]);

        $category = AppCategorie::where('uniqid', $uniqid)->firstOrFail();
        $selectedIds = $request->input('app_ids', []);

        // Remove cat_id from apps that were in this category but are now deselected
        App::where('cat_id', $category->id)
            ->whereNotIn('id', $selectedIds)
            ->update(['cat_id' => null]);

        // Assign cat_id to newly selected apps
        if (!empty($selectedIds)) {
            App::whereIn('id', $selectedIds)
                ->update(['cat_id' => $category->id]);
        }

        return response()->json(['success' => true]);
    }

    public function destroy($uniqid)
    {
        // $id = Hash::make('1');
         
        $app = App::where('hash_id',$uniqid)->delete();
       
        // $apps = App::get();
        // $var = 'TEST'; 
        // dd($apps);
        return back()->with('success','App verwijderd!');
    }
}
