<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Yeka MKC choirs and worship team — a multi-choir management and digital archive platform for choirs, songs, rehearsals, performances and musical history.">
        <meta name="theme-color" content="#0b1f3a">
        <title>Yeka MKC choirs and worship team — Multi-Choir Management Platform</title>

        @fonts

        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @viteReactRefresh
            @vite(['resources/js/main.jsx', 'resources/css/app.css'])
        @endif
    </head>
    <body class="bg-surface text-ink-800 antialiased">
        <div id="root"></div>
    </body>
</html>
