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
                     
                    <button onclick="goHome()"  class="overzicht_link fl-l"> <img src="conversie_logo.png" class="conversie_logo"> Apps</button>

                  </div>

                  <div class="col-md-4 text-center">
                    <img src="gkb-groen.png" class="logo" />
                  </div>

                </div>
                <div class="row">
                  <div class="offset-lg-1 col-lg-10 text-center">
                    @foreach ($app_categories as $data)
                    <div class="header_home_screen" id="header_home_screen">


                        <h2 >{{ $data->category_name }}</h2>
                     
                           <br/> 
                        <p  >Hier vind je data-conversie apps voor diverse doeleinden. Klik op button om een verzameling te openen.</p>
                        
                    </div>
                    @endforeach
                    
                    
                  </div>
                </div>
              </div>
            </section>
            <!-- end header  -->

            <!-- body  -->
             <!-- home screen -->
            <div class="home_screen" id="home_screen">
              <div class="container">
                <div class="row justify-content-center align-items-center">
                   <div class="col-lg-3 text-center">
                    @foreach ($app_categories as $data)
                    <div class="col_gisapps">
                      
                           
                     
                         <button id="{{ $data->category_name }}">{{ $data->category_name }}</button>
                        
                    </div>
                    @endforeach
                    
                     
                    </div>
                  </div>
                  
                   
                </div>
              </div>
            </div>  
            <!-- end home screen   -->

            <!-- gis apps  -->
            <section class="body" id="gisapps_screen">
              <div class="container">
              
                <div class="row justify-content-center align-items-center" >
                  <!-- start blokje GKB GIS Viewer -->
                  <div class="col-lg-3 text-center  mt-4">
                    <a href="https://gis.gkbgroep.nl/Apps/GKB-GIS-Viewer/index.html"  class="link_app">
                      <div class="app_wrapper">
                        <div class="app_logo">
                          <img src="gkb-groen.png" id="app_logo" />
                        </div>
                        <div class="app_name  ">
                          <p class="bold">GIS Viewer (beta)</p>
                        </div>
                      </div>
                    </a>
                  </div>
                  <!-- eind blokje GKB GIS Viewer -->

                  <!-- plak hieronder de code voor de apps in de toekomst -->
                </div>
              </div>
            </section>


             <!-- administratie apps -->
            <section class="body"  id="administratie_screen">
              <div class="container">
                 
                <div class="row justify-content-center align-items-center" >
                  <!-- start blokje PBA-IW-Conversie -->
                  <div class="col-lg-3 text-center  mt-4">
                    <a href="https://gis.gkbgroep.nl/portaal/Integratie/PBA-IW-Conversie/index.html" class="link_app">
                      <div class="app_wrapper">
                        <div class="app_logo">
                          <img src="PBA-IW-Conversie_logo.png " id="app_logo" />
                        </div>
                        <div class="app_name ">
                          <p class="bold"> PBA-IW-Conversie </p>
                        </div>
                      </div>
                    </a>
                  </div>
                  <!-- eind blokje PBA-IW-Conversie -->

                  <!-- start blokje PBA-FMUTA6-Conversie -->
                  <div class="col-lg-3 text-center  mt-4">
                    <a href="https://gis.gkbgroep.nl/Apps/PBA-FMUTA6-Conversie/index.html" class="link_app">
                      <div class="app_wrapper">
                        <div class="app_logo">
                          <img src="PBA-FMUTA6-Conversie_logo.png" id="app_logo" />
                        </div>
                        <div class="app_name  ">
                          <p class="bold">PBA-FMUTA6-Conversie</p>
                        </div>
                      </div>
                    </a>
                  </div>
                  <!-- eind blokje PBA-FMUTA6-Conversie -->

                  <!-- start blokje RDAM Substraten Overzicht -->
                  <div class="col-lg-3 text-center  mt-4">
                    <a href="https://gis.gkbgroep.nl/portaal/Integratie/RDAM-Substraten-Overzicht/index.html"  class="link_app">
                      <div class="app_wrapper">
                        <div class="app_logo">
                          <img src="RDAM-Substraten-Overzicht_logo.png" id="app_logo" />
                        </div>
                        <div class="app_name  ">
                          <p class="bold">RDAM Substraten Overzicht</p>
                        </div>
                      </div>
                    </a>
                  </div>
                  <!-- eind blokje RDAM Substraten Overzicht -->
  
              

                  <!-- plak hieronder de code voor de apps in de toekomst -->
                </div>
              </div>
            </section>
            <!-- end administratie apps 
             
            <!-- projecten apps  -->
            <section class="body" id="projecten_screen">
              <div class="container">
                <div class="row justify-content-center align-items-center" >
                    
                  <!-- start blokje WSHD ConvertUitpeiling -->
                  <div class="col-lg-6 text-center  mt-4">
                    <a href="https://gis.gkbgroep.nl/Apps/WSHD_ConvertUitpeiling/index.html"  class="link_app">
                      <div class="app_wrapper">
                        <div class="app_logo">
                          <img src="wshd.png" id="app_logo" />
                        </div>
                        <div class="app_name  ">
                          <p class="bold">WSHD ConvertUitpeiling</p>
                        </div>
                      </div>
                    </a>
                  </div>
                  <!-- eind blokje WSHD ConvertUitpeiling -->
                  
                  <!-- start blokje IW-ABS-CSV-Downloaden -->
                   <div class="col-lg-6 text-center  mt-4">
                    <a href="https://gis.gkbgroep.nl/Apps/IW-ABS-CSV-Downloaden/index.html"  class="link_app">
                      <div class="app_wrapper">
                        <div class="app_logo">
                          <img src="IW-ABS_CSV_Downloaden.png" id="app_logo" />
                        </div>
                        <div class="app_name  ">
                          <p class="bold">IW-ABS-CSV-Downloaden</p>
                        </div>
                      </div>
                    </a>
                  </div>
                  <!-- eind blokje IW-ABS-CSV-Downloaden -->


                  <!-- plak hieronder de code voor de apps in de toekomst -->
                </div>
              </div>
            </section>


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
                      <img src="footer.png" />
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
 