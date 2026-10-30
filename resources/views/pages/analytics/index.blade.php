@extends('layouts.app')

@section('content')
    @include('includes.menu')

    <div class="container-fluid">
         <div class="row">
                <div class="offset-lg-2 col-lg-9">
                    <div class="breadcrumbs">
                         <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item active" aria-current="page">Analytics</li>
                            </ol>
                        </nav>
                    </div>
                </div>
         </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9">
                <div class="header-container">
                    <h2 class="m-0">Analytics  </h2>
                        <span class="info-tooltip" tabindex="0"
                            aria-label="Meer informatie over templates">
                                <i class="fa-solid fa-circle-info" style="font-size: 22px;"></i>
                                <span class="info-tooltip-text" role="tooltip">
                                    Hier vindt je de analytics/data van de GKB App Gallery. 
                                </span>
                        </span>
                </div>
                 
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9 col-md-12">
                <div class="body-container">
                    <div class="analytics-container">
                        <div class="row">

                            <div class="col-lg-3">
                                <div class="an-sub-container">

                                    <p>Live Users</p>

                                    <div class="live_icon_wrapper">
                                        <div class="live_icon"> </div>  
                                        <div class="live_number" id="live-visitor-count"> 0 </div>
                                        <i class="fa-solid fa-user  "> </i>
                                    </div>

                                </div>

                            </div>

                            <div class="col-lg-3">                               
                                <div class="an-sub-container">
                                    <p>Apps</p>

                                    <div class="an-sub-container-data">
                                        <div>{{ $all_Apps }}</div>
                                    </div>


                                </div>
                            </div>

                             <div class="col-lg-3">
                                <div class="an-sub-container">
                                    <p>Categorieën</p>

                                    <div class="an-sub-container-data">
                                        <div>{{ $totaal_Categories }}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-lg-3">                               
                                <div class="an-sub-container">
                                    <p>Templates</p>

                                    <div class="an-sub-container-data">
                                        <div>{{ $totaal_Templates }}</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="row">
                            <div class="col-lg-6">
                                <div class="an-live-app-container">
                                    <h5>Live apps</h5>

                                    <div class="an-sub-live-app-container" id="live-apps">
                                        <p class="an-live-app-empty">Momenteel geen apps in gebruik...</p> 
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="offset-lg-2 col-lg-9"> 
                @if ($message = Session::get('success'))
                    <div class="successMessage alert alert-success alert-block pt-3">  
                        <strong>{{ $message }}</strong>
                    </div>
                @endif
                @if ($errors->any())
                    @foreach ($errors->all() as $error)
                        <div class="alert alert-danger alert-block pt-3">
                            <strong>{{ $error }}</strong>
                        </div>
                    @endforeach 
                @endif
            </div>
        </div>
    </div> 


     <script>
    (function () {
        var countEl = document.getElementById('live-visitor-count');
        var appsEl = document.getElementById('live-apps');

        function getJson(url) {
            return fetch(url, { credentials: 'same-origin', cache: 'no-store', headers: { 'Accept': 'application/json' } })
                .then(function (response) {
                    return response.ok ? response.json() : null;
                });
        }

        function refreshLiveVisitors() {
            getJson('/manage/analytics/live-visitors')
                .then(function (data) {
                    if (countEl && data && typeof data.count !== 'undefined') {
                        countEl.textContent = data.count;
                    }
                })
                .catch(function () { /* ignore transient errors */ });
        }

        // Built with textContent so visitor names and URLs can't inject HTML.
        function renderLiveApps(apps) {
            appsEl.replaceChildren();

            if (!apps.length) {
                var empty = document.createElement('p');
                empty.className = 'an-live-app-empty';
                empty.textContent = 'Momenteel geen apps in gebruik...';
                appsEl.appendChild(empty);
                return;
            }

            apps.forEach(function (app) {
                var item = document.createElement('div');
                item.className = 'an-live-app-item';
                item.title = app.page_url;

                var header = document.createElement('div');
                header.className = 'an-live-app-header';

                var name = document.createElement('span');
                name.className = 'an-live-app-name';
                name.textContent = app.label;

                var count = document.createElement('span');
                count.className = 'an-live-app-count';
                count.textContent = app.visitors.length;

                var visitors = document.createElement('div');
                visitors.className = 'an-live-app-visitors';
                visitors.textContent = app.visitors.join(', ');

                header.appendChild(name);
                header.appendChild(count);
                item.appendChild(header);
                item.appendChild(visitors);
                appsEl.appendChild(item);
            });
        }

        function refreshLiveApps() {
            if (!appsEl) {
                return;
            }

            getJson('/manage/analytics/live-apps')
                .then(function (data) {
                    if (data && Array.isArray(data.apps)) {
                        renderLiveApps(data.apps);
                    }
                })
                .catch(function () { /* ignore transient errors */ });
        }

        function refresh() {
            refreshLiveVisitors();
            refreshLiveApps();
        }

        refresh();
        setInterval(refresh, 3000);
    })();
    </script>
@endsection
