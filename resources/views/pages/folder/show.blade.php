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
                    <h2 class="m-0">Overzicht HTML Pagina's</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9 col-md-12">
                <div class="body-container">
                    <div class="create-item">
                        <a href="/pages/create"> <i class="fa-solid fa-plus"></i> Pagina aanmaken</a>
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
                        @foreach($pages as $page)
                        <div class="wr-row">
                            <div class="wr-col">{{$page->id}}</div> 
                            <div class="wr-col">{{$page->name}}</div> 
                            <button class="copy_btn" onclick="copyText()"><i class="fa-solid fa-copy"></i></button> 
                            <div class="wr-col"><a target="_blank" id="pageUrl" href="/pages/view/{{$page->hash_id}}">127.0.0.1:8000/page/view/{{substr($page->hash_id, 0, 10) . '...' }}</a></div> 
            
                            <div class="wr-col">{{$page->created_at}}</div> 

                            <div class="wr-col-act"> 

                                <a target="_blank" href="/pages/view/{{$page->hash_id}}"> 
                                    <i class="fa-solid fa-eye eye"></i> 
                                </a>  

                                <a href="/pages/edit/{{$page->id}}">
                                    <i class="fa-solid fa-pencil pencil"></i>
                                </a> 

                                <form action="/pages/delete/{{$page->id}}" method="POST">
                                     @csrf  @method('DELETE')
                                     <button type="submit" class="btn_delete" href="/pages/delete/{{$page->id}}">
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
         
    </div> 
@endsection

                                {{-- bootstrap modal
                                <button type="submit" class="btn_delete" data-bs-toggle="modal" data-bs-target="#staticBackdrop">
                                    <i class="fa-solid fa-trash trash"></i>
                                </button>

                                <!-- Modal -->
                                <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                                    <div class="modal-dialog">
                                        <div class="modal-content">
                                        <div class="modal-header">
                                            <h1 class="modal-title fs-5" id="staticBackdropLabel">Weet je zeker dat je {{$page->name}} wilt verwijderen?</h1>
                                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                        </div>
                                        <div class="modal-body">
                                            ...
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Sluiten</button>

                                            <form action="/pages/delete/{{$page->id}}" method="POST">
                                                @csrf  @method('DELETE')
                                                <button type="submit" class="btn_delete" href="/pages/delete/{{$page->id}}">
                                                    Verwijderen
                                                </button>
                                            </form> 

                                        </div>
                                        </div>
                                    </div>
                                </div> --}}