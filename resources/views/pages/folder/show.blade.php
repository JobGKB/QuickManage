@extends('layouts.app')

@section('content')
    @include('includes.menu')

        <div class="container-fluid">
            <div class="message_block">
                <div class="offset-lg-2 col-lg-9">
                    @if ($message = Session::get('success'))
                        <div id="successMessage" class="successMessage alert alert-success alert-block pt-3 text-center">  
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
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Overzicht Apps</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9 col-md-12">
                <div class="body-container">
                    <div class="create-item">
                        <a href="/manage/apps/create"  class="bc_fme"> <i class="fa-solid fa-plus"></i> FME App</a>
                        <a href="/manage/custom-apps/create" class="bc_orange" data-bs-toggle="modal" data-bs-target="#createCustomApp" > <i class="fa-solid fa-plus "></i> Custom App </a>
                    </div>
                    <div class="table-wrapper">
                        <header>
                            <div class="wr-col-th"><strong>ID</strong></div>
                            <div class="wr-col-th"><strong>Naam</strong></div>
                            <div class="wr-col-th"><strong> </strong></div>
                            <div class="wr-col-th"><strong>URL</strong></div>
                            <div class="wr-col-th"><strong>Aanmaak datum</strong></div>
                            <div class="wr-col-th"><strong>Acties</strong></div>
                        </header>
                        @foreach($apps as $app)
                        <div class="wr-row">
                            <div class="wr-col">{{$app->id}}</div> 
                            <div class="wr-col">{{$app->name}}</div> 
                            <button class="copy_btn" onclick="copyText()"><i class="fa-solid fa-copy"></i></button> 
                            <div class="wr-col"><a target="_blank" id="appUrl" href="/apps/view/{{$app->hash_id}}">127.0.0.1:8000/apps/view/{{substr($app->hash_id, 0, 10) . '...' }}</a></div> 
            
                            <div class="wr-col">{{$app->created_at}}</div> 

                            <div class="wr-col-act"> 

                                <a target="_blank" href="/apps/view/{{$app->hash_id}}"> 
                                    <i class="fa-solid fa-eye eye"></i> 
                                </a>  

                                <a href="/manage/apps/edit/{{$app->id}}">
                                    <i class="fa-solid fa-pencil pencil"></i>
                                </a> 

                                <form action="/manage/apps/delete/{{$app->id}}" method="POST">
                                     @csrf  @method('DELETE')
                                     <button type="submit" class="btn_delete" href="/manage/apps/delete/{{$app->id}}">
                                        <i class="fa-solid fa-trash trash"></i>
                                    </button>
                                </form> 

                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>


                     

                    <div class="modal fade addAppModal" id="createCustomApp" tabindex="-1" aria-labelledby="createCustomApp" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                     <h2 class="m-0">Custom app aanmaken</h2>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="container-fluid">
 
                                        <div class="row">
                                            <div class="offset-lg-1 col-lg-10">
 
                                                    <div class="wrapper-create-form-custom-app">
                                                        <form action='/manage/custom-apps/store' method="POST" enctype="multipart/form-data" class="create-form-custom-app">
                                                            @csrf
                                                            
                                                            <p class="c-bold">App details:</p> 
                                                            <input type="text" name='name' placeholder="Naam van de app..." required> 
                                                            <input type="text" name='url' placeholder="App URL | https://google.com" required> 
                                                            <textarea name='description' placeholder="Omschrijving..." ></textarea> 
                                                            
                                                            <div class=" app-image mb-4">
                                                                <p>App afbeelding:</p> 
                                                                <input type='file' name='app_thumbnail' class='file' id='imgInp'>
                                                                <label for="imgInp"  class="file-input text-center"  >  <img src="{{ asset('/storage/gkb-groen.png') }}" id="img"> </label>
                                                            </div>
                                                            
                                
                                                             
                                                        
                                                        </form>
                                                    </div>
                                                
                                            </div>
                                        </div>
                                    </div> 
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-primary" id="update_appBTN">Aanmaken</button>
                                </div>
                            </div>
                        </div>
                    </div>


         
    </div> 
@endsection

                              