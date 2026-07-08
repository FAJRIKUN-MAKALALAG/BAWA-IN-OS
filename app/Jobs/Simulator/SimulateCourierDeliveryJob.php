<?php

namespace App\Jobs\Simulator;

use App\Models\ActivityLog;
use App\Models\Transaction;
use App\Services\TransactionStateMachine;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class SimulateCourierDeliveryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(protected string $transactionId) {}

    public function handle(): void
    {
        // Guard: hentikan jika engine dimatikan di tengah jalan
        if (!Cache::get('simulator:enabled', false)) {
            return;
        }

        $transaction = Transaction::find($this->transactionId);
        if (!$transaction || $transaction->status !== 'paid') {
            return; // Idempotency check
        }

        $sm = app(TransactionStateMachine::class);

        // Step 1: paid -> shipped
        $sm->transitionTo($transaction->fresh(), 'shipped');

        ActivityLog::create([
            'user_id'    => null,
            'action'     => 'SIMULATION_SHIPPED',
            'model_type' => Transaction::class,
            'model_id'   => $transaction->id,
            'payload'    => ['engine' => 'AntigravityEngine', 'step' => 'shipped'],
            'ip_address' => '127.0.0.1',
        ]);

        // Tunggu 8 detik (simulasi perjalanan kurir), lalu dispatch step delivered -> released
        SimulateFinalDeliveryJob::dispatch($transaction->id)
            ->onQueue('simulator')
            ->delay(now()->addSeconds(8));
    }
}
