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
                                <li class="breadcrumb-item"><a href="/manage/folders">Mappen</a></li>
                                <li class="breadcrumb-item active" aria-current="page">Map aanmaken</li>
                            </ol>
                        </nav>
                    </div>
                </div>
         </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Map aanmaken</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                    <div class="body-header-text">
                        <p>Vul de onderstaande veld(en) in:</p>
                    </div>
                     <form action='/manage/folders/store' method="POST">
                        @csrf
                         
                        <input type="text" name='folder_name' placeholder="Mapnaam..." required><br/><br/>
                       

                        <input type="submit" name="submit" value='Aanmaken'>
                        

                     </form>
                </div>
                      
            </div>
        </div>
    </div> 
    
    
@endsection
