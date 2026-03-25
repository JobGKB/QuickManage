<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

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
     
    <title>{{ config('app.name', 'QuickManage') }}</title>
 
    <!-- Fonts -->
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link href="https://fonts.bunny.net/css?family=Nunito" rel="stylesheet">
 
    <link rel="stylesheet" href="{{ asset('css/style.css') }}" >

    <!-- Scripts -->
    
    <script src="https://js.arcgis.com/4.28/"></script>
   
            
    
</head>
<body>
    <div id="app">
        <main>
            @yield('content')
        </main>
    </div>
</body>
<footer>
<script>
        $("document").ready(function(){
        setTimeout(function(){
        $("div.successMessage").remove();
    }, 2000); 
});
    </script>
    <script src="/js/menu.js"></script>
    <script src="/js/main.js"></script>

    @if(Str::startsWith(request()->path(), 'manage/app-gallery'))
    <script src="/js/app_gallery/category.js"></script>
    @endif
     
    {{-- Session timeout warning popup --}}
    @auth
    <div id="session-timeout-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; justify-content:center; align-items:center;">
        <div style="background:#fff; border-radius:8px; padding:30px 40px; max-width:420px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
            <i class="fa-solid fa-clock" style="font-size:48px; color:#f0ad4e; margin-bottom:15px;"></i>
            <h4 style="margin-bottom:10px;">Sessie verloopt bijna</h4>
            <p style="color:#666; margin-bottom:20px;">U wordt automatisch uitgelogd over <strong id="session-countdown"></strong> seconden.</p>
            <button id="session-extend-btn" style=" background-color: #439034;color:#fff;border:none;outline:none;border-radius: 3px;padding:8px 15px;transition: 0.5s;">Sessie verlengen</button>
            <form id="session-timeout-logout" action="{{ route('logout') }}" method="POST" style="display:none;">@csrf</form>
        </div>
    </div>
    <script>
    (function() {
        var sessionLifetime = {{ config('session.lifetime') }};
        var warningSeconds = 60;
        var warningMs = (sessionLifetime * 6 - warningSeconds) * 10000;
  
        var timer, countdownInterval, remaining = warningSeconds;
        var overlay = document.getElementById('session-timeout-overlay');
        var countdownEl = document.getElementById('session-countdown');

        function resetTimer() {
            clearTimeout(timer);
            clearInterval(countdownInterval);
            overlay.style.display = 'none';
            remaining = warningSeconds;
            timer = setTimeout(showWarning, warningMs);
        }

        function showWarning() {
            remaining = warningSeconds;
            countdownEl.textContent = remaining;
            overlay.style.display = 'flex';
            countdownInterval = setInterval(function() {
                remaining--;
                countdownEl.textContent = remaining;
                if (remaining <= 0) {
                    clearInterval(countdownInterval);
                    document.getElementById('session-timeout-logout').submit();
                }
            }, 1000);
        }

        document.getElementById('session-extend-btn').addEventListener('click', function() {
            fetch('/ping', { credentials: 'same-origin' }).then(function() { resetTimer(); });
        });

        ['mousemove', 'keydown', 'click', 'scroll'].forEach(function(evt) {
            document.addEventListener(evt, function() {
                if (overlay.style.display === 'none' || overlay.style.display === '') {
                    resetTimer();
                }
            }, { passive: true });
        });

        resetTimer();
    })();
    </script>
    @endauth
</footer>
</html>
