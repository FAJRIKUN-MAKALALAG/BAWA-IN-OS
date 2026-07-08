<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EscrowLedger extends Model
{
    use HasFactory;
    protected $fillable = [
        'transaction_id',
        'amount_held',
        'platform_fee_cut',
        'disbursed_amount',
        'held_at',
        'released_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_held' => 'decimal:2',
            'platform_fee_cut' => 'decimal:2',
            'disbursed_amount' => 'decimal:2',
            'held_at' => 'datetime',
            'released_at' => 'datetime',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }
}
