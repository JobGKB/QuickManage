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
                    <img src="data:image/png;base64, {{ $data->template->header_logo }}" class="logo" />
                  </div>
                </div>
                
                <div class="row">
                  <div class="offset-lg-1 col-lg-10 text-center">
                    <br/> 
                      <h3>{{ $data->name }}</h3>
                    <br/>
                      <p>{{ $data->description }} </p>
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
                      @if($data->template->name == 'GKB Form template')

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

                     @else

                     @endif
                      {{-- @if($data->template->name =='GKB Form template') 
                        <p>GKB FORM Style</p>

                          @foreach ( $DBparameters as $html)

                            @if($html->field_type == 'STRING')

                            <div class="input-wrap">
                              <label class="" id="label_email"> {{$html->parameter_name}}*: </label>
                              <input class="input-form" type="text" name="{{ $html->parameter_name }}" id="email" class="input_email"  > 
                            </div>

                            @endif

                             @if($html->field_type == 'FILE_OR_URL')

                            <div class="input-wrap">
                              <label class="" id="label_factuur"> {{$html->parameter_name}}*: <span class="file-name mb-3" id="file-name1">Alleen ( .xlsx ) bestand toegestaan</span></label>
                                <input id="file1"  class="position-absolute invisible" type="file" multiple accept=".xls,.xlsx" />
                              <label class="btn btn-upload mb-3 file-btn text-center" for="file1" id="label_file1">Selecteer hier uw bestand</label> <br/>    
                            </div>

                            @endif

                          @endforeach

                      @elseif($data->template->name == 'GKB Rapport template') 
                        <p>gkb rapport</p>

                      @endif --}}
                       
                       <!--
                        <div class="input-wrap">
                            <label class="" id="label_csv"> Naam CSV bestand (zonder extensie)*: </label>
                            <input class="input-form" type="text" name="csv" id="csv" class="input_csv"  value="PBA-IW">
                        </div>
                        <div class="input-wrap">
                            <label class="" id="label_factuur"> Factuurregel bestand*: <span class="file-name mb-3" id="file-name1">Alleen ( .xlsx ) bestand toegestaan</span></label>
                            <input id="file1"  class="position-absolute invisible" type="file" multiple accept=".xls,.xlsx" />
                            <label class="btn btn-upload mb-3 file-btn text-center" for="file1" id="label_file1">Selecteer hier uw bestand</label> <br/>    
                        </div>
                        <div class="input-wrap">
                          <label class="" id="label_bonbestand"> Bonregel bestand*: <span class="file-name mb-3" id="file-name2">Alleen ( .xlsx ) bestand toegestaan</span></label>
                          <input id="file2"  class="position-absolute invisible" type="file" multiple accept=".xls,.xlsx" />
                          <label class="btn btn-upload mb-3 file-btn text-center" for="file2" id="label_file2">Selecteer hier uw bestand</label> <br/>    
                        </div> -->

                     
                          <!-- <div class="mess1">
                            <span id="mess1">Bezig met laden...</span>
                            <div id="loading" class="loading">
                              <img src="loading.png" />
                            </div>
                          </div>
                          <div class="message2">
                            <span id="mess2"></span>
                          </div>
                          <div class="message3">
                            <span id="errorMessage"></span>
                          </div>
                        <!-- end loading  -->

                    </form>

                    
                  {{-- </div>x b
                </div>
              </div>--}}
            </section>  

            <!-- end body  -->

            <!-- footer  -->
            <section class="footer">
              <div class="container">
                <div class="row">
                  <div class="col-lg-12 text-center">
                    <div class="footer-img">
                      <img src="data:image/png;base64,{{ $data->template->footer_image }}" />
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
      
  <script type="text/javascript" src="{{ URL::asset ('js/displayHTMLpage.js') }}"></script>
    
@endsection