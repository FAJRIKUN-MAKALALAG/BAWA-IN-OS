<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\TransactionStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    protected TransactionStateMachine $stateMachine;

    public function __construct(TransactionStateMachine $stateMachine)
    {
        $this->stateMachine = $stateMachine;
    }

    /**
     * Menerima notifikasi instan (webhook) dari simulasi payment gateway.
     */
    public function handle(Request $request): JsonResponse
    {
        // Catat request ke log untuk debugging sandbox
        Log::info('Payment Webhook Received:', $request->all());

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'transaction_id' => 'required|exists:transactions,id',
            'status' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();
        $transaction = Transaction::findOrFail($validated['transaction_id']);

        // Jika transaksi sudah PAID, abaikan webhook agar tidak diproses ganda
        if ($transaction->status === 'paid') {
            return response()->json([
                'message' => 'Webhook diabaikan: Transaksi sudah dalam status PAID.',
                'transaction_id' => $transaction->id,
            ]);
        }

        // Simulasi status sukses dari Payment Gateway
        $successStatuses = ['settlement', 'capture', 'paid', 'success'];

        if (in_array(strtolower($validated['status']), $successStatuses)) {
            try {
                $this->stateMachine->transitionTo($transaction, 'paid');
                return response()->json([
                    'message' => 'Webhook diproses. Status transaksi diperbarui menjadi PAID.',
                    'transaction_id' => $transaction->id,
                ]);
            } catch (\InvalidArgumentException $e) {
                return response()->json([
                    'message' => 'Webhook diabaikan: ' . $e->getMessage(),
                    'transaction_id' => $transaction->id,
                ]);
            }
        }

        return response()->json([
            'message' => 'Webhook diabaikan karena status tidak memenuhi syarat.',
            'transaction_id' => $transaction->id,
        ]);
    }
}
