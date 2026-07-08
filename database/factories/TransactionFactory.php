<?php

namespace Database\Factories;

use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $createdAt = fake()->dateTimeBetween('-6 months', 'now');
        return [
            'invoice_number' => 'INV/' . $createdAt->format('Y/m') . '/' . fake()->unique()->numberBetween(10000, 99999),
            'buyer_id' => \App\Models\User::factory(),
            'provider_id' => \App\Models\User::factory(),
            'gross_amount' => fake()->randomFloat(2, 50000, 2000000), // Rp 50.000 s.d Rp 2.000.000
            'status' => fake()->randomElement(['pending', 'paid', 'shipped', 'delivered', 'released', 'refunded']),
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ];
    }
}
