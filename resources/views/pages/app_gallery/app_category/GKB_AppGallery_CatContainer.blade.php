@extends('layouts.GKB_AppGallery_layout')

@section('content')

 
  
    <div class="container">
      <div class="row">
        <div class="offset-lg-2 col-lg-8">
          <div class="content-wrapper">
            <!-- header -->
            <section class="header">
              <div class="container">
                <div class="row header-logo  align-items-center">

                  <div class="col-md-4 fl-l">
 
                    <a href="/app-gallery/overzicht" class="overzicht_link fl-l"> <img src="{{ asset('storage/conversie_logo.png') }}" class="conversie_logo"> Apps</a>

                  </div>

                  <div class="col-md-4 text-center">
                    <img src="{{ asset('storage/gkb-groen.png') }}" class="logo" />
                  </div>

                </div>

                

                <div class="row">
                  <div class="offset-lg-1 col-lg-10 text-center">
                   
                    <div class="header_home_screen" id="header_home_screen">


                        <h2 >{{ $category_items->category_name }}</h2>
                     
                           <br/> 
                        <p>{{ $category_items->description }}</p> 
                        
                    </div>
 
                  </div>
                </div>
              </div>
            </section>
            <!-- end header  -->

            <!-- body  -->
          

        
            


             <!--   apps -->
            <section class="body"  >
              <div class="container">
                <div class="row justify-content-center align-items-center" >

                  @foreach ($category_apps as  $data)    
                   
                    <div class="col-lg-3 text-center  mt-4">
                      <a href="/apps/view/{{ $data->hash_id }}" class="link_app">
                        <div class="app_wrapper"> 
                          <div class="app_logo">
                            <img src="data:image/png;base64,{{ $data->app_thumbnail }} " id="app_logo">
                          </div>
                          <div class="app_name ">
                            <p class="bold"> {{ $data->name }} </p>
                          </div>
                        </div>
                      </a>
                    </div>

                  @endforeach

                  @foreach ($category_custom_apps as  $data)    
                   
                    <div class="col-lg-3 text-center  mt-4">
                      <a href="{{ $data->custom_app_url }}" class="link_app" target="_blank">
                        <div class="app_wrapper"> 
                          <div class="app_logo">
                            <img src="data:image/png;base64,{{ $data->custom_app_thumbnail }} " id="app_logo">
                          </div>
                          <div class="app_name ">
                            <p class="bold"> {{ $data->name }} </p>
                          </div>
                        </div>
                      </a>
                    </div>

                  @endforeach

                  <!-- plak hieronder de code voor de apps in de toekomst -->
                </div>
              </div>
            </section>
            <!--   apps 
             
             


            <!-- footer  -->
            <section class="footer">
              <div class="containter">
                 <div class="row">
                    <div class="offset-lg-1 col-lg-10 text-center" >
                      <hr  >
                      <p class="pb-3 pt-2" ><a href="mailto:gisadmin@gkbgroep.nl" class="emailgis">gisadmin@gkbgroep.nl</a></p>
                    </div>
                </div>
              </div>
              <div class="container footer_logo">
                <div class="row">
                  <div class="col-lg-12 text-center">
                    <div class="footer-img">
                      <img src="{{ asset('storage/footer.png') }}" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <!-- end footer  -->

          </div>
        </div>
      </div>
    </div>
  

    
 
@endsection
 