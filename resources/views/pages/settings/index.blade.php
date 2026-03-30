@extends('layouts.app')

@section('content')
    @include('includes.menu')

    <div class="container-fluid">
        <div class="row">
                <div class="offset-lg-2 col-lg-9">
                    <div class="breadcrumbs">
                         <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                {{-- <li class="breadcrumb-item"><a href="#">Mappen</a></li> --}}
                                 
                                <li class="breadcrumb-item active" aria-current="page">Instellingen</li>
                            </ol>
                        </nav>
                    </div>
                </div>
         </div>
        <div class="row">
            
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Instellingen</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9 col-md-12">
                <div class="body-container">
                    <div class="create-item">
                        
                    </div>
                     <!-- #region -->
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
