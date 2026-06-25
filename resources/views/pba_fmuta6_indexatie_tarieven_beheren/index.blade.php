<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script type="text/javascript" src="{{ URL::asset ('js/PBA_FMUTA6/main.js') }}" defer></script>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js" integrity="sha512-3gJwYpMe3QewGELv8k/BX9vcqhryRdzRMxVfq6ngyWXwo03GFEzjsUm8Q7RZcHPHksttq7/GFoxjCVUjkjvPdw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.min.js" integrity="sha384-cuYeSxntonz0PPNlHhBs68uyIAVpIIOZZ5JqeqvYYIcEL727kskC66kF92t6Xl2V" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" /> 
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/solid.min.css" integrity="sha512-yDUXOUWwbHH4ggxueDnC5vJv4tmfySpVdIcN1LksGZi8W8EVZv4uKGrQc0pVf66zS7LDhFJM7Zdeow1sw1/8Jw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/fontawesome.min.css" integrity="sha512-SgaqKKxJDQ/tAUAAXzvxZz33rmn7leYDYfBP+YoMRSENhf3zJyx3SBASt/OfeQwBHA1nxMis7mM3EV/oYT6Fdw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/regular.min.css" integrity="sha512-WidMaWaNmZqjk3gDE6KBFCoDpBz9stTsTZZTeocfq/eDNkLfpakEd7qR0bPejvy/x0iT0dvzIq4IirnBtVer5A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/svg-with-js.min.css" integrity="sha512-FTnGkh+EGoZdexd/sIZYeqkXFlcV3VSscCTBwzwXv1IEN5W7/zRLf6aUBVf2Ahdgx3h/h22HNzaoeBnYT6vDlA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/brands.min.css" integrity="sha512-9YHSK59/rjvhtDcY/b+4rdnl0V4LPDWdkKceBl8ZLF5TB6745ml1AfluEU6dFWqwDw9lPvnauxFgpKvJqp7jiQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://js.arcgis.com/4.28/esri/themes/light/main.css">
    
 
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js" integrity="sha384-vFJXuSJphROIrBnz7yo7oB41mKfc8JzQZiCq4NCceLEaO4IHwicKwpJf9c9IpFgh" crossorigin="anonymous"></script>

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="icon" type="image/x-icon" href="{{ asset('storage/fav-cm.png') }}">
     
    <title>{{  'GKB App Gallery' }}</title>
 
    <!-- Fonts -->
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link href="https://fonts.bunny.net/css?family=Nunito" rel="stylesheet">
 
    <link rel="stylesheet" href="{{ asset('css/PBA_FMUTA6.css') }}" >

    <!-- Scripts -->
    
    <script src="https://js.arcgis.com/4.28/"></script>
   
            
    
</head>
<body class="content" onload="getData()"> 

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
  
  
     

</body>
<footer>
 
  <script src="/js/visitor-heartbeat.js"></script>
    

</footer>
</html>