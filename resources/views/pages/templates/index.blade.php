@extends('layouts.app')

@section('content')
    @include('includes.menu')

    <div class="container-fluid">
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Templates</h2>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">


                <div class="body-container" style="height:100%;">

                    <div class="create-item">
                        <a href="/template/create"><i class="fa-solid fa-plus"></i> Template aanmaken</a>  
                    </div>
                        
                    <div class="container template-wrapper">
                        <div class="row">
                        @foreach($template as $data)
                        <div class="col-lg-4"> 
                            <a href="template/edit/{{ $data->id }}">
                                <div class="template-box">
                                
                                    
                                    <img src="data:image/png;base64,{{ $data->dummy_image }}"> 
                                    <p>{!! $data->name !!}</p>
                                    
                                </div>
                            </a>
                        </div>
                        @endforeach
                            

                              
                        </div>
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
