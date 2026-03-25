@extends('layouts.app')

@section('content')
    @include('includes.menu')

    <div class="container-fluid">
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Mappen overzicht</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9 col-md-12">
                <div class="body-container">
                    <div class="create-item">
                        <a href="/manage/folder/create"><i class="fa-solid fa-plus"></i> Map aanmaken</a>
                    </div>
                     <div class="cat-wrapper">
                        @foreach($folder as $data)
                            <div class="map"><a href="/manage/folders/view/{{$data->id}}"><i class="fa-solid fa-folder"></i> {{$data->folder_name}}</a>   </div>
                        @endforeach
                     </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9"> 
                @if ($message = Session::get('success'))
                    <div class="successMessage alert alert-success alert-block pt-3">  
                        <strong>{{ $message }}</strong>
                    </div>
                @endif
                @if ($errors->any())
                    @foreach ($errors->all() as $error)
                        <div class="alert alert-danger alert-block pt-3">
                            <strong>{{ $error }}</strong>
                        </div>
                    @endforeach 
                @endif
            </div>
        </div>
    </div> 
@endsection
