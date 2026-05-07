@extends('layouts.GKB_Realisatie_Page')
  
  
@section('content')
     

    <div class="container">
      <div class="row">
        <div class="offset-lg-2 col-lg-8">
          <div class="content-wrapper"> 
            <!-- header -->
            <section class="header">
              <div class="container">
                <div class="row header-logo align-items-center">
                   <div class="col-md-4 fl-l">
                     
                    <a href="/app-gallery/overzicht" class="overzicht_link fl-l"> <img src="{{ asset('storage/conversie_logo.png') }}" class="conversie_logo"> Apps</a>

                  </div> 

                  <div class="col-md-4 text-center">
                    <img src="{{ asset('storage/template_images/' . $data->template->header_logo) }}" class="logo" />
                  </div>
                </div>
                
                <div class="row">
                  <div class="offset-lg-1 col-lg-10 text-center">
                    <br/> 
                      <h3>{{ $data->name }}</h3>
                    <br/>
                      <p>{!! $data->description !!} </p>
                  </div>
                </div>
              </div>
            </section>
            <!-- end header  -->

            <!-- body  -->
            <section class="body">
              <div class="container">
                <div class="row">
                  <div class="col-lg-12 text-center">

                    <form class="form" method="GET" >
                      @csrf
                      @if($data->template->name == 'Default FME Workflow')

                      {{-- Hier komt het formulier --}}
                      <div id='GKB_Form_Template'></div>

                      <div class="mess1">
                      <span id="mess1">Bezig met laden...</span>
                          <div id="loading" class="loading">
                              <img src="{{ asset('storage/loading.png') }}" />
                            </div>
                          </div>
                          <div class="message2">
                            <span id="mess2"></span>
                          </div>
                          <div class="message3">
                          <span id="errorMessage"></span>
                      </div>

                      <div class="input-wrap-sumbit">
                           
                          <input class=" input-form submit" type="submit" id="myForm" name="submit" value="Start conversie"   onclick="handleFormSubmit(event)">  
                          
                      </div> <br/>

                      {{-- iframe for datastreaming --}}
                      <iframe id="fmeFrame" style="width: 100%; height: 600px; border: 1px solid #ccc; display: none;"></iframe>

                     @else

                     @endif
                      

                    </form>

                    
                  {{-- </div> 
                </div>sdf
              </div> --}}
            </section>  

            <!-- end body  -->

            <!-- footer  -->
            <section class="footer">
              <div class="container">
                <div class="row">
                  <div class="col-lg-12 text-center">
                    <div class="footer-img">
                      <img src="{{ asset('storage/template_images/' . $data->template->footer_image) }}" />
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

      <script>
        window.templateChoice = @json($data);
      </script>
      
  <script type="text/javascript" src="{{ URL::asset ('js/HTMLPage/displayHTMLpage.js') }}"></script>
    
@endsection