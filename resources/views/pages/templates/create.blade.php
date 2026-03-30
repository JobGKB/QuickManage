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
                                {{-- <li class="breadcrumb-item"><a href="#">Mappen</a></li> --}}
                                <li class="breadcrumb-item"><a href="/manage/templates">Templates</a></li>
                                <li class="breadcrumb-item active" aria-current="page">Template aanmaken</li>
                            </ol>
                        </nav>
                    </div>
                </div>
         </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Template aanmaken</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                     
                     <form action='/manage/template/store' method="POST" enctype='multipart/form-data'>
                        @csrf
                        <p class="c-bold">Template naam:</p>
                        <input type="text" name='name' placeholder="Template name..." required><br/><br/>
                        <p class="c-bold">Thumbnail afbeelding:</p>
                        <div class="template-upload-image">
                            <input type='file' name='image' class='image' id='imgInp'>
                         
                        </div>

                        <input type="submit" name="submit" value='Aanmaken'>
                        

                     </form>
                </div>
            </div>
        </div>
    </div> 
    
@endsection
