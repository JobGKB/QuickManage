<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Folder;
use App\Models\App;

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

    public function show($id) {
        $apps = App::where('folder_id', $id)->get();
            
        session(['folder_id' => $id]);
        $folder = session('folder_id');
       

        // dd($apps);
        return view('pages.folder.show', [
            'apps' => $apps, 
            'folder' => $folder,      
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
        $map = new Folder;
        $map->folder_name = $request['folder_name'];
        $map->save();

        return back()->with('success','Map aangemaakt!');

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
