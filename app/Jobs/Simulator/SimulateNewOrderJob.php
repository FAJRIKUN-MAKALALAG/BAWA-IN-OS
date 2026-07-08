<?php

namespace App\Jobs\Simulator;

use App\Models\ActivityLog;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class SimulateNewOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function handle(): void
    {
        // Guard: hentikan jika engine dimatikan
        if (!Cache::get('simulator:enabled', false)) {
            return;
        }

        $buyer = User::where('role', 'user')->inRandomOrder()->first();
        $provider = User::where('role', 'user')
            ->where('id', '!=', $buyer?->id ?? 0)
            ->inRandomOrder()
            ->first();

        if (!$buyer || !$provider) {
            return; // Tidak cukup user, skip cycle
        }

        $invoiceNumber = 'SIM/' . now()->format('Y/m') . '/' . rand(10000, 99999);
        while (Transaction::where('invoice_number', $invoiceNumber)->exists()) {
            $invoiceNumber = 'SIM/' . now()->format('Y/m') . '/' . rand(10000, 99999);
        }

        $grossAmount = rand(100, 2000) * 1000;

        $transaction = Transaction::create([
            'invoice_number' => $invoiceNumber,
            'buyer_id'       => $buyer->id,
            'provider_id'    => $provider->id,
            'gross_amount'   => $grossAmount,
            'status'         => 'pending',
            'is_simulated'   => true,
        ]);

        ActivityLog::create([
            'user_id'    => null,
            'action'     => 'SIMULATION_ORDER_CREATED',
            'model_type' => Transaction::class,
            'model_id'   => $transaction->id,
            'payload'    => [
                'buyer'      => $buyer->email,
                'provider'   => $provider->email,
                'amount'     => $grossAmount,
                'engine'     => 'AntigravityEngine',
            ],
            'ip_address' => '127.0.0.1',
        ]);

        // Chain ke job berikutnya: simulasi pembayaran 5 detik kemudian
        SimulatePaymentWebhookJob::dispatch($transaction->id)
            ->onQueue('simulator')
            ->delay(now()->addSeconds(5));
    }
}
