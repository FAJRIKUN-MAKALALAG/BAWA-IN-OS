<?php

namespace Tests\Feature;

use App\Models\EscrowLedger;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentWebhookTest extends TestCase
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
            'gross_amount' => 200000.00, // Rp 200.000
            'status' => 'pending',
        ]);
    }

    /**
     * Test webhook memproses pembayaran sukses dan mengupdate status ke paid serta membuat ledger.
     */
    public function test_webhook_successful_payment_updates_transaction_and_creates_ledger(): void
    {
        // Panggil endpoint webhook tanpa login (simulasi request dari luar)
        $response = $this->postJson(route('payment.webhook'), [
            'transaction_id' => $this->transaction->id,
            'status' => 'settlement',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Webhook diproses. Status transaksi diperbarui menjadi PAID.');

        // Cek status transaksi
        $this->assertDatabaseHas('transactions', [
            'id' => $this->transaction->id,
            'status' => 'paid',
        ]);

        // Cek ledger terbuat dengan hitungan benar
        // Platform fee: 200,000 * 5% = 10,000
        // PG fee: 4,500
        // Net: 200,000 - 10,000 - 4,500 = 185,500
        $this->assertDatabaseHas('escrow_ledgers', [
            'transaction_id' => $this->transaction->id,
            'amount_held' => 200000.00,
            'platform_fee_cut' => 10000.00,
            'disbursed_amount' => 185500.00,
        ]);
    }

    /**
     * Test webhook mengabaikan status pembayaran yang tidak sukses (misal: pending).
     */
    public function test_webhook_ignores_non_success_status(): void
    {
        $response = $this->postJson(route('payment.webhook'), [
            'transaction_id' => $this->transaction->id,
            'status' => 'pending',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Webhook diabaikan karena status tidak memenuhi syarat.');

        // Transaksi harus tetap pending
        $this->assertDatabaseHas('transactions', [
            'id' => $this->transaction->id,
            'status' => 'pending',
        ]);

        // Ledger tidak boleh terbuat
        $this->assertDatabaseMissing('escrow_ledgers', [
            'transaction_id' => $this->transaction->id,
        ]);
    }

    /**
     * Test webhook mengabaikan request jika transaksi sudah dalam status paid.
     */
    public function test_webhook_ignores_already_processed_transaction(): void
    {
        // Ubah status ke paid terlebih dahulu
        $this->transaction->update(['status' => 'paid']);

        $response = $this->postJson(route('payment.webhook'), [
            'transaction_id' => $this->transaction->id,
            'status' => 'settlement',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Webhook diabaikan: Transaksi sudah dalam status PAID.');
    }

    /**
     * Test webhook mengembalikan error jika transaction_id tidak valid.
     */
    public function test_webhook_returns_error_for_invalid_transaction(): void
    {
        $response = $this->postJson(route('payment.webhook'), [
            'transaction_id' => 'non-existent-uuid',
            'status' => 'settlement',
        ]);

        $response->assertStatus(422);
    }
}
