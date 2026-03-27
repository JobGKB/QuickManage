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
                    <h2 class="m-0">Profiel</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-6 col-md-12">
                 <div class="profile-wrapper pf-container mt-80">
                    <h4>Gegevens bewerken</h4>
                    <form class="profile-form" action="/manage/profile/{{Auth::user()->uniqid}}" method="POST">
                        @method('PATCH')
                        @csrf
                        <label>Naam:</label>
                        <input type='text' name="name" size=30 value="{{Auth::user()->name}}">
                        <label>Email:</label>
                        <input type='text' name="email" size=30 value="{{Auth::user()->email}}">
                        <input type='submit' name="submit" value="Opslaan" class="pf-btn">
                    </form>
                 </div>
            </div>
            <div class="col-lg-3">
                <div class="pf-container mt-80">
                        <form action="/manage/profile/{{Auth::user()->uniqid}}" method="POST" enctype='multipart/form-data'>
                        @method('PATCH')
                        @csrf
                        <div class="pf-image">
                            <input type='file' name='image' class='file' id='imgInp'>
                            <label for="imgInp"  class="file-input text-center"> @if(Auth::user()->image)<img src="data:image/png;base64,{{ Auth::user()->image }} " id="img">@else <img src="{{ asset('/storage/user-pf.png') }}" id="img"> @endif </label>
                            
                            <br> 
                        <p> Naam: {{Auth::user()->name}}</p>
                        <p> Email: {{Auth::user()->email}} </p>

                        </div>
                        <input type='submit' name="submit" value="Opslaan" class="pf-btn">
                        </form>                     
                </div>
            </div>
        </div>
         
         
    </div> 
@endsection
 