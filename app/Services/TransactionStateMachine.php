<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class TransactionStateMachine
{
    /**
     * Peta transisi status yang valid.
     * key: status saat ini
     * value: daftar status berikutnya yang valid
     */
    protected array $transitions = [
        'pending' => ['paid'],
        'paid' => ['shipped', 'refunded'],
        'shipped' => ['delivered', 'released', 'refunded'],
        'delivered' => ['released', 'refunded'],
    ];

    /**
     * Melakukan transisi status transaksi secara aman.
     *
     * @param Transaction $transaction
     * @param string $newStatus
     * @return Transaction
     * @throws \InvalidArgumentException
     */
    public function transitionTo(Transaction $transaction, string $newStatus): Transaction
    {
        $oldStatus = $transaction->status;

        // 1. Validasi apakah transisi diperbolehkan
        if ($oldStatus === $newStatus) {
            return $transaction;
        }

        $allowedNext = $this->transitions[$oldStatus] ?? [];
        if (!in_array($newStatus, $allowedNext)) {
            throw new \InvalidArgumentException("Transisi status dari {$oldStatus} ke {$newStatus} tidak diperbolehkan.");
        }

        // 2. Jalankan transisi dalam database transaction secara atomik
        DB::transaction(function () use ($transaction, $oldStatus, $newStatus) {
            $transaction->status = $newStatus;
            $transaction->save();

            // 3. Tangani efek samping finansial (Escrow Ledger)
            $this->handleEscrowLedger($transaction, $newStatus);

            // 3.5 Dispatch background job untuk status paid
            if ($newStatus === 'paid') {
                \App\Jobs\ProcessPaidTransactionJob::dispatch($transaction);
            }

            // 3.6 Invalidate dashboard cache
            \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
            \Illuminate\Support\Facades\Cache::forget('admin_dashboard_chart');
            \Illuminate\Support\Facades\Cache::forget('auditor_dashboard_stats');
            \Illuminate\Support\Facades\Cache::forget('auditor_dashboard_chart');
            \Illuminate\Support\Facades\Cache::forget('staff_dashboard_stats');

            // 4. Catat riwayat audit (Activity Log)
            ActivityLog::create([
                'user_id' => auth()->id(),
                'action' => 'TRANSITION_STATUS',
                'model_type' => Transaction::class,
                'model_id' => $transaction->id,
                'payload' => [
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        });

        return $transaction;
    }

    /**
     * Mengatur status dan kalkulasi pada Escrow Ledger sesuai dengan status transaksi.
     */
    protected function handleEscrowLedger(Transaction $transaction, string $newStatus): void
    {
        if ($newStatus === 'paid') {
            // Formula: Net_Disbursement = Gross_Amount - Platform_Fee (5%) - Payment_Gateway_Fee (Flat Rp 4500)
            $gross = (float) $transaction->gross_amount;
            $platformFee = round($gross * 0.05, 2);
            $pgFee = 4500.00;
            $disbursed = round(max(0, $gross - $platformFee - $pgFee), 2);

            $transaction->escrowLedger()->updateOrCreate(
                ['transaction_id' => $transaction->id],
                [
                    'amount_held' => $gross,
                    'platform_fee_cut' => $platformFee,
                    'disbursed_amount' => $disbursed,
                    'held_at' => now(),
                ]
            );
        } elseif ($newStatus === 'released') {
            $transaction->escrowLedger()->update([
                'released_at' => now(),
            ]);
        } elseif ($newStatus === 'refunded') {
            $transaction->escrowLedger()->update([
                'disbursed_amount' => 0.00, // Dana dikembalikan penuh ke buyer, provider dapat Rp 0
                'released_at' => now(),
            ]);
        }
    }
}
