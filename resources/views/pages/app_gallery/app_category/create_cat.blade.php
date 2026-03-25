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
                    <h2 class="m-0">App categorie aanmaken</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="body-container">
                    <div class="body-header-text">
                        <p>Vul de onderstaande veld(en) in:</p>
                    </div>
                     <form action='/manage/app-gallery/category/store' method="POST">
                        @csrf
                         
                        <input type="text" name='category_name' placeholder="Categorie naam..." required><br/><br/>
                        <textarea name='category_description' placeholder="Geef deze categorie een beschrijving..."></textarea><br/><br/>
                        <input type="hidden" name='gallery_id'  value="1" required><br/><br/>

                        <input type="submit" name="submit" value='Aanmaken'>
                        

                     </form>
                </div>
                      
            </div>
        </div>
    </div> 
    
    
@endsection
