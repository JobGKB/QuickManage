const mix = require('laravel-mix');

mix.js('resources/js/app.js', 'public/js')
   .sass('resources/sass/style.scss', 'public/css')
    .sass('resources/sass/app_gallery.scss', 'public/css')
    .sass('resources/sass/GKB_Realisatie_Style.scss', 'public/css')
   .sass('resources/sass/testAI.scss', 'public/css')
   .sass('resources/sass/errors_style.scss', 'public/css')
   .sass('resources/sass/dataviewer.scss', 'public/css') 
   .browserSync({
       proxy: 'http://127.0.0.1:8000', // your Laravel backend
       open: true,
       notify: false,
   });