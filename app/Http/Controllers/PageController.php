<?php

namespace App\Http\Controllers;
use Illuminate\Support\Str;
use App\Models\Page;
use App\Models\AppCategorie;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
 
use Hashids\Hashids;

class PageController extends Controller
{
    public function index()
    {
        $pages = Page::get();
        // $var = 'TEST'; 
        // dd($pages);
        
        return view('pages.pages.index',[
            'pages' => $pages,
            
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
        // $pages = Page::get();
        // $var = 'TEST'; 

         $templates = Template::get();
         $categories = AppCategorie::get();

        return view('pages.pages.create',[
            'templates' => $templates,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request) 
    {

        $allData = $request->all();
      
    // Separate parameter_* fields
        $unique = Str::random(64);
        
        $page = new Page();
        $page->name = $request['name'];
        $page->description = $request['description'];
        $page->template_id = $request['template'];
        $page->repository = $request['repo'];
        $page->workspace = $request['workspace'];
        $page->service = $request['service'];
        $page->folder_id = session('folder_id');
        $page->cat_id = $request['category'];
        $page->hash_id = $unique;
       
        if ($request->hasFile('page_thumbnail')) { $page->page_thumbnail = base64_encode(file_get_contents($request->file('page_thumbnail'))); }
        $page->save();

 
      
        // //redirect
        return back()->with('success','Pagina aangemaakt!');
    }

    public function show($unique) 
    {
        $data = Page::with('template')
        ->where('hash_id', $unique)
        ->first();

        // $DBparameters = WorkspaceParameter::where('page_id', $data->id)->get();

        // dd($DBparameters);
         
        // dd($data);   

        //redirect
        return view('html_templates.GKB_Realisatie_Style', [
                 'data'=> $data,
                 
                //  'DBparameters'=> $DBparameters
        ]);
    }

    public function edit($id) 
    {
        $page = Page::with('template','folder','app_category')
        ->where('id', $id)
        ->first();
        $categories = AppCategorie::get();
     


        // dd($page);

        //redirect
        return view('pages.pages.edit', [
            'page' => $page,       
            'categories' => $categories,
        ]);
    }

    public function update(Request $req, $id) 
    {
        // dd($req->input());
        $page = Page::find($id);
        $page->name = $req->input('name');
       
        $page->description = $req->input('description');
        $page->cat_id = $req->input('category');

     

        if ($req->hasFile('page_thumbnail')) {

             $page->page_thumbnail = base64_encode(file_get_contents($req->file('page_thumbnail'))); 

             }

        $page->save();
        //redirect
        return back()->with('success','Pagina bijgewerkt!');
    }

    public function updateCategoryApps(Request $request, $id)
    {
        $request->validate([
            'app_ids' => 'present|array',
            'app_ids.*' => 'integer|exists:pages,id',
        ]);

        $category = AppCategorie::findOrFail($id);
        $selectedIds = $request->input('app_ids', []);

        // Remove cat_id from pages that were in this category but are now deselected
        Page::where('cat_id', $category->id)
            ->whereNotIn('id', $selectedIds)
            ->update(['cat_id' => null]);

        // Assign cat_id to newly selected pages
        if (!empty($selectedIds)) {
            Page::whereIn('id', $selectedIds)
                ->update(['cat_id' => $category->id]);
        }

        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        // $id = Hash::make('1');
         
        $page = Page::where('id',$id)->delete();
       
        // $pages = Page::get();
        // $var = 'TEST'; 
        // dd($pages);
        return back()->with('success','Pagina verwijderd!');
    }
}
