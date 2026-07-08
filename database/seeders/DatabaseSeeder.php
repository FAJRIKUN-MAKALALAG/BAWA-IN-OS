<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\EscrowLedger;
use App\Models\TrackingLog;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create specific testing accounts
        User::factory()->superAdmin()->create([
            'name' => 'Bawa.in Admin',
            'email' => 'admin@bawa.in',
            'password' => Hash::make('password'),
        ]);

        User::factory()->financialAuditor()->create([
            'name' => 'Bawa.in Auditor',
            'email' => 'auditor@bawa.in',
            'password' => Hash::make('password'),
        ]);

        User::factory()->operationsStaff()->create([
            'name' => 'Bawa.in Staff',
            'email' => 'staff@bawa.in',
            'password' => Hash::make('password'),
        ]);

        User::factory()->create([
            'name' => 'Regular User',
            'email' => 'user@bawa.in',
            'password' => Hash::make('password'),
        ]);

        // 2. Create 50 buyers and 50 providers
        $buyers = User::factory(50)->create();
        $providers = User::factory(50)->create();

        // 3. Create 1,000+ fake transactions and their related models
        DB::transaction(function () use ($buyers, $providers) {
            $totalTransactions = 1050; // Lebih dari 1.000 data transaksi fiktif

            for ($i = 0; $i < $totalTransactions; $i++) {
                $buyer = $buyers->random();
                $provider = $providers->random();

                // Prevent same buyer and provider
                while ($buyer->id === $provider->id) {
                    $buyer = $buyers->random();
                }

                // Generate transaction via factory
                $transaction = Transaction::factory()->create([
                    'buyer_id' => $buyer->id,
                    'provider_id' => $provider->id,
                ]);

                // Generate ledger record for this transaction
                EscrowLedger::factory()->create([
                    'transaction_id' => $transaction->id,
                    'amount_held' => $transaction->gross_amount,
                ]);

                // For shipped/delivered/released status, create tracking logs
                if (in_array($transaction->status, ['shipped', 'delivered', 'released'])) {
                    $trackingStatuses = [];
                    if ($transaction->status === 'shipped') {
                        $trackingStatuses = ['pending', 'paid', 'shipped'];
                    } elseif ($transaction->status === 'delivered') {
                        $trackingStatuses = ['pending', 'paid', 'shipped', 'delivered'];
                    } else { // released
                        $trackingStatuses = ['pending', 'paid', 'shipped', 'delivered', 'released'];
                    }

                    $date = clone $transaction->created_at;
                    foreach ($trackingStatuses as $index => $tStatus) {
                        $date = clone $date;
                        $date->modify('+' . ($index * 12) . ' hours');

                        TrackingLog::create([
                            'transaction_id' => $transaction->id,
                            'status' => $tStatus,
                            'details' => "Status paket diperbarui menjadi " . strtoupper($tStatus),
                            'latitude' => fake()->latitude(-6.3, -6.1), // Area Jabodetabek
                            'longitude' => fake()->longitude(106.7, 106.9),
                            'created_at' => $date,
                            'updated_at' => $date,
                        ]);
                    }
                }
            }
        });
    }
}
