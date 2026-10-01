@if(session()->has('arcgis.access_token'))

@extends('layouts.gisportaal')

@section('content')
    <div class="container-fluid gisportaalMapper p-0" id="map">
     
        <div id="controlpanel" class="controlpanel">
            <div class="resize-handle" id="resizeHandle"></div>
            <div class="row">
                <div class="col-lg-12 text-center">

                        <div class="menu-header">
                            <div class="home-btn mb-3">
                                <a href="https://gis.gkbgroep.nl/Apps/GKB-App-Gallery/index.html"  class="logo-cm"> <img src="{{ asset('storage/logo-GKB-GIS-Viewer.png') }}"  ></a>
                            </div>
                        </div>

                        <div class="menu-header">
                            <p>{{ session('arcgis.username') }}
                                <a href="#" onclick="event.preventDefault();document.getElementById('logout-form').submit();" class="logoutBTN">
                                    <span>Uitloggen</span>
                                </a>
                            <form method="POST" id="logout-form" action="{{ route('logoutAGOL') }}" style="display:none"> @csrf </form>
                           </p>
                        </div>

                        <hr>

                        <div class="menu"> 
                            <div class="group-list">
                                @forelse($groups as $group)
                                    <div class="group-item" data-group-id="{{ $group['id'] }}">
                                        <div class="group-item-header">
                                            <span>{{ $group['title'] }}</span>
                                            <i class="fas fa-chevron-down"></i>
                                        </div>
                                        <div class="group-maps"></div>
                                    </div>
                                @empty
                                    <p>Geen groepen gevonden.</p>
                                @endforelse
                            </div>
                        </div> 

                </div>
            </div>
        </div>
  
        {{-- The assistant only works with an <arcgis-map>, so this is the main map --}}
        <arcgis-map id="main-map" class="defaultMap">
            {{-- arcgis-assistant is added by map.js once a web map is loaded --}}
            <arcgis-expand id="assistantExpand" slot="top-left" expand-icon="speech-bubble" mode="floating" style="display:none"></arcgis-expand>
            <arcgis-expand slot="bottom-right" expand-icon="layers" collapse-icon="layers">
                <arcgis-layer-list id="layerList"></arcgis-layer-list>
            </arcgis-expand>
        </arcgis-map>
     
        <div class="GISAssistent">

            <button type="button" id="assistantToggle" class="assistant-toggle" aria-label="AI-assistent openen">
                <img src="{{ asset('storage/GIS_Assistent/kraai_professor_logo_transparant.svg') }}"
                     alt="Professor kraai" class="assistant-icon assistant-icon-professor">
                <img src="{{ asset('storage/GIS_Assistent/kraai_groet_transparant.svg') }}"
                     alt="Groetende kraai" class="assistant-icon assistant-icon-groet" style="display:none">
            </button>

            <div class="assistant-chat" id="assistantChat" style="display:none">
                <div class="assistant-chat-header">
                    <span>GIS Assistent</span>
                    <button type="button" class="assistant-chat-close" id="assistantChatClose" aria-label="Sluiten">&times;</button>
                </div>
                <div class="assistant-chat-messages" id="assistantChatMessages">
                    <div class="assistant-row assistant-row-bot">
                        <img src="{{ asset('storage/GIS_Assistent/kraai_professor_logo_transparant.svg') }}"
                             alt="" class="assistant-avatar">
                        <div class="assistant-msg assistant-msg-bot">Hoi! Waarmee kan ik je helpen?</div>
                    </div>
                </div>
                <form class="assistant-chat-input" id="assistantChatForm">
                    <input type="text" id="assistantChatText" placeholder="Typ je vraag..." autocomplete="off">
                    <button type="submit" aria-label="Versturen"><i class="fas fa-paper-plane"></i></button>
                </form>
            </div>

        </div>

        <div class="footer ">
    
            <div class="footer-img">
                <img src="{{ asset('storage/footer.png') }}" class="logo" />
                
            </div>
        
        </div>

    </div>


<script>
    // Pass server-side values to the external GIS Portaal scripts.
    window.GISPortaalConfig = {
        arcgisClientId: "{{ config('services.arcgis.client_id') }}",
        portalUrl: @json(rtrim(config('services.arcgis.portal'), '/')),
        arcgisToken: @json(session('arcgis.access_token')),
        arcgisUsername: @json(session('arcgis.username')),
        arcgisTokenExpires: @json(session('arcgis.expires_at') ? session('arcgis.expires_at') * 1000 : null),
        groupMapsBaseUrl: "{{ url('/gisportaal/groups') }}",
        assistantUrl: "{{ route('gisportaal.assistant') }}",
        csrfToken: "{{ csrf_token() }}"
    };
</script>

{{-- type="module" so it runs after the SDK module has defined $arcgis --}}
<script type="module" src="{{ asset('js/gisportaal/map.js') }}"></script>
<script src="{{ asset('js/gisportaal/panel.js') }}"></script>
<script src="{{ asset('js/gisportaal/index.js') }}"></script>
<script src="{{ asset('js/gisportaal/assistant.js') }}"></script>


@endsection

@else

    <a href="https://gkb.maps.arcgis.com/sharing/oauth2/authorize?client_id={{ $client_id }}&response_type=code&redirect_uri=http://localhost:3000/oauth-callback" id="sign-in" class="btn btn-primary">Inloggen AGOL</a>

@endif