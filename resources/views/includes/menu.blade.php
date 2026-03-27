<div class="menu">
        <div class="menu-wrapper">
            <div class="hamburger-icon" ><a onclick="closeMenu()"  href="#" > <i class="fa-solid fa-x"></i> </a></div>

            <div class="menu-logo">
                <img src="{{ asset('storage/logo-cm.png') }}">
            </div>
            
            <ul>
                <li><a href="/dashboard" id="dashboard"> <i class="fa-solid fa-gauge"></i> <span> Dashboard   </span></a></li>
                <li><a href="/manage/profile/{{Auth::user()->uniqid}}/edit" id="profile"> <i class="fa-solid fa-user"></i> <span> Profiel</span></a></li>
                <li><a href="/manage/app-gallery" id="app-gallery""> <i class="fa-solid fa-table-cells"></i> <span> App Gallery</span></a></li>
                <li><a href="/manage/folders" id="folders" class="apps""> <i class="fa-solid fa-file"></i> <span> Apps</span></a></li>
                <li><a href="/manage/templates" id="templates"> <i class="fa-solid fa-pencil"></i> <span> Templates</span></a></li>
                <li><a href="/manage/accounts" id="accounts"> <i class="fa-solid fa-users"></i> <span> Accounts</span></a></li>
                <li><a href="/manage/settings" id="settings"> <i class="fa-sharp fa-solid fa-gear"></i><span> Instellingen</span></a></li>
                <li class="log-out-btn"><a href="#" onclick="event.preventDefault();document.getElementById('logout-form').submit();"><i class="fa-solid fa-right-from-bracket c-white"></i> <span> Uitloggen </span></a>
                <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                        {{ csrf_field() }}
                </form></li>
            </ul>
        </div>
        
</div>

        <div class="menu-top">
            <div class="container-fluid">
                <div class="row"   >
                    <div class="col-lg-12">
                        <div class="d-flex-end">Test</div>
                    </div>
                </div>
            </div>
        </div>

    <div class="ham_menu">
        <div class="menu-wrapper">
            <div class="hamburger-icon"><a  href="#" onclick="openMenu()"> <i class="fa-solid fa-bars"></i> </a></div>

                <div class="menu-logo">
                    <img src="{{ asset('storage/logo-cm.png') }}">
                </div>
                
                <ul>
                    <li><a href="/dashboard" id="dashboard"> <i class="fa-solid fa-gauge"></i></a></li>
                    <li><a href="/manage/profile/{{Auth::user()->uniqid}}/edit" id="profile"> <i class="fa-solid fa-user"></i></a></li>
                    <li><a href="/manage/app-gallery" id="app-gallery""> <i class="fa-solid fa-table-cells"></i></a></li>
                    <li><a href="/manage/folders" id="folders" class="apps"> <i class="fa-solid fa-file"></i></a></li>
                    <li><a href="/manage/templates" id="templates"> <i class="fa-solid fa-pencil"></i></a></li>
                    <li><a href="/manage/accounts" id="accounts"> <i class="fa-solid fa-users"></i></a></li>
                    <li><a href="/manage/settings" id="settings"> <i class="fa-sharp fa-solid fa-gear"></i></a></li>
                    <li><a class="log-out-btn" href="#" onclick="event.preventDefault();document.getElementById('logout-form').submit();"><i class="fa-solid fa-right-from-bracket c-white"></i></a>
                    <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                            {{ csrf_field() }}
                    </form></li>
                </ul>
            </div>
        </div>
            <script>
                    const firstPath = location.pathname.split('/')[1];

                    var a = document.getElementById("dashboard").id;
                    var b = document.getElementById("profile").id;
                    var h = document.getElementById("app-gallery").id;

                    var c = document.getElementById("folders").id;
                    var d = document.getElementById("templates").id;
                    var e = document.getElementById("accounts").id;
                    var f = document.getElementById("settings").id;
                    var g = document.getElementsByClassName("apps").folders.className;
                    // console.log(g)
                    if(a==firstPath){
                        var x = document.getElementById("dashboard");
                        x.classList.add("selected");
                    }
                    if(b==firstPath){
                        var x = document.getElementById("profile");
                        x.classList.add("selected");
                    }
                    if(h==firstPath){
                        var x = document.getElementById("app-gallery");
                        
                        x.classList.add("selected");
                       
                    }
                    if(c==firstPath){
                        var x = document.getElementById("folders");
                        
                        x.classList.add("selected");
                       
                    }
                    if(d==firstPath){
                        var x = document.getElementById("templates");
                        x.classList.add("selected");
                    }
                    if(e==firstPath){
                        var x = document.getElementById("accounts");
                        x.classList.add("selected");
                    }
                    if(f==firstPath){
                        var x = document.getElementById("settings");
                        x.classList.add("selected");
                    }
                    if(g==firstPath){
                        var m = document.getElementsByClassName("apps").folders;   
                        m.classList.add("selected");
  
                    }
                     
            </script>
