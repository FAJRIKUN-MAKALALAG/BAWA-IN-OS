<?php

namespace App\Console\Commands;

use App\Jobs\Simulator\SimulateNewOrderJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class RunSimulatorCycleCommand extends Command
{
    protected $signature   = 'simulator:run-cycle';
    protected $description = 'Antigravity Engine: Jalankan satu siklus simulasi transaksi jika engine aktif.';

    public function handle(): int
    {
        if (!Cache::get('simulator:enabled', false)) {
            $this->line('[AntigravityEngine] Engine sedang OFF. Cycle dilewati.');
            return Command::SUCCESS;
        }

        $this->info('[AntigravityEngine] Dispatching SimulateNewOrderJob...');

        SimulateNewOrderJob::dispatch()->onQueue('simulator');

        $this->info('[AntigravityEngine] Cycle dispatched berhasil.');
        return Command::SUCCESS;
    }
}
