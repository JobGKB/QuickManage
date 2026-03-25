<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Template;


class TemplatesController extends Controller
{

    public function index()
    {
       
        $template = Template::get();

        // dd($template);
        return view('pages.templates.index',[
            'template' => $template,
        ]);
    }

    public function create(Request $request) 
    {

        return view('pages.templates.create', [
                  
        ]);
    }
    public function store(Request $request) {

        $request->validate([
            'name' => 'required|unique:templates,name',
            'image' => 'nullable|image|mimes:jpeg,png,gif,webp|max:2048',
        ]);
        // dd($request['image']);
        if($request['image']) {
        $image = base64_encode(file_get_contents($request->file('image')));
       
          
        } 
        else {
            $image = '';
        }
        $template = new Template;
        $template->name = $request['name'];
        if($request['image']){ $template->dummy_image = base64_encode(file_get_contents($request->file('image'))) ;}else{ }
        $template->save();
 
        return back()->with('success','Template aangemaakt!');

    }
    public function edit(Request $request,$unique) 
    {
        $template = Template::where('id', $unique)
        ->first();

         

        return view('pages.templates.edit', [
                'template'=>$template,  
        ]);
    }

    public function update(Request $request,$unique) 
    {

        
        $request->validate([
            'name' => 'required',
            'image_thumbnail' => 'nullable|image|mimes:jpeg,png,gif,webp|max:2048',
            'header_logo' => 'nullable|image|mimes:jpeg,png,gif,webp|max:2048',
            'footer_image' => 'nullable|image|mimes:jpeg,png,gif,webp|max:2048',
            'background_color' => 'nullable|string|regex:/^#[0-9a-fA-F]{3,6}$/',
        ]);

        if($request['image_thumbnail']) {$image_thumbnail = base64_encode(file_get_contents($request->file('image_thumbnail')));} else {$image_thumbnail= '';}
        if($request['header_logo']) {$header_logo = base64_encode(file_get_contents($request->file('header_logo')));} else {$header_logo = '';}
        if($request['footer_image']) {$footer_image = base64_encode(file_get_contents($request->file('footer_image')));} else {$footer_image = '';}
 
        $data = Template::find($unique);
        if($request['name']){ $data->name = $request['name'] ;}else{ }
        if($request['background_color']){ $data->background_color = $request['background_color'] ;}else{ }
        if($request['image_thumbnail']){ $data->dummy_image = base64_encode(file_get_contents($request->file('image_thumbnail'))) ;}else{ }
        if($request['header_logo']){ $data->header_logo = base64_encode(file_get_contents($request->file('header_logo'))) ;}else{ }
        if($request['footer_image']){ $data->footer_image = base64_encode(file_get_contents($request->file('footer_image'))) ;}else{ }
        $data->update();


        return back()->with('success','Template bijgewerkt!');
    }

}
