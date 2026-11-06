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
                    <div class="edit-form">

                        <form method="POST" action="/manage/settings/update">
                            @csrf
                            @method('PATCH')
                            <div class="form-group">
                                <label for="title" class="pt-3"><strong>App Gallery | Titel:</strong></label>
                                <input type="text" id="title" name="title" value="{{ $title }}" class="form-control">

                                <label for="omschrijving" class="pt-3"><strong>App Gallery | Omschrijving:</strong></label>
                                <textarea class="form-control" id="omschrijving" name="omschrijving">{{ $omschrijving }}</textarea>

                                <label for="footer_text" class="pt-3"><strong>App Gallery | Footer tekst:</strong></label>
                                <textarea class="form-control" id="footer_text" name="footer_text">{{ $footer_text }}</textarea>
                            </div>
                            <input type="submit" name="submit" value='Opslaan'>
                        </form>
                        
                    </div>
                     <!-- #region -->
                </div>
            </div>
        </div>
         
    </div> 
@endsection
