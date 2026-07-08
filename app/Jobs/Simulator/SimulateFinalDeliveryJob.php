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

class SimulateFinalDeliveryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(protected string $transactionId) {}

    public function handle(): void
    {
        $transaction = Transaction::find($this->transactionId);
        if (!$transaction || $transaction->status !== 'shipped') {
            return; // Idempotency check
        }

        $sm = app(TransactionStateMachine::class);

        // Step 2: shipped -> delivered
        $sm->transitionTo($transaction->fresh(), 'delivered');

        ActivityLog::create([
            'user_id'    => null,
            'action'     => 'SIMULATION_DELIVERED',
            'model_type' => Transaction::class,
            'model_id'   => $transaction->id,
            'payload'    => ['engine' => 'AntigravityEngine', 'step' => 'delivered'],
            'ip_address' => '127.0.0.1',
        ]);

        // Step 3: delivered -> released (escrow cair ke provider)
        $sm->transitionTo($transaction->fresh(), 'released');

        ActivityLog::create([
            'user_id'    => null,
            'action'     => 'SIMULATION_ESCROW_RELEASED',
            'model_type' => Transaction::class,
            'model_id'   => $transaction->id,
            'payload'    => [
                'engine'          => 'AntigravityEngine',
                'step'            => 'released',
                'disbursed_amount' => $transaction->escrowLedger?->disbursed_amount,
            ],
            'ip_address' => '127.0.0.1',
        ]);

        // Invalidate cache sekali lagi setelah siklus selesai
        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_dashboard_chart');
    }
}
