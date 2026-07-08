<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\EscrowLedger;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionStateMachineTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $buyer;
    protected User $provider;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->buyer = User::factory()->create();
        $this->provider = User::factory()->create();
    }

    /**
     * Test pembuatan transaksi baru.
     */
    public function test_can_create_transaction(): void
    {
        $response = $this->actingAs($this->user)->postJson(route('transactions.store'), [
            'buyer_id' => $this->buyer->id,
            'provider_id' => $this->provider->id,
            'gross_amount' => 100000.00, // Rp 100.000
        ]);

        $response->assertStatus(210);
        $response->assertJsonPath('data.status', 'pending');
        $this->assertDatabaseHas('transactions', [
            'buyer_id' => $this->buyer->id,
            'provider_id' => $this->provider->id,
            'gross_amount' => 100000.00,
            'status' => 'pending',
        ]);
    }

    /**
     * Test transisi status valid dari pending ke paid dan inisialisasi ledger.
     */
    public function test_valid_transition_pending_to_paid_initializes_ledger(): void
    {
        $transaction = Transaction::factory()->create([
            'buyer_id' => $this->buyer->id,
            'provider_id' => $this->provider->id,
            'gross_amount' => 100000.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)->postJson(route('transactions.transition', $transaction->id), [
            'new_status' => 'paid',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'paid');

        // Validasi database transaksi
        $this->assertDatabaseHas('transactions', [
            'id' => $transaction->id,
            'status' => 'paid',
        ]);

        // Formula: Net_Disbursement = Gross_Amount - Platform_Fee (5%) - PG_Fee (Rp 4500)
        // Platform_Fee = 100000 * 0.05 = 5000
        // PG_Fee = 4500
        // Net = 100000 - 5000 - 4500 = 90500
        $this->assertDatabaseHas('escrow_ledgers', [
            'transaction_id' => $transaction->id,
            'amount_held' => 100000.00,
            'platform_fee_cut' => 5000.00,
            'disbursed_amount' => 90500.00,
        ]);

        $ledger = EscrowLedger::where('transaction_id', $transaction->id)->first();
        $this->assertNotNull($ledger->held_at);
        $this->assertNull($ledger->released_at);

        // Validasi Audit Log
        $this->assertDatabaseHas('activity_logs', [
            'user_id' => $this->user->id,
            'action' => 'TRANSITION_STATUS',
            'model_type' => Transaction::class,
            'model_id' => $transaction->id,
        ]);
    }

    /**
     * Test transisi status tidak valid (misal: pending ke released langsung).
     */
    public function test_invalid_transition_fails(): void
    {
        $transaction = Transaction::factory()->create([
            'buyer_id' => $this->buyer->id,
            'provider_id' => $this->provider->id,
            'gross_amount' => 100000.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->user)->postJson(route('transactions.transition', $transaction->id), [
            'new_status' => 'released',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Transisi status dari pending ke released tidak diperbolehkan.');

        $this->assertDatabaseHas('transactions', [
            'id' => $transaction->id,
            'status' => 'pending',
        ]);
    }

    /**
     * Test transisi ke released mengisi released_at di ledger.
     */
    public function test_transition_to_released_updates_ledger(): void
    {
        $transaction = Transaction::factory()->create([
            'buyer_id' => $this->buyer->id,
            'provider_id' => $this->provider->id,
            'gross_amount' => 100000.00,
            'status' => 'shipped',
        ]);

        // Simulasikan ledger yang sudah diisi
        EscrowLedger::create([
            'transaction_id' => $transaction->id,
            'amount_held' => 100000.00,
            'platform_fee_cut' => 5000.00,
            'disbursed_amount' => 90500.00,
            'held_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->postJson(route('transactions.transition', $transaction->id), [
            'new_status' => 'released',
        ]);

        $response->assertStatus(200);
        $ledger = EscrowLedger::where('transaction_id', $transaction->id)->first();
        $this->assertNotNull($ledger->released_at);
    }

    /**
     * Test transisi ke refunded mengeset disbursed_amount menjadi 0.
     */
    public function test_transition_to_refunded_resets_disbursed_amount(): void
    {
        $transaction = Transaction::factory()->create([
            'buyer_id' => $this->buyer->id,
            'provider_id' => $this->provider->id,
            'gross_amount' => 100000.00,
            'status' => 'paid',
        ]);

        // Simulasikan ledger yang sudah diisi
        EscrowLedger::create([
            'transaction_id' => $transaction->id,
            'amount_held' => 100000.00,
            'platform_fee_cut' => 5000.00,
            'disbursed_amount' => 90500.00,
            'held_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->postJson(route('transactions.transition', $transaction->id), [
            'new_status' => 'refunded',
        ]);

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('escrow_ledgers', [
            'transaction_id' => $transaction->id,
            'disbursed_amount' => 0.00,
        ]);

        $ledger = EscrowLedger::where('transaction_id', $transaction->id)->first();
        $this->assertNotNull($ledger->released_at);
    }
}
