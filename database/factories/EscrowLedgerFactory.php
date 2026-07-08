<?php

namespace Database\Factories;

use App\Models\EscrowLedger;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EscrowLedger>
 */
class EscrowLedgerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'transaction_id' => \App\Models\Transaction::factory(),
            'amount_held' => function (array $attributes) {
                return \App\Models\Transaction::find($attributes['transaction_id'])->gross_amount;
            },
            'platform_fee_cut' => function (array $attributes) {
                return round($attributes['amount_held'] * 0.05, 2); // 5% platform fee
            },
            'disbursed_amount' => function (array $attributes) {
                // Net_Disbursement = Gross_Amount - Platform_Fee - Payment_Gateway_Fee (Rp 4500)
                $net = $attributes['amount_held'] - $attributes['platform_fee_cut'] - 4500;
                return round(max(0, $net), 2);
            },
            'held_at' => function (array $attributes) {
                $tx = \App\Models\Transaction::find($attributes['transaction_id']);
                return in_array($tx->status, ['paid', 'shipped', 'delivered', 'released', 'refunded']) ? $tx->created_at : null;
            },
            'released_at' => function (array $attributes) {
                $tx = \App\Models\Transaction::find($attributes['transaction_id']);
                if ($tx->status === 'released') {
                    $date = clone $tx->created_at;
                    return $date->modify('+' . fake()->numberBetween(1, 5) . ' days');
                }
                return null;
            },
        ];
    }
}
