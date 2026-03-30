<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Folder;
use Illuminate\Support\Str;
use App\Models\App;
use App\Models\CustomApp;
use App\Models\AppCategorie;

class FoldersController extends Controller
{
    public function index() 
    {  
        $folder = Folder::get();
        //redirect
        return view('pages.folder.index', [
            'folder' => $folder,       
        ]);
    }

    public function show($uniqid) {

        $folder = Folder::where('uniqid', $uniqid)->firstOrFail();
        $id = $folder->id;
        $folder_name = $folder->folder_name;
        $folder_url = $folder->uniqid;

        // dd($folder->folder_name);
        $apps = App::where('folder_id', $id)->get();
            
        session(['folder_id' => $id]);
        $folder_id = session('folder_id');

        session(['folder_name' => $folder_name]);
        $folder_name = session('folder_name');

        session(['folder_url' => $folder_url]);
        $folder_url = session('folder_url');

        $categories = AppCategorie::get();

        $custom_apps = CustomApp::where('folder_id', $id)->get();
        // dd($custom_apps);

        // dd($apps);
        return view('pages.folder.show', [
            'apps' => $apps, 
            'folder' => $folder,      
            'categories' => $categories,
            'custom_apps' => $custom_apps,
        ]);
    }

    public function create(Request $request) 
    {

        return view('pages.folder.create', [
                  
        ]);
    }
    public function store(Request $request) {

        $request->validate([
            'folder_name' => 'required',
        ]); 

        do {
            $uniqid = Str::uuid();
        } while (Folder::where('uniqid', $uniqid)->exists());

        $map = new Folder;
        $map->folder_name = $request['folder_name'];
        $map->uniqid = $uniqid;
        $map->save();

        return redirect('/manage/folders')->with('success','Map aangemaakt!');

    }
    public function delete($id)
    {
        // $id = Hash::make('1');
        $map = Folder::where('id',$id)->delete();
        
        // $apps = App::get();
        // $var = 'TEST'; 
        // dd($apps);
        return back()->with('success','Map verwijderd!');
    }
}
