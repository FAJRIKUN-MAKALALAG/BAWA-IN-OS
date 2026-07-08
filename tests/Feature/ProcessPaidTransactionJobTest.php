<?php

namespace Tests\Feature;

use App\Jobs\ProcessPaidTransactionJob;
use App\Mail\TransactionPaidMail;
use App\Models\EscrowLedger;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProcessPaidTransactionJobTest extends TestCase
{
    use RefreshDatabase;

    protected User $buyer;
    protected User $provider;
    protected Transaction $transaction;

    protected function setUp(): void
    {
        parent::setUp();

        $this->buyer = User::factory()->create();
        $this->provider = User::factory()->create();
        
        $this->transaction = Transaction::factory()->create([
            'buyer_id' => $this->buyer->id,
            'provider_id' => $this->provider->id,
            'gross_amount' => 150000.00,
            'status' => 'pending',
        ]);
    }

    /**
     * Test job ProcessPaidTransactionJob di-dispatch ketika status berubah menjadi paid.
     */
    public function test_job_is_dispatched_on_paid_transition(): void
    {
        Queue::fake();

        $this->actingAs($this->buyer)->postJson(route('transactions.transition', $this->transaction->id), [
            'new_status' => 'paid',
        ]);

        Queue::assertPushed(ProcessPaidTransactionJob::class, function ($job) {
            return $job->transaction->id === $this->transaction->id;
        });
    }

    /**
     * Test penanganan Job berhasil membuat file invoice dan mengirim email.
     */
    public function test_job_creates_invoice_file_and_sends_email(): void
    {
        Mail::fake();

        // Siapkan data escrow ledger karena job membutuhkan relasi tersebut
        EscrowLedger::create([
            'transaction_id' => $this->transaction->id,
            'amount_held' => 150000.00,
            'platform_fee_cut' => 7500.00,
            'disbursed_amount' => 138000.00,
            'held_at' => now(),
        ]);

        $this->transaction->update(['status' => 'paid']);

        // Jalankan Job secara manual / synchronous
        $job = new ProcessPaidTransactionJob($this->transaction);
        $job->handle();

        // Validasi file invoice terbuat di storage/app/invoices/
        $filename = 'invoice-' . str_replace('/', '-', $this->transaction->invoice_number) . '.txt';
        $invoicePath = storage_path('app/invoices/' . $filename);
        
        $this->assertFileExists($invoicePath);
        $this->assertStringContainsString($this->transaction->invoice_number, file_get_contents($invoicePath));
        $this->assertStringContainsString('PAID (ESCROW HELD)', file_get_contents($invoicePath));

        // Validasi email terkirim ke buyer dengan attachment invoice
        Mail::assertSent(TransactionPaidMail::class, function ($mail) {
            return $mail->hasTo($this->buyer->email) && 
                   $mail->transaction->id === $this->transaction->id;
        });

        // Bersihkan berkas setelah pengujian selesai
        if (file_exists($invoicePath)) {
            unlink($invoicePath);
        }
    }
}
