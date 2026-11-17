 @extends('layouts.fme_running_custom_workspace')
  
  
@section('content')
     
    <div class="container">
      <div class="row">
        <div class="offset-lg-1 col-lg-10">
          <div class="content-wrapper">
            <section class="header">
               <div class="container">
                 <div class="row header-logo align-items-center">

                    <div class="col-md-4 fl-l">
                        <a href="/app-gallery/overzicht" class="overzicht_link fl-l"> <img src="{{ asset('storage/conversie_logo.png') }}" class="conversie_logo"> Apps</a>
                    </div> 

                    <div class="col-md-4 text-center">
                        <img src="{{ asset('storage/gkb-groen.png') }}" class="logo" />
                    </div>

                 </div>
               </div>
            </section>

            <section class="body">
              <div class="container">
                <div class="row">
                  <div class="col-lg-12 text-center" >
                   <div id="mess"></div> 
                  </div>
                </div>
                <div class="row">
                  <div class="col-lg-12 text-center">
                    <div class="mess1">
                      <span id="mess1">Bezig met laden...</span>
                        <div id="loading" class="loading">
                          <img src="{{ asset('storage/loading.png') }}" class="logo" />
                        </div>
                    </div>
                    <div class="message2">
                      <span id="mess2">Uw export is klaar!</span>
                    </div>
                    <div class="message3">
                      <span id="errorMessage"></span>
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-lg-12">
                    {{-- fmedatastreaming HTML is written in here (runner.js). Sandboxed without allow-same-origin,
                         so the streamed page cannot touch QuickManage or its session. --}}
                    <iframe id="resultFrame" class="result-frame" title="Resultaat van de workspace"
                            ></iframe>
                  </div>
                </div>
              </div>
            </section>

            <section class="footer">
              <div class="container">
                <div class="row">
                  <div class="col-lg-12 text-center">
                    <div class="footer-img">
                      <img src="{{ asset('storage/footer.png') }}" class="logo" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>

@endsection


 
