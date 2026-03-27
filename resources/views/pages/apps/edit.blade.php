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
                    <h2 class="m-0">App: {{ $app->name }} bewerken</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                     
                    <div class="edit-form">
                        <form action='/manage/apps/update/{{$app->hash_id}}' method="POST" enctype="multipart/form-data">
                            @method('PATCH')
                            @csrf    
                            <p class="c-bold">App naam:</p>
                            <input type="text" name='name' value="{{ $app->name }}" required><br/><br/>
                            <div class="app-image mb-4">
                                <p>App afbeelding:</p> 
                                <input type='file' name='app_thumbnail' class='file' id='imgInp'>
                                <label for="imgInp"  class="file-input text-center"  >   @if($app->app_thumbnail)<img src="data:image/png;base64,{{ $app->app_thumbnail }} " id="img">@else <img src="{{ asset('/storage/gkb-groen.png') }}" id="img"> @endif   </label>
                            </div>
                            <p class="c-bold">Omschrijving:</p> 
                            <textarea name='description' >{{ $app->description }}</textarea><br/><br/>

                            <p class="c-bold mt-4">App categorie: {{  $app->app_category->category_name ?? 'geen' }}</p> 
                                <select name="category" id="categorySelect" enabled> 
                                    <option value="{{ $app->app_category->id ?? ' ' }}">{{  $app->app_category->category_name ?? 'Selecteer een categorie' }}</option>
                                @foreach($categories as $data)
    
                                    <option value="{{ $data->id }}"  >{{ $data->category_name }}</option>   
    
                                @endforeach
                                </select><br/> 
                                <br/>


                            <p class="c-bold">Repository:<br/><br/>

                            <input type="text" name='repo' value='{{ $app->repository }}' disabled><br/><br/>

                            <p class="c-bold">Workspace:</p>

                            <input type="text" name='workspace' value='{{ $app->workspace }}' disabled><br/><br/>

                            <p class="c-bold">Service:</p>

                            <input type="text" name='service' value='{{ $app->service }}' disabled><br/><br/>

                            <p class="c-bold">Template:</p> 
                                    
                            <input type="text" name='template' value='{{ $app->template->name ?? 'geen' }}' disabled ><br/><br/>
        

                            {{-- <div class="workspace_parameters_title"><div class="c-bold">Workspace parameters</div><div class="show_in_app c-bold">Laten zien in App</div></div>  --}}
                                

                            {{-- <textarea class="textarea-content-page" name="content" placeholder="Content van de pagina..." required>{{$app->content}}</textarea><br/><br> 
                                <div  type="text" id='addfield' onclick=addField()><i class="fa fa-plus"></i></div> 
                                    <div  type="text" id='removefield' onclick=removeField()><i class="fa fa-minus"></i></div>
                                <div id="formfield"></div>
                            <br> --}}
                            <input type="submit" name="submit" value='Opslaan'>
                        </form>
                    </div>
                </div>
                        
            </div>
        </div>
    </div> 
    
    
@endsection