<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="csrf-token" content="{{ csrf_token() }}" />
  <title>QuickDataViewer</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js" integrity="sha512-3gJwYpMe3QewGELv8k/BX9vcqhryRdzRMxVfq6ngyWXwo03GFEzjsUm8Q7RZcHPHksttq7/GFoxjCVUjkjvPdw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.min.js" integrity="sha384-cuYeSxntonz0PPNlHhBs68uyIAVpIIOZZ5JqeqvYYIcEL727kskC66kF92t6Xl2V" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" integrity="sha384-rbsA2VBKQhggwzxH7pPCaAqO46MgnOM80zW1RWuH61DGLwZJEdK2Kadq2F9CUG65" crossorigin="anonymous">
<script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.9.2/proj4.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ol@10.8.0/dist/ol.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<script src="https://unpkg.com/shpjs@latest/dist/shp.min.js"></script>
<script src="https://unpkg.com/xlsx@latest/dist/xlsx.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@ngageoint/geopackage@4/dist/geopackage.min.js"></script>
 <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" /> 
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/solid.min.css" integrity="sha512-yDUXOUWwbHH4ggxueDnC5vJv4tmfySpVdIcN1LksGZi8W8EVZv4uKGrQc0pVf66zS7LDhFJM7Zdeow1sw1/8Jw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/fontawesome.min.css" integrity="sha512-SgaqKKxJDQ/tAUAAXzvxZz33rmn7leYDYfBP+YoMRSENhf3zJyx3SBASt/OfeQwBHA1nxMis7mM3EV/oYT6Fdw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/regular.min.css" integrity="sha512-WidMaWaNmZqjk3gDE6KBFCoDpBz9stTsTZZTeocfq/eDNkLfpakEd7qR0bPejvy/x0iT0dvzIq4IirnBtVer5A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/svg-with-js.min.css" integrity="sha512-FTnGkh+EGoZdexd/sIZYeqkXFlcV3VSscCTBwzwXv1IEN5W7/zRLf6aUBVf2Ahdgx3h/h22HNzaoeBnYT6vDlA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/brands.min.css" integrity="sha512-9YHSK59/rjvhtDcY/b+4rdnl0V4LPDWdkKceBl8ZLF5TB6745ml1AfluEU6dFWqwDw9lPvnauxFgpKvJqp7jiQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />

 <script src="https://cdn.jsdelivr.net/npm/ol-mapbox-style@9.0.0/dist/olms.js"></script>
  <!-- Google Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/x-icon" href="{{ asset('storage/fav-cm.png') }}">

  <link rel="stylesheet" href="{{ asset('css/dataviewer.css') }}" >
</head>
<body>

{{-- Scherm 1 --}}
   <div class="container fileSelectionViewer"    >
      <div class="row">
        <div class="offset-lg-2 col-lg-8">
          <div class="content-wrapper"> 
            <!-- header -->
            <section class="header">
              <div class="container">
                <div class="row header-logo  align-items-center">
                  <div class="col-md-4 fl-l">
                    <a href="/app-gallery/overzicht" class="overzicht_link fl-l"> <img src="
                      {{ asset('storage/conversie_logo.png') }}" class="conversie_logo"> Apps </a>
                  </div>
                  <div class="col-md-4 text-center">
                    <img src="{{ asset('storage/gkb-groen.png') }}" class="logo" />
                  </div>
                </div>
                <div class="row">
                  <div class="offset-lg-1 col-lg-10 text-center">
                    <br/> 
                      <h3>QuickDataViewer</h3>
                    <br/>
                    
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
                    <div id="screen-upload" class="screen active">

                      <div class="card-body">

                          <div id="drop-zone" class="drop-zone mb-4" role="button" tabindex="0" aria-label="Bestand kiezen of slepen">

                            <input type="file" id="file-input" accept=".zip,.dwg" hidden />

                            <div class="drop-icon">
                              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="8" y="40" width="48" height="16" rx="6" fill="currentColor" opacity="0.25"/>
                                <rect x="24" y="44" width="6" height="6" rx="3" fill="currentColor"/>
                                <path d="M32 8 L32 36" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
                                <path d="M20 26 L32 38 L44 26" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </div>

                            <p class="drop-label">
                              <strong>Kies een bestand</strong> of sleep het hierin.
                            </p>
                            <p class="drop-hint">Ondersteund: Shapefile (.zip) & File Geodatabase (.gdb.zip)</p>

                          </div>

                          <div id="error-box" class="error-box hidden" role="alert">
                            <span class="error-icon"></span>
                            <p id="error-msg"></p>                            
                          </div>

                          <div id="loading-overlay" class="loading-overlay hidden" aria-live="polite">
                            <p id="loading-msg"></p>
                            <span class="spinner" aria-hidden="true"></span>
                          </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>  

            <!-- end body  -->

            <!-- footer  -->
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
            <!-- end footer  -->
          </div>
        </div>
      </div>
    </div>




    {{-- Scherm 2 --}}

  <div class="container-fluid quickDataViewer p-0" id="map"   style="display:none;">
    <div class="header_dataviewer">
       <div class="header-logo-file">
          <div class="header-spacer">

            <div> <h4 id="fileName"> </h4></div>

            

            <div class="d-flex align-items-center"> 
              <!-- Address search bar -->
              <div class="address-search">
                <div class="address-search-input-wrap">
                  <i class="fa-solid fa-magnifying-glass address-search-icon"></i>
                  <input type="text" id="address-search-input" placeholder="Zoek adres..." autocomplete="off" />
                  <button id="address-search-clear" class="address-search-clear" title="Wissen">&times;</button>
                </div>
                <ul id="address-search-results" class="address-search-results"></ul>
              </div>

              <a href="/app-gallery/overzicht" class="overzicht_link_viewer fl-l"> <img src="{{ asset('storage/conversie_logo.png') }}" class="conversie_logo"> Apps </a>
            </div>

          </div>
        </div>
    </div>
    <div id="controlpanel_dataviewer" class="controlpanel_dataviewer">
      <div class="row">
        <div class="col-lg-12 text-center">
            <div class="menu-header">
              <div class="home-btn mb-3">

                
                <a href="/app-gallery/overzicht"  class="logo-cm"> <img src="{{ asset('storage/logo-GKB-GIS-Viewer.png') }}"  ></a>


              </div>
               
            </div>


          <div class="menu_dataviewer">
            

            <div id="back-drop-zone" class="back-drop-zone" role="button" tabindex="0" aria-label="Sleep bestand hier of klik om te selecteren">

              <button id="back-button"   style="width: 100%; pointer-events: none; border: none; background: none; color: inherit;"></button>

              <input type="file" id="back-file-input" accept=".zip,.dwg" hidden />
              
              <!-- Upload prompt (shown when no file loaded) -->
              <div id="back-zone-upload-prompt" class="back-zone-content">
                <p class="drop-label">
                  <strong>Kies een bestand</strong> of sleep het hierin.
                </p>
                <p class="drop-hint">Ondersteund: Shapefile (.zip) & File Geodatabase (.gdb.zip)</p>
              </div>

              <!-- Loaded file display (hidden by default) -->
              <div id="back-zone-file-display" class="back-zone-content" style="display: none;">
                <p class="loaded-file-label">📁 Geladen bestand:</p>
                <p id="back-zone-file-name" class="loaded-file-name"></p>
                <p class="back-zone-reload-hint">Klik of sleep voor nieuw bestand</p>
              </div>

              <!-- Loading indicator (always accessible, independent of upload/loaded state) -->
              <div id="back-zone-loading" class="loading-overlay hidden" aria-live="polite">
                <span id="back-zone-loading-msg"></span>
                <span class="spinner" aria-hidden="true"></span>
              </div>

              <!-- Error message for back drop zone -->
              <div id="back-zone-error" class="back-zone-error hidden" role="alert">
                <p id="back-zone-error-msg"></p>
              </div>

            </div>
            
            
            <div id="layerNamesTitle" ><div id="layerTogglerContainer" class="layerToggler" style="display: none;"></div>   <strong>Lagen geladen:</strong></div>
            <div id="layerNames" style="padding: 0px 10px 10px 10px; background: #f5f5f5; border-radius: 5px; display: none;">
              
            </div>
            


            

          </div>
        </div>
      </div>
   
        <div class="action_buttons">
          <button id="export-button" class="btn export" data-action="export"><i class="fa-solid fa-download"></i> Excel</button>
          <button id="clear-button" class="btn removeData" data-action="clear"><i class="fa-solid fa-trash"></i></button>
        </div>

    </div>
    {{-- Floating attribute table toggle button --}}
    <button id="attr-table-toggle" class="attr-table-toggle" title="Attributentabel">
      <i class="fa-solid fa-table"></i>
    </button>

    {{-- Floating zoom-to-data button (below attr-table-toggle) --}}
    <button id="layerZoomBtn" class="zoom-data-toggle" style="display:none;" title="Zoom naar data">
      <i class="fa-solid fa-house"></i>
    </button>

    {{-- Attribute table panel --}}
    <div id="attribute-table-panel" class="attribute-table-panel" style="display:none;">
      <div id="attr-table-resize-handle" class="attr-table-resize-handle"></div>
      <div class="attr-table-inner">
        <div id="attr-table-sidebar" class="attr-table-sidebar">
          <button id="attr-table-zoom-btn" class="attr-table-zoom-btn" title="Zoom naar geselecteerde features">
            <i class="fa-solid fa-location-crosshairs"></i>
          </button>
          <button id="attr-table-export-btn" class="attr-table-export-btn" title="Download als Excel">
            <i class="fa-solid fa-download"></i> Excel
          </button>
        </div>
        <div class="attr-table-main">
          <div class="attr-table-header">
            <div id="attr-table-tabs" class="attr-table-tabs"></div>
            <button id="attr-table-close-btn" class="attr-table-close-btn" title="Sluiten">&times;</button>
          </div>
          <div id="attr-table-body" class="attr-table-body"></div>
        </div>
      </div>
    </div>

    <div class="footer_dataviewer">
 
          <div class="footer-img">
            <img src="{{ asset('storage/footer.png') }}" class="logo" />
              
          </div>
       
    </div>
  </div>
   
  <script>
    // Simple initialization without modules - easier to debug
    console.log("📍 QuickDataViewer initializing...");
    
    // Wait for all external libraries to load
    function waitForDependencies(callback, timeout = 10000) {
      const start = Date.now();
      const required = {
        'proj4': () => typeof proj4 !== 'undefined',
        'ol': () => typeof ol !== 'undefined',
        'JSZip': () => typeof JSZip !== 'undefined',
        'shp': () => typeof window.shp !== 'undefined',
        'XLSX': () => typeof XLSX !== 'undefined',
        'GeoPackage': () => typeof GeoPackage !== 'undefined' && typeof GeoPackage.GeoPackageAPI !== 'undefined'
      };

      const checkDeps = setInterval(() => {
        const missing = Object.entries(required)
          .filter(([name, check]) => !check())
          .map(([name]) => name);

        if (missing.length === 0) {
          clearInterval(checkDeps);
          console.log('✓ All dependencies loaded');
          callback();
        } else if (Date.now() - start > timeout) {
          clearInterval(checkDeps);
          console.error('❌ Timeout waiting for:', missing.join(', '));
          const errorMsg = document.getElementById('error-msg');
          if (errorMsg) errorMsg.textContent = 'Failed to load required libraries: ' + missing.join(', ');
          const errorBox = document.getElementById('error-box');
          if (errorBox) errorBox.classList.remove('hidden');
        }
      }, 100);
    }

    waitForDependencies(() => {
      // Test if DOM elements exist 
      const dropZone = document.getElementById("drop-zone");
      const fileInput = document.getElementById("file-input");
      
      console.log("Checking elements:");
      console.log("- #drop-zone:", !!dropZone);
      console.log("- #file-input:", !!fileInput);
      
      if (!dropZone || !fileInput) {
        console.error("❌ Required DOM elements not found!");
        return;
      }
      
      // Now load the module
      import('/js/quickdataviewer/index.js')
        .then(() => console.log("✓ Module loaded successfully"))
        .catch(err => {
          console.error('❌ Module load error:', err);
          console.error('Full error:', err.toString());
          const errorMsg = document.getElementById('error-msg');
          if (errorMsg) errorMsg.textContent = 'Module error: ' + err.message;
          const errorBox = document.getElementById('error-box');
          if (errorBox) errorBox.classList.remove('hidden');
        });
    });
  </script>


</body>
</html>
