{{-- WYSIWYG editor for documentation content. Pinned version with SRI; see docs/modules/documentation.md before upgrading. --}}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jodit@4.20.3/es2021/jodit.min.css" integrity="sha384-vD+5h6JazO8Beo36vpUcb452kmcv5fMfhrPLWqoDfDPEsCWIRVECLTeQhhZYjYda" crossorigin="anonymous">

{{--
    layouts/app loads the ArcGIS SDK, which brings an AMD loader (a global "define"). Jodit would
    register itself there instead of creating window.Jodit, so "define" is hidden while it loads.
--}}
<script>window.__docsAmdDefine = window.define; window.define = undefined;</script>
<script src="https://cdn.jsdelivr.net/npm/jodit@4.20.3/es2021/jodit.min.js" integrity="sha384-r3YDiJRxTBoDjUJSYTHarZhY9lD0JKLvFYUOO6LNZGAMQeRxOsnb59Aq2yDZMyDs" crossorigin="anonymous"></script>
<script>window.define = window.__docsAmdDefine; delete window.__docsAmdDefine;</script>

<script src="{{ asset('js/documentation/admin.js') }}"></script>
