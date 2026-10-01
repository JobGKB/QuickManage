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
    <link rel="stylesheet" href="{{ asset('css/docs.css') }}" >
    <!-- Scripts -->
    <script src="https://js.arcgis.com/4.28/"></script>
</head>
<body >
     
     <section class="header">                   
         <div class="container border-left">                
            <div class="row">   
 
                    <div class="col-lg-12 ">
                        <div class="header-wrapper"> 
                            <img src="{{ asset('storage/logo-cm.png') }}" alt="QuickManage Logo" class="img">
                            <input type="text" class="searchbar" placeholder="Search...">
                        </div>
                    </div>
 
            </div>
         </div>
     </section>

     <section class="content">
        <div class="container border-left">
            <div class="row ">
                
                    <div class="col-lg-3">
                        <div class="menu"> 
                            <ul>

                                <li>
                                    <a href="/docs">Introduction</a>
                                </li>
    
                                <li>
                                    <a href="#profielplaatjes">Profielplaatjes</a>
                                </li>

                            </ul>
                        </div>
                    </div>
                    <div class="col-lg-9">
                        <div class="content-introduction" id="content-introduction">                                                                                  
                            <h1>Introduction</h1>                                                                                           
                            <p>Welcome to the QuickManage documentation.</p>                                                                
                                                                                                                                            
                            <p>Here you can find detailed information about QuickManage features and usage.</p>                             
                            <p>Feel free to explore the different sections to learn more about how to make the most out of QuickManage.</p> 
                            <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>           
                                                                                                                                            
                        </div>

                        <div class="content-profielplaatjes" id="content-profielplaatjes">  
                            <h3>Automatisch genereren van profielplaatjes</h3>
                            <p>
                                <strong>POST</strong> <span id="api_url"><strong> https://gisdev.gkbgroep.nl/api/profielplaatjes/generate </strong></span> 
                                <i class="fa-solid fa-copy" id="copy_apiLink" role="button" title="Copy" style="cursor: pointer;"></i>           
                                
                            </p>
                            <p>Er kunnen max 250 profielen worden gegenereerd per request. Afhankelijk van de serverbelasting kan dit enige tijd duren.</p>   
                            <p>De request body moet een JSON object bevatten met daarin een array van profielen. Elk profiel moet de volgende velden bevatten, de waardes hiervan mogen ook leeg zijn meer dan wel als empty string (bijv:"-"):</p>
                            <ul>
                                <li><strong>profielcode</strong>: De code van het profiel (string)</li>
                                <li><strong>project</strong>: De code van het project (string)</li>
                                <li><strong>opdrachtgever</strong>: De naam van de opdrachtgever (string)</li>
                                <li><strong>omschrijving</strong>: Een korte omschrijving van het profiel (string)</li>
                                <li><strong>baggercode</strong>: De baggercode (string)</li>
                                <li><strong>legger</strong>: De legger (string)</li>
                                <li><strong>polderpeil</strong>: Het polderpeil (string)</li>
                                <li><strong>waterpeil</strong>: Het waterpeil (string)</li>
                                <li><strong>dynamic_fields</strong>: Een array van max 2 dynamische velden, hierbij mag je zelf de naam en waarde van elk veld bepalen.</li>
                                <li><strong>punten</strong>: Een array van punten, elk punt moet een object bevatten met de volgende velden:
                                    <ul>
                                        <li><strong>puntnr</strong>: Het puntnummer (integer)</li>
                                        <li><strong>afstand</strong>: De afstand tot het vorige punt (float)</li>
                                        <li><strong>puntsoort</strong>: De soort van het punt (string)</li>
                                        <li><strong>meting</strong>: De meting op dat punt (float)</li>
                                    </ul>
                                </li>
                            </ul>

                                <p id="json_toggle" role="button" style="cursor: pointer;">Voorbeeld request body (JSON):  <i class="fa-solid fa-arrow-right" id="json_toggle_icon"> </i></p>

                            <div class="code-block">
                                <pre id="json_pre">
                                    <code class="language-json" id="json_code">
Method: POST
Full URL: https://gisdev.gkbgroep.nl/api/profielplaatjes/generate
Version: HTTP/2 (if possible)
Content-Type: JSON (application/json)

    {
        "profielen":
        [
            { 
                "profielcode": "30_12_B", 
                "project": "BARE2621",
                "opdrachtgever": "Gemeente Barendrecht", 
                "omschrijving": "Baggeren Begraafplaats Ouden Dyck", 
                "baggercode": "-", 
                "legger": "-", 
                "polderpeil": "-", 
                "waterpeil": "-",
                "dynamic_fields":[
                    {
                        "inpeildatum": "-" ,
                        "Bagger m3 / strekkende meter":"0.07"
                    }
                ],
                "punten":
                [
                    {"puntnr":1,"afstand":0,"puntsoort":"insteek","meting":-1.63},
                    {"puntnr":2,"afstand":0.17,"puntsoort":"baggervasteb","meting":-2.05},
                    {"puntnr":3,"afstand":0.49,"puntsoort":"baggervasteb","meting":-2.36},
                    {"puntnr":4,"afstand":0.9,"puntsoort":"baggervasteb","meting":-2.45},
                    {"puntnr":5,"afstand":1.39,"puntsoort":"baggervasteb","meting":-2.59},
                    {"puntnr":6,"afstand":1.9,"puntsoort":"baggervasteb","meting":-2.76},
                    {"puntnr":7,"afstand":2.44,"puntsoort":"vast","meting":-2.95},
                    {"puntnr":8,"afstand":2.44,"puntsoort":"bagger","meting":-2.88},
                    {"puntnr":9,"afstand":2.87,"puntsoort":"vast","meting":-2.95},
                    {"puntnr":10,"afstand":2.87,"puntsoort":"bagger","meting":-2.88},
                    {"puntnr":11,"afstand":3.4,"puntsoort":"baggervasteb","meting":-2.74},
                    {"puntnr":12,"afstand":3.88,"puntsoort":"baggervasteb","meting":-2.59},
                    {"puntnr":13,"afstand":4.33,"puntsoort":"baggervasteb","meting":-2.46},
                    {"puntnr":14,"afstand":4.83,"puntsoort":"baggervasteb","meting":-2.33},
                    {"puntnr":15,"afstand":5.44,"puntsoort":"baggervasteb","meting":-2.24},
                    {"puntnr":16,"afstand":5.98,"puntsoort":"baggervasteb","meting":-2.05},
                    {"puntnr":17,"afstand":8.08,"puntsoort":"insteek","meting":-1.24}
                ]
            }
        ]
    }
                                    </code>
                                </pre>
                              
                            </div>

                           <p>   Voorbeeld response code 200 (JSON): <i class="fa-solid fa-arrow-right" id="json_toggle_icon"> </i></p>
                        </div>

                        

                    </div>
                 
            </div>
        </div>
     </section>

     <section class="footer">
         <div class="container border-left">
            <div class="row">
 
                    <div class="col-lg-12 text-center">
                        <div class="footer-wrapper">  
                            <p>&copy; 2024 QuickManage. All rights reserved.</p>
                        </div> 
                    </div>
 
            </div>
         </div>
     </section>

    <script src="{{ asset('js/documentation/main.js') }}"></script>
</body>
 
</html>
