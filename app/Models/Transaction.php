<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'invoice_number',
        'buyer_id',
        'provider_id',
        'gross_amount',
        'status',
        'is_simulated',
    ];

    protected function casts(): array
    {
        return [
            'gross_amount' => 'decimal:2',
            'is_simulated' => 'boolean',
        ];
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    public function escrowLedger(): HasOne
    {
        return $this->hasOne(EscrowLedger::class, 'transaction_id');
    }

    public function trackingLogs(): HasMany
    {
        return $this->hasMany(TrackingLog::class, 'transaction_id');
    }
}
