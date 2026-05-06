<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function edit($uniqid) 
    {
        if (Auth::user()->uniqid != $uniqid) {
            abort(403);
        }

        return view('pages.profile.edit', [
               
        ]);
    }
    public function update(Request $request, $uniqid) 
    {
        if (Auth::user()->uniqid != $uniqid) {
            abort(403);
        }

        $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,gif,webp|max:2048',
        ]);

        $data = User::where('uniqid', $uniqid)->firstOrFail();
        if ($request->filled('name')) { $data->name = $request['name']; }
        if ($request->filled('email')) { $data->email = $request['email']; }
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = $uniqid . '.' . $file->getClientOriginalExtension();
            $file->storeAs('profile_images', $filename, 'public');
            $data->image = $filename;
        }
        $data->update();

        return back()->with('success', 'Profiel bijgewerkt!');
    }
}
