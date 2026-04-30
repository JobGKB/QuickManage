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
                    <div class="breadcrumbs">
                         <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">

                                <li class="breadcrumb-item"><a href="/manage/folders">Mappen</a></li>
                                
                                <li class="breadcrumb-item"><a href="/manage/folders/{{ session('folder_url') }}/view">{{ session('folder_name') }}</a></li>
                                 
                                <li class="breadcrumb-item active" aria-current="page">FME app aanmaken</li>
                            </ol>
                        </nav>
                    </div>
                </div>
         </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">FME app aanmaken</h2>
                </div>  
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                    <div class="body-header-text">
                        <p class="c-bold">Vul de onderstaande velden in:</p>
                    </div>
                    <div class="create-form">
                        <form action='/manage/apps/store' method="POST" enctype="multipart/form-data">
                            @csrf
                             
                            <p class="c-bold">App details:<br/><br/>
                            <input type="text" name='name' placeholder="Naam van de app..." required><br/><br/>
                              
                            <div class="app-image mb-4">
                                <p>App afbeelding:</p> 
                                <input type='file' name='app_thumbnail' class='file' id='imgInp'>
                                <label for="imgInp"  class="file-input text-center"  >  <img src="{{ asset('/storage/gkb-groen.png') }}" id="img"> </label>
                            </div>
                        
                            <textarea name='description' placeholder="Omschrijving..." ></textarea><br/><br/>

                            <p class="c-bold">Repository:<br/><br/>

                            <select name="repo" id="repoSelect" enabled >
                                <option value="0">Selecteer een Repository:</option>
                            </select><br/><br/>

                            <p class="c-bold">Workspace:</p>

                            <select name="workspace" id="workspaceSelect" disabled >
                                <option value="0">Selecteer een Workspace:</option>
                            </select><br/><br/>

                            <p class="c-bold">Service:</p>

                            <select name="service" id="serviceSelect" disabled >
                                <option value="0">Selecteer een Service:</option>
                            </select><br/><br/>

                            <p class="c-bold">Template:</p> 

                            @foreach($templates as $data)
                          
                            {{ $data->name }}  <input type="radio" name="template" value="{{ $data->id }}" required><br/>
                            
                            @endforeach

                            <p class="c-bold mt-4">Toevoegen aan app categorie:</p> 
                            <select name="category" id="categorySelect" enabled> 
                                <option value=" ">Selecteer een app categorie:</option>
                            @foreach($categories as $data)
 
                                <option value="{{ $data->id }}">{{ $data->category_name }}</option>
 
                            @endforeach
                            </select><br/> 
                            <br/>
                            <div class="workspace_parameters_title"><div class="c-bold">Workspace parameters</div> </div> 

                            <div id="parameterContainer"></div>

                            <input type="submit" name="submit" value='Aanmaken'>
                        
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div> 
  <script type="text/javascript" src="{{ URL::asset ('js/CreateHTMLPage_Form.js') }}"></script>
    
@endsection
