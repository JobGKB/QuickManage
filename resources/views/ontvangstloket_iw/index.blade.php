<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script type="text/javascript" src="{{ URL::asset ('js/ontvangstloket_iw/main.js') }}" defer></script>
    
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
     
    <title>{{  'GKB Ontvangstloket' }}</title>
 
    <!-- Fonts -->
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link href="https://fonts.bunny.net/css?family=Nunito" rel="stylesheet">
 
    <link rel="stylesheet" href="{{ asset('css/ontvangstloket_iw.css') }}" >

    <!-- Scripts -->
    
    <script src="https://js.arcgis.com/4.28/"></script>
   
            
    
</head>
<body class="content">  

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
                      <h3>Ontvangstloket</h3>
                    <br/>
                      <p>Importeer hier je bestanden</p>
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

                    <form class="form" method="GET" enctype="multipart/form-data">
                      @csrf

                      {{-- Hier komt het formulier --}}
                      <div id='GKB_Form_Template'></div>

                        <div class="input-wrap">
                          <label for="leveranciers">Leveranciers*</label>
                          <select id="leveranciers" name="leveranciers" class="input-form">
                            <option value="">-- Selecteer een leverancier --</option>
                            <option value="test1">test1</option>
                            <option value="test2">test2</option>
                            <option value="test3">test3</option>
                            <option value="test4">test4</option>
                          </select>
                        </div>

                        <div class="input-wrap">
                          <label for="excelFile_req">Excel-bestand (.xlsx)*</label>
                          <label id="excelFile_label" for="excelFile_req" class="btn btn-upload mb-3 file-btn text-center w-100">Selecteer hier uw bestand</label>
                          <input type="file" id="excelFile_req" name="excelFile"
                                 accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                 class="position-absolute invisible"
                                 onchange="document.getElementById('excelFile_label').textContent = this.files[0] ? this.files[0].name : 'Selecteer hier uw bestand';">
                        </div>

                      

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
                        <input class="input-form submit" type="submit" id="myForm" name="submit" value="Start conversie" onclick="handleFormSubmit(event)">
                      </div> <br/>

                      {{-- iframe for datastreaming --}}
                      <iframe id="fmeFrame" style="width: 100%; height: 600px; border: 1px solid #ccc; display: none;"></iframe>

                    </form>
 
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
 
     
    

</footer>

</html>