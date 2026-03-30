{{-- @extends('layouts.app')
  
  
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
                    <h2 class="m-0">Custom app aanmaken</h2>
                </div>  
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                    <div class="body-header-text">
                        <p class="c-bold">Vul de onderstaande velden in:</p>
                    </div>
                    <div class="create-form">
                        <form action='/manage/custom-apps/store' method="POST" enctype="multipart/form-data">
                            @csrf
                             
                            <p class="c-bold">App details:<br/><br/>
                            <input type="text" name='name' placeholder="Naam van de app..." required><br/><br/>
                            <input type="text" name='url' placeholder="https://google.com" required><br/><br/>
                             <textarea name='description' placeholder="Omschrijving..." ></textarea><br/><br/>
                            
                            <div class="app-image mb-4">
                                <p>App afbeelding:</p> 
                                <input type='file' name='app_thumbnail' class='file' id='imgInp'>
                                <label for="imgInp"  class="file-input text-center"  >  <img src="{{ asset('/storage/gkb-groen.png') }}" id="img"> </label>
                            </div>
                             
 
                            <input type="submit" name="submit" value='Aanmaken'>
                        
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div> 
 
    
@endsection --}}
