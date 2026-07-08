<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('escrow_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('transaction_id')->constrained('transactions')->onDelete('cascade');
            $table->decimal('amount_held', 15, 2);
            $table->decimal('platform_fee_cut', 15, 2);
            $table->decimal('disbursed_amount', 15, 2);
            $table->timestamp('held_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('escrow_ledgers');
    }
};
