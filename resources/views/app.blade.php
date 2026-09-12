<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="YKA M.K.C CHOIR — a multi-choir management and digital archive platform for choirs, songs, rehearsals, performances and musical history.">
        <meta name="theme-color" content="#0b1f3a">
        <title>YEKA M.K.C CHOIR — Multi-Choir Management Platform</title>

        @fonts
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700;800&display=swap" rel="stylesheet">

        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @viteReactRefresh
            @vite(['resources/js/main.jsx', 'resources/css/app.css'])
        @endif
    </head>
    <body class="bg-surface text-ink-800 antialiased">
        <div id="root"></div>
    </body>
</html>
