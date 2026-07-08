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

class SimulatePaymentWebhookJob implements ShouldQueue
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
        if (!$transaction || $transaction->status !== 'pending') {
            return; // Idempotency check
        }

        // Transisi: pending -> paid (otomatis membuat EscrowLedger via StateMachine)
        app(TransactionStateMachine::class)->transitionTo($transaction, 'paid');

        ActivityLog::create([
            'user_id'    => null,
            'action'     => 'SIMULATION_PAYMENT_RECEIVED',
            'model_type' => Transaction::class,
            'model_id'   => $transaction->id,
            'payload'    => [
                'transaction_id' => $transaction->id,
                'amount'         => $transaction->gross_amount,
                'engine'         => 'AntigravityEngine',
            ],
            'ip_address' => '127.0.0.1',
        ]);

        // Chain: simulasi kurir 10 detik kemudian
        SimulateCourierDeliveryJob::dispatch($transaction->id)
            ->onQueue('simulator')
            ->delay(now()->addSeconds(10));
    }
}
