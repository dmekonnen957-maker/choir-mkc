<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'app');

Route::get('/{path?}', function () {
    return view('app');
})->where('path', '^(?!api|up|build|storage|horizon|telescope).*$');
