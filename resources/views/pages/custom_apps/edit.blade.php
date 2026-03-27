@extends('layouts.app')

@section('content')
    @include('includes.menu')
    <div class="message_block">
        <div class="offset-lg-2 col-lg-9">
            @if ($message = Session::get('success'))
                <div class="successMessage alert alert-success alert-block pt-3 text-center">  
                    <strong>{{ $message }}</strong>
                </div>
            @endif

            @if ($errors->any())
            @foreach ($errors->all() as $error)
                <div class="alert alert-danger alert-block pt-3 text-center">
                    <strong>{{ $error }}</strong>
                </div>
            @endforeach
            @endif
        </div>
    </div>

    
    <div class="container-fluid">
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Custom App: {{ $custom_app->name }} bewerken</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                   
                    <div class="edit-form">
                        <form action='/manage/custom-apps/update/{{$custom_app->uniqid}}' method="POST" enctype="multipart/form-data">
                            @method('PATCH')
                            @csrf    
                            <p class="c-bold">App naam:</p>
                            <input type="text" name='name' value="{{ $custom_app->name }}" required><br/><br/>
                            <input type="text" name='url' value="{{ $custom_app->custom_app_url }}" required><br/><br/>
                            <div class="app-image mb-4">
                                <p>App afbeelding:</p> 
                                <input type='file' name='app_thumbnail' class='file' id='imgInp'>
                                <label for="imgInp"  class="file-input text-center"  >   @if($custom_app->custom_app_thumbnail)<img src="data:image/png;base64,{{ $custom_app->custom_app_thumbnail }} " id="img">@else <img src="{{ asset('/storage/gkb-groen.png') }}" id="img"> @endif   </label>
                            </div>
                            <p class="c-bold">Omschrijving:</p> 
                            <textarea name='description' >{{ $custom_app->description }}</textarea><br/><br/>

                            <p class="c-bold mt-4">App categorie: {{  $custom_app->custom_app_category->category_name ?? 'geen' }}</p> 
                                <select name="category" id="categorySelect" enabled> 
                                    <option value="{{ $custom_app->custom_app_category->id ?? ' ' }}">{{  $custom_app->custom_app_category->category_name ?? 'Selecteer een categorie' }}</option>
                                @foreach($categories as $data)
    
                                    <option value="{{ $data->id }}"  >{{ $data->category_name }}</option>
    
                                @endforeach
                                </select><br/> 
                                <br/>
 
        
 
                            <input type="submit" name="submit" value='Opslaan'>
                        </form>
                    </div>
                </div>
                        
            </div>
        </div>
    </div> 
    
    
@endsection