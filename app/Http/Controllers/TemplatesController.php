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

        $template = new Template;
        $template->name = $request['name'];
        $template->save();

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = 'template_' . $template->id . '_dummy.' . $file->getClientOriginalExtension();
            $file->storeAs('template_images', $filename, 'public');
            $template->dummy_image = $filename;
            $template->save();
        }
 
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

        $data = Template::find($unique);
        if($request['name']){ $data->name = $request['name']; }
        if($request['background_color']){ $data->background_color = $request['background_color']; }

        if ($request->hasFile('image_thumbnail')) {
            $file = $request->file('image_thumbnail');
            $filename = 'template_' . $data->id . '_dummy.' . $file->getClientOriginalExtension();
            $file->storeAs('template_images', $filename, 'public');
            $data->dummy_image = $filename;
        }
        if ($request->hasFile('header_logo')) {
            $file = $request->file('header_logo');
            $filename = 'template_' . $data->id . '_header.' . $file->getClientOriginalExtension();
            $file->storeAs('template_images', $filename, 'public');
            $data->header_logo = $filename;
        }
        if ($request->hasFile('footer_image')) {
            $file = $request->file('footer_image');
            $filename = 'template_' . $data->id . '_footer.' . $file->getClientOriginalExtension();
            $file->storeAs('template_images', $filename, 'public');
            $data->footer_image = $filename;
        }

        $data->update();


        return back()->with('success','Template bijgewerkt!');
    }

}
