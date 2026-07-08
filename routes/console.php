<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 |--------------------------------------------------------------------------
 | Antigravity Engine Scheduler
 |--------------------------------------------------------------------------
 | Dijalankan setiap menit. Command simulator:run-cycle akan memeriksa
 | flag Cache 'simulator:enabled' sebelum melakukan dispatch.
 | withoutOverlapping() memastikan tidak ada cycle yang tumpang tindih.
 */
Schedule::command('simulator:run-cycle')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();
