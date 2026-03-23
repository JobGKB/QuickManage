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

                    <h2 class="m-0" id="categoryTitle" data-id="{{ $app_category->id }}">Overzicht categorie: <span id="categoryName">{{ $app_category->category_name }}</span></h2>
                 
                    <div class="actions-wrapper">
                        <i id="editIcon" class="fa-solid fa-pen-to-square " style="cursor:pointer;"></i>
                        <i id="saveIcon" class="fa-solid fa-check  " style="cursor:pointer; display:none; color:green;"></i>
                        <i id="cancelIcon" class="fa-solid fa-xmark " style="cursor:pointer; display:none; color:red;"></i> 
                        <form action="/app-gallery/category/delete/{{$app_category->id}}" method="POST">

                            @csrf  @method('DELETE')

                            <button type="submit" class="btn_delete"   >
                                <i class="fa-solid fa-trash trash"></i>
                            </button>

                        </form> 
                    </div>
                </div>
                
                <div class="description-container">
                    <div class="description-header">
                        <p class="m-0"><strong>Categorie beschrijving:</strong></p>
                        <div class="description-actions-wrapper">
                            <i id="descEditIcon" class="fa-solid fa-pen-to-square" style="cursor:pointer;"></i>
                            <i id="descSaveIcon" class="fa-solid fa-check" style="cursor:pointer; display:none;"></i>
                            <i id="descCancelIcon" class="fa-solid fa-xmark" style="cursor:pointer; display:none;"></i>
                        </div>
                    </div>
                    <p class="mt-2 mb-0"><span id="description-container" style="cursor:pointer;">{{ $app_category->description }}</span></p>
                </div>

            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9 col-md-12">
                <div class="body-container">
                    <div class="create-item" >
                        <a href="#" data-bs-toggle="modal" data-bs-target="#addApp" ><i class="fa-solid fa-plus"></i> App toevoegen</a>
                    </div>

                    <div class="modal fade addAppModal" id="addApp" tabindex="-1" aria-labelledby="addApp" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h1 class="modal-title fs-3" id="exampleModalLabel">App toevoegen aan: {{ $app_category->category_name }}</h1>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <div class="container">
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <div class="search">
                                                    <input type="text" id="appSearchInput" class="search-input-form" placeholder="Zoek app...">
                                                </div>

                                                <div class="appSelectionContainer">
                                                    <div class="container">
                                                         
                                                        <div class="row">

                                                            <div class="title-header mb-4">
                                                                <strong>Alle apps:</strong>                                                        
                                                            </div>

                                                            @foreach($all_apps as $app)
                                                                 
                                                                <div class="col-lg-4">
                                                                    <div class="app-badge @if($app->cat_id == $app_category->id) selected @else deselected @endif" data-app-id="{{ $app->id }}" style="cursor:pointer;">

                                                                         @if($app->page_thumbnail)<img class="img" src="data:image/png;base64,{{ $app->page_thumbnail }} " id="img">@else <img class="img" src="{{ asset('/storage/gkb-groen.png') }}" id="img"> @endif 

                                                                        <span>{{ $app->name }}</span>
                                                                        
                                                                        
                                                                        

                                                                    </div>
                                                                </div>
                                                                 
                                                            @endforeach
                                                        </div>

                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-primary" id="update_appBTN">Opslaan</button>
                                </div>
                            </div>
                        </div>
                    </div>

                     <div class="container">
                        <div class="row">
                                @foreach($apps_w_cat_id as $app)
                                <div class="col-lg-4">
                                    <div class="app-category-card">
                                        <a href="/pages/edit/{{$app->id}}">
                                            <div class="app-category-card-body">
                                                 @if($app->page_thumbnail)<img class="img" src="data:image/png;base64,{{ $app->page_thumbnail }} " id="img">@else <img class="img" src="{{ asset('/storage/gkb-groen.png') }}" id="img"> @endif 
                                                 {{$app->name}} 
                                               
                                            </div>
                                        </a>
                                    </div>
                                </div>
                                @endforeach
                        </div>
                     </div>
                    
                </div>
            </div>
        </div>
         
    </div> 
@endsection
 