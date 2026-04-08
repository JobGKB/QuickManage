<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'arcgis' => [
    'portal'        => env('ARCGIS_PORTAL', 'https://gkb.maps.arcgis.com/home/index.html'),
    'client_id'     => env('ARCGIS_CLIENT_ID'),
    'client_secret' => env('ARCGIS_CLIENT_SECRET'),
    'redirect_uri'  => env('ARCGIS_REDIRECT_URI'),
],

    'fme' => [
        'url'   => env('FME_SERVER_URL'),     // e.g. https://your-fme-server.com/fmerest/v3/transformations/submit/...
        'token' => env('FME_SERVER_TOKEN'),
    ],

];
