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

    // Microsoft Entra ID (Azure AD) SSO
    'azure' => [
        'client_id'     => env('AZURE_CLIENT_ID'),
        'client_secret' => env('AZURE_CLIENT_SECRET'),
        'redirect'      => env('AZURE_REDIRECT_URI'),
        'tenant'        => env('AZURE_TENANT_ID'),
        // Only accounts with an e-mail in this domain are allowed access.
        'allowed_domain' => env('AZURE_ALLOWED_DOMAIN', 'gkbgroep.nl'),
    ],

    'fme' => [
        'url'     => env('FME_SERVER_URL'),      // GDB workspace URL
        'dwg_url' => env('FME_DWG_SERVER_URL'),  // DWG workspace URL
        'token'   => env('FME_SERVER_TOKEN'),
    ],

    // Claude (Anthropic) — GIS Assistent
    'claude' => [
        'key'   => env('ANTHROPIC_API_KEY'),
        'model' => env('ANTHROPIC_MODEL', 'claude-sonnet-4-6'),
    ],

    // FME MCP server exposed to Claude via the Anthropic MCP connector
    'fme_mcp' => [
        'url' => env('FME_MCP_URL', 'https://fme.gkbgroep.nl/fmemcp/OpenDataInfo/mcp'),
    ],

];
