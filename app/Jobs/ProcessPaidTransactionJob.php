<?php

namespace App\Jobs;

use App\Mail\TransactionPaidMail;
use App\Models\Transaction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class ProcessPaidTransactionJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public Transaction $transaction;

    /**
     * Create a new job instance.
     */
    public function __construct(Transaction $transaction)
    {
        $this->transaction = $transaction;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // 1. Simulasikan pembuatan invoice dalam format teks di storage
        $dir = storage_path('app/invoices');
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = 'invoice-' . str_replace('/', '-', $this->transaction->invoice_number) . '.txt';
        $invoicePath = $dir . '/' . $filename;

        // Muat relasi jika belum dimuat
        $this->transaction->load(['buyer', 'provider', 'escrowLedger']);

        $grossFormatted = number_format($this->transaction->gross_amount, 2, ',', '.');
        $platformFeeFormatted = number_format($this->transaction->escrowLedger->platform_fee_cut, 2, ',', '.');
        $netFormatted = number_format($this->transaction->escrowLedger->disbursed_amount, 2, ',', '.');

        $content = "============================================\n" .
                   "          BAWA.IN CORE - ESCROW INVOICE      \n" .
                   "============================================\n" .
                   "Invoice No    : {$this->transaction->invoice_number}\n" .
                   "Status        : PAID (ESCROW HELD)\n" .
                   "Date          : " . now()->format('Y-m-d H:i:s') . "\n" .
                   "--------------------------------------------\n" .
                   "Buyer         : {$this->transaction->buyer->name} ({$this->transaction->buyer->email})\n" .
                   "Provider      : {$this->transaction->provider->name} ({$this->transaction->provider->email})\n" .
                   "--------------------------------------------\n" .
                   "Gross Amount  : Rp {$grossFormatted}\n" .
                   "Platform Fee  : Rp {$platformFeeFormatted} (5%)\n" .
                   "Disbursable   : Rp {$netFormatted} (Setelah PG Fee Rp 4.500)\n" .
                   "============================================\n" .
                   "   Dana aman ditahan di rekening bersama.   \n" .
                   "============================================\n";

        file_put_contents($invoicePath, $content);

        // 2. Kirim email ke Buyer dengan lampiran file invoice tersebut
        Mail::to($this->transaction->buyer->email)->send(
            new TransactionPaidMail($this->transaction, $invoicePath)
        );
    }
}
