@extends('layouts.GKB_AppGallery_layout')
  
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
                    <img src="{{ asset('storage/gkb-groen.png') }}" class="logo" />
                  </div>
                </div>
                
                <div class="row">
                  <div class="offset-lg-1 col-lg-10 text-center">
                    <br/> 
                      <h3>PBA-FMUTA6 Indexatie tarieven beheren</h3>
                    <br/>
                      <p>Wekelijkse indexatiepercentages per productgroep</p>
                  </div>
                </div>
              </div>
            </section>
            <!-- end header  -->

            <!-- body  -->
            <section class="body  "   >
              <div class="container">
                <div class="row">
                  <div class="col-lg-12 text-center">

                      <div class="d-flex justify-content-between   mt-3 action-wrapper">
                         
                          <div><button class="btn_add " data-bs-toggle="modal" data-bs-target="#addIndexation"><i class="fa-solid fa-plus"></i> Indexatie Week</button>
                          <a href="https://fme-gkb.fmecloud.com/fmedatastreaming/Administratie/PBA_FMUTA6_DonwloadIndexatieBestand.fmw?DestDataset_FILECOPY=c%3A%5Ctemp&token=5867261962a1a4543639d8f384bb173ac9efa0ed" class="text-decoration-none download-excel  "><i class="fa-solid fa-download"></i> Excel</a>  <br/>
                          </div>
                          <div><button id="toggle-edit" class="btn_edit" onclick="toggleEdit()"><i class="fa-solid fa-pen-to-square"></i> Indexatie</button></div>

                        
                      </div>
                      
                      <div class="table-wrapper">
                        
                        <div id="indexatie-table"></div>
                      </div>
 

                      <div class="d-flex justify-content-between mb-3 mt-3">
                        <div></div>
                        <button class="submit" data-bs-toggle="modal" data-bs-target="#saveWarning"  >Opslaan</button>
                      </div>
      <!-- <button class="submit" onclick="saveData()">Opslaan</button> -->
                  </div>
                </div>
              </div>
              
    
           
             <div class="modal fade" id="saveWarning" tabindex="-1" aria-labelledby="saveWarningLabel" aria-hidden="true">
                  <div class="modal-dialog">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h1 class="modal-title fs-5 c-red" id="saveWarningLabel">Weet u zeker dat u de wijzigingen wilt opslaan?</h1>
                      </div>
                      <div class="modal-body">
                        <p>Door op <strong>"Opslaan"</strong> te klikken, worden alle wijzigingen permanent opgeslagen en de tabel bijgewerkt.</p>
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn_cancel" data-bs-dismiss="modal">Annuleren</button>
                        <button type="button" class="submit" onclick="saveData()">Opslaan</button>
                      </div>
                    </div>
                  </div>
                </div> 



                <div class="modal fade" id="addIndexation" tabindex="-1" aria-labelledby="addIndexationLabel" aria-hidden="true">
                  <div class="modal-dialog">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h1 class="modal-title fs-5" id="addIndexationLabel">Nieuwe indexatie week toevoegen</h1>
                      </div>
                      <div class="modal-body">

                        

                        <div class="form" id="newIndexationRow"></div>
                      </div>
                      <div class="modal-footer">
                        <button type="button" class="btn_cancel" data-bs-dismiss="modal">Annuleren</button>
                        <button type="button" class="submit" onclick="newIndexationRow();">Toevoegen</button>
                      </div>
                    </div>
                  </div>
                </div> 


            </section> 

            <!-- end body  -->

            <!-- footer  -->
              <section class="footer" style="margin-top:0px !important;">
                 
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
    </div>
  
     

@endsection