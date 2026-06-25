 
@extends('layouts.app')

@section('content')
    @include('includes.menu')

    <div class="container-fluid">
        <div class="row">
                <div class="offset-lg-2 col-lg-9">
                    <div class="breadcrumbs">
                         <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item active" aria-current="page">Dashboard</li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Welkom, {{ Auth::user()->name }}</h2>
                </div>
            </div>
        </div>
    </div>  
    
    <div class="container-fluid">
        <div class="row">

            <div class="offset-lg-2 col-lg-5 mt-5" >
              <div class='dashboard-default-box'>
                    <div class="dashboard-default-box-content">
                        <h4> Live App Gallery gebruikers </h4>
                            <div class="live_icon_wrapper">
                                <div class="live_icon"> </div>  
                                <div class="live_number" id="live-visitor-count"> 0 </div>
                                <i class="fa-solid fa-user c_red"> </i>
                            </div>
                    </div> 


                    <div class="active_apps">
                        <h4> Live app(s) die worden gebruikt  </h4>
                        
                        <span>Geen actieve apps gevonden.</span>
                    </div>


                </div>
            </div>    

            <div class=" col-lg-4 mt-5" >
                <div class='dashboard-default-box'>
                   <div class="dashboard-default-box-content">
                        <div class="dashboard-AppGallery-wrapper">
                            <a href="/app-gallery/overzicht" target="_blank">
                                <div class="AG_BTN_open">
                                    <div class="BG_BTN"> 
                                        Open App Gallery
                                    </div>
                                </div>
                                <img src="{{ asset('storage/GKB_AppGallery_IMG.png') }}" alt="App Gallery">
                            </a>  
                        </div>
                    </div> 
                </div>
            </div>
             
        </div>

        <div class="row">

            <div class="offset-lg-2 col-lg-4 mt-5">
                <div class='dashboard-default-box2'>
                    <div class="dashboard-default-box-content">
                        <p><strong>IP Address:</strong> {{ $ip }}</p>
                    </div> 
                </div>
            </div> 
           

            <div class="col-lg-5  mt-5">
                <div class='dashboard-default-box'>
                        <div class="dashboard-default-box-content fme-params">
                            <p class="fme-params-title"><strong>Usable userparameters to build an FME App:</strong></p>
                            <ul class="fme-params-list">
                                <li>
                                    <span class="fme-param-name">Datetime</span>
                                    <span class="fme-param-info" tabindex="0" aria-label="Voorbeeld Datetime">
                                        <i class="fa-solid fa-circle-info"></i>
                                        <span class="fme-param-preview">
                                            <img src="{{ asset('storage/IMG_Datetime.png') }}" alt="Datetime">
                                        </span>
                                    </span>
                                </li>
                                <li>
                                    <span class="fme-param-name">Choice | Standalone checkbox</span>
                                    <span class="fme-param-info" tabindex="0" aria-label="Voorbeeld Choice Standalone checkbox">
                                        <i class="fa-solid fa-circle-info"></i>
                                        <span class="fme-param-preview">
                                            
                                            <img src="{{ asset('storage/IMG_ChoiceStandAloneCheckbox.png') }}" alt="Choice Standalone checkbox">
                                            <p><strong>Checked value</strong>: Yes</p>
                                            <p><strong>Unchecked value</strong>: No</p>
                                        </span>
                                    </span>
                                </li>
                                <li>
                                    <span class="fme-param-name">File | Upload</span>
                                    <span class="fme-param-info" tabindex="0" aria-label="Voorbeeld File Upload">
                                        <i class="fa-solid fa-circle-info"></i>
                                        <span class="fme-param-preview">
                                            <img src="{{ asset('storage/IMG_FileUpload.png') }}" alt="File Upload">
                                        </span>
                                    </span>
                                </li>
                                <li>
                                    <span class="fme-param-name">A | Text</span>
                                    <span class="fme-param-info" tabindex="0" aria-label="Voorbeeld Text">
                                        <i class="fa-solid fa-circle-info"></i>
                                        <span class="fme-param-preview">
                                            <img src="{{ asset('storage/IMG_Textbox.png') }}" alt="Text">
                                        </span>
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

        </div>

         
    </div>
    
    <script>
    (function () {
        var el = document.getElementById('live-visitor-count');
        if (!el) {
            return;
        }

        function refreshLiveVisitors() {
            fetch('/dashboard/live-visitors', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
                .then(function (response) {
                    return response.ok ? response.json() : null;
                })
                .then(function (data) {
                    if (data && typeof data.count !== 'undefined') {
                        el.textContent = data.count;
                    }
                })
                .catch(function () { /* ignore transient errors */ });
                
                
        }

        refreshLiveVisitors();
        setInterval(refreshLiveVisitors, 3000);
        
    })();
    </script>

@endsection 


