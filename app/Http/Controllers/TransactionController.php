<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\TransactionStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    protected TransactionStateMachine $stateMachine;

    public function __construct(TransactionStateMachine $stateMachine)
    {
        $this->stateMachine = $stateMachine;
    }

    /**
     * Menampilkan daftar semua transaksi.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $transactions = Transaction::with(['buyer:id,name,email', 'provider:id,name,email'])
            ->when($search, function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('buyer', fn($u) => $u->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('provider', fn($p) => $p->where('name', 'like', "%{$search}%"));
            })
            ->when($status, fn($q) => $q->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Transactions', [
            'transactions' => $transactions,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    /**
     * Menampilkan halaman detail transaksi dengan tracking logs & escrow ledger.
     */
    public function show(string $id): Response
    {
        $transaction = Transaction::with([
            'buyer:id,name,email',
            'provider:id,name,email',
            'escrowLedger',
            'trackingLogs' => fn($q) => $q->orderBy('created_at', 'asc'),
        ])->findOrFail($id);

        return Inertia::render('Admin/TransactionDetail', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Membuat transaksi baru dengan status 'pending'.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'buyer_id' => 'required|exists:users,id',
            'provider_id' => 'required|exists:users,id|different:buyer_id',
            'gross_amount' => 'required|numeric|min:1',
        ]);

        $invoiceNumber = 'INV/' . now()->format('Y/m') . '/' . rand(10000, 99999);

        while (Transaction::where('invoice_number', $invoiceNumber)->exists()) {
            $invoiceNumber = 'INV/' . now()->format('Y/m') . '/' . rand(10000, 99999);
        }

        $transaction = Transaction::create([
            'invoice_number' => $invoiceNumber,
            'buyer_id' => $validated['buyer_id'],
            'provider_id' => $validated['provider_id'],
            'gross_amount' => $validated['gross_amount'],
            'status' => 'pending',
        ]);

        // Invalidate dashboard cache
        \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
        \Illuminate\Support\Facades\Cache::forget('admin_dashboard_chart');
        \Illuminate\Support\Facades\Cache::forget('auditor_dashboard_stats');
        \Illuminate\Support\Facades\Cache::forget('auditor_dashboard_chart');
        \Illuminate\Support\Facades\Cache::forget('staff_dashboard_stats');

        return response()->json([
            'message' => 'Transaksi berhasil dibuat.',
            'data' => $transaction,
        ], 210);
    }

    /**
     * Memproses transisi status transaksi.
     */
    public function transition(Request $request, string $id)
    {
        $validated = $request->validate([
            'new_status' => 'required|string',
        ]);

        $transaction = Transaction::findOrFail($id);

        try {
            $updated = $this->stateMachine->transitionTo($transaction, $validated['new_status']);

            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Status transaksi berhasil diperbarui.',
                    'data' => $updated->load('escrowLedger'),
                ]);
            }

            return back()->with('success', 'Status transaksi berhasil diperbarui.');
        } catch (\InvalidArgumentException $e) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'message' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['message' => $e->getMessage()]);
        }
    }

    /**
     * Membuat transaksi simulasi acak untuk Super Admin.
     */
    public function simulate(Request $request)
    {
        $buyer = \App\Models\User::where('role', 'user')->inRandomOrder()->first();
        $provider = \App\Models\User::where('role', 'user')
            ->where('id', '!=', $buyer->id ?? 0)
            ->inRandomOrder()
            ->first();

        if (!$buyer || !$provider) {
            $buyer = \App\Models\User::factory()->create(['role' => 'user']);
            $provider = \App\Models\User::factory()->create(['role' => 'user']);
        }

        $invoiceNumber = 'INV/' . now()->format('Y/m') . '/' . rand(10000, 99999);
        while (Transaction::where('invoice_number', $invoiceNumber)->exists()) {
            $invoiceNumber = 'INV/' . now()->format('Y/m') . '/' . rand(10000, 99999);
        }

        $grossAmount = rand(100, 2000) * 1000;

        $transaction = Transaction::create([
            'invoice_number' => $invoiceNumber,
            'buyer_id' => $buyer->id,
            'provider_id' => $provider->id,
            'gross_amount' => $grossAmount,
            'status' => 'pending',
        ]);

        \App\Models\ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'CREATE',
            'model_type' => Transaction::class,
            'model_id' => $transaction->id,
            'payload' => [
                'buyer' => $buyer->email,
                'provider' => $provider->email,
                'amount' => $grossAmount,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
        \Illuminate\Support\Facades\Cache::forget('admin_dashboard_chart');
        \Illuminate\Support\Facades\Cache::forget('auditor_dashboard_stats');
        \Illuminate\Support\Facades\Cache::forget('auditor_dashboard_chart');
        \Illuminate\Support\Facades\Cache::forget('staff_dashboard_stats');

        return back()->with('success', "Transaksi simulasi {$invoiceNumber} berhasil dibuat!");
    }
}
