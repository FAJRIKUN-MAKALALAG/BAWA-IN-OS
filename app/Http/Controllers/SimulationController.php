<?php

namespace App\Http\Controllers;

use App\Jobs\Simulator\SimulateNewOrderJob;
use App\Models\ActivityLog;
use App\Models\EscrowLedger;
use App\Models\Transaction;
use App\Models\User;
use App\Services\TransactionStateMachine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SimulationController extends Controller
{
    // ──────────────────────────────────────────────
    // ANTIGRAVITY ENGINE — Toggle ON/OFF
    // ──────────────────────────────────────────────

    /** Aktifkan Antigravity Engine (simpan flag di Cache) */
    public function startEngine(Request $request)
    {
        Cache::put('simulator:enabled', true, now()->addHours(4));

        // Langsung dispatch satu cycle pertama agar terasa responsif
        SimulateNewOrderJob::dispatch()->onQueue('simulator');

        ActivityLog::create([
            'user_id'    => auth()->id(),
            'action'     => 'SIMULATOR_ENGINE_STARTED',
            'model_type' => User::class,
            'model_id'   => auth()->id(),
            'payload'    => ['engine' => 'AntigravityEngine', 'started_by' => auth()->user()?->email],
            'ip_address' => $request->ip(),
        ]);

        return back()->with('success', '🚀 Antigravity Engine aktif! Transaksi simulasi akan mulai mengalir.');
    }

    /** Matikan Antigravity Engine */
    public function stopEngine(Request $request)
    {
        Cache::forget('simulator:enabled');

        ActivityLog::create([
            'user_id'    => auth()->id(),
            'action'     => 'SIMULATOR_ENGINE_STOPPED',
            'model_type' => User::class,
            'model_id'   => auth()->id(),
            'payload'    => ['engine' => 'AntigravityEngine', 'stopped_by' => auth()->user()?->email],
            'ip_address' => $request->ip(),
        ]);

        return back()->with('success', '⏹️ Antigravity Engine dimatikan.');
    }

    /** Hapus semua data simulasi (is_simulated = true) */
    public function resetSimulationData(Request $request)
    {
        $simulatedIds = Transaction::where('is_simulated', true)->pluck('id');

        DB::transaction(function () use ($simulatedIds) {
            // Hapus cascade: escrow ledger, tracking logs, activity logs, lalu transaksi
            EscrowLedger::whereIn('transaction_id', $simulatedIds)->delete();
            \App\Models\TrackingLog::whereIn('transaction_id', $simulatedIds)->delete();
            ActivityLog::whereIn('model_id', $simulatedIds->toArray())
                ->where('model_type', Transaction::class)
                ->delete();
            Transaction::where('is_simulated', true)->delete();
        });

        // Invalidate semua cache dashboard
        Cache::forget('admin_dashboard_stats');
        Cache::forget('admin_dashboard_chart');
        Cache::forget('auditor_dashboard_stats');
        Cache::forget('auditor_dashboard_chart');

        ActivityLog::create([
            'user_id'    => auth()->id(),
            'action'     => 'SIMULATOR_DATA_RESET',
            'model_type' => User::class,
            'model_id'   => auth()->id(),
            'payload'    => ['deleted_count' => $simulatedIds->count(), 'engine' => 'AntigravityEngine'],
            'ip_address' => $request->ip(),
        ]);

        return back()->with('success', "🗑️ {$simulatedIds->count()} data simulasi berhasil dihapus. Database bersih.");
    }

    // ──────────────────────────────────────────────
    // ONE-SHOT SIMULATION (tetap dipertahankan)
    // ──────────────────────────────────────────────

    /** Satu siklus simulasi manual */
    public function simulateTransaction(Request $request)
    {
        if (!User::where('role', 'user')->count() >= 2) {
            return back()->withErrors(['error' => 'Minimal 2 user dengan role "user" dibutuhkan.']);
        }

        SimulateNewOrderJob::dispatch()->onQueue('simulator');

        return back()->with('success', 'Satu siklus simulasi berhasil di-dispatch!');
    }

    /** Simulasi payment webhook manual */
    public function simulatePaymentWebhook(Request $request)
    {
        $transaction = Transaction::where('status', 'pending')->latest()->first();
        if (!$transaction) {
            return back()->withErrors(['error' => 'Tidak ada transaksi pending untuk disimulasikan.']);
        }

        app(TransactionStateMachine::class)->transitionTo($transaction, 'paid');

        return back()->with('success', "Transaksi {$transaction->invoice_number} berhasil diubah ke 'paid'.");
    }
}
