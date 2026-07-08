<?php

namespace App\Http\Controllers;

use App\Models\EscrowLedger;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $role = $request->user()->role;

        switch ($role) {
            case 'super_admin':
                return redirect()->route('admin.dashboard');
            case 'financial_auditor':
                return redirect()->route('auditor.dashboard');
            case 'operations_staff':
                return redirect()->route('staff.dashboard');
            default:
                return Inertia::render('Dashboard');
        }
    }

    /**
     * Dashboard untuk Super Admin — berisi ringkasan statistik dan tabel transaksi.
     */
    public function adminDashboard(Request $request): Response
    {
        // Cache statistik ringkasan selama 10 menit
        $stats = \Illuminate\Support\Facades\Cache::remember('admin_dashboard_stats', 600, function () {
            return [
                'total_transactions' => Transaction::count(),
                'total_gmv' => Transaction::sum('gross_amount'),
                'platform_revenue' => EscrowLedger::sum('platform_fee_cut'),
                'active_escrow' => Transaction::whereIn('status', ['paid', 'shipped', 'delivered'])->count(),
            ];
        });

        // Cache grafik bulanan selama 10 menit
        $chartData = \Illuminate\Support\Facades\Cache::remember('admin_dashboard_chart', 600, function () {
            $monthlyGMV = Transaction::selectRaw("strftime('%Y-%m', created_at) as month, SUM(gross_amount) as amount")
                ->where('created_at', '>=', now()->subMonths(6))
                ->groupBy('month')
                ->get();

            $monthlyRevenue = EscrowLedger::selectRaw("strftime('%Y-%m', created_at) as month, SUM(platform_fee_cut) as amount")
                ->where('created_at', '>=', now()->subMonths(6))
                ->groupBy('month')
                ->get();

            $data = [];
            for ($i = 5; $i >= 0; $i--) {
                $monthKey = now()->subMonths($i)->format('Y-m');
                $monthName = now()->subMonths($i)->format('M Y');

                $gmv = $monthlyGMV->firstWhere('month', $monthKey)->amount ?? 0;
                $revenue = $monthlyRevenue->firstWhere('month', $monthKey)->amount ?? 0;

                $data[] = [
                    'month' => $monthName,
                    'gmv' => (float) $gmv,
                    'revenue' => (float) $revenue,
                ];
            }
            return $data;
        });

        // Tabel transaksi dengan filter, search, dan eager loading (Selalu realtime)
        $search  = $request->input('search', '');
        $status  = $request->input('status', '');

        $transactions = Transaction::with(['buyer:id,name,email', 'provider:id,name,email'])
            ->when($search, fn($q) => $q->where('invoice_number', 'like', "%{$search}%")
                ->orWhereHas('buyer', fn($q2) => $q2->where('name', 'like', "%{$search}%"))
            )
            ->when($status, fn($q) => $q->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'transactions' => $transactions,
            'chartData' => $chartData,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    /**
     * Dashboard untuk Financial Auditor.
     */
    public function auditorDashboard(Request $request): Response
    {
        // Cache statistik finansial selama 10 menit
        $stats = \Illuminate\Support\Facades\Cache::remember('auditor_dashboard_stats', 600, function () {
            return [
                'platform_revenue' => EscrowLedger::sum('platform_fee_cut'),
                'total_disbursed' => EscrowLedger::sum('disbursed_amount'),
                'total_held' => EscrowLedger::whereNull('released_at')->sum('amount_held'),
            ];
        });

        // Cache grafik bulanan
        $chartData = \Illuminate\Support\Facades\Cache::remember('auditor_dashboard_chart', 600, function () {
            $monthlyGMV = Transaction::selectRaw("strftime('%Y-%m', created_at) as month, SUM(gross_amount) as amount")
                ->where('created_at', '>=', now()->subMonths(6))
                ->groupBy('month')
                ->get();

            $monthlyRevenue = EscrowLedger::selectRaw("strftime('%Y-%m', created_at) as month, SUM(platform_fee_cut) as amount")
                ->where('created_at', '>=', now()->subMonths(6))
                ->groupBy('month')
                ->get();

            $data = [];
            for ($i = 5; $i >= 0; $i--) {
                $monthKey = now()->subMonths($i)->format('Y-m');
                $monthName = now()->subMonths($i)->format('M Y');

                $gmv = $monthlyGMV->firstWhere('month', $monthKey)->amount ?? 0;
                $revenue = $monthlyRevenue->firstWhere('month', $monthKey)->amount ?? 0;

                $data[] = [
                    'month' => $monthName,
                    'gmv' => (float) $gmv,
                    'revenue' => (float) $revenue,
                ];
            }
            return $data;
        });

        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $transactions = Transaction::with(['buyer:id,name,email', 'provider:id,name,email', 'escrowLedger:id,transaction_id,amount_held,platform_fee_cut,disbursed_amount,released_at'])
            ->when($search, fn($q) => $q->where('invoice_number', 'like', "%{$search}%"))
            ->when($status, fn($q) => $q->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Auditor/Dashboard', [
            'stats' => $stats,
            'transactions' => $transactions,
            'chartData' => $chartData,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }

    /**
     * Dashboard untuk Operations Staff.
     */
    public function staffDashboard(Request $request): Response
    {
        // Cache statistik staff selama 10 menit
        $stats = \Illuminate\Support\Facades\Cache::remember('staff_dashboard_stats', 600, function () {
            return [
                'pending_count' => Transaction::where('status', 'pending')->count(),
                'shipped_count' => Transaction::where('status', 'shipped')->count(),
                'delivered_count' => Transaction::where('status', 'delivered')->count(),
            ];
        });

        $search = $request->input('search', '');
        $status = $request->input('status', '');

        $transactions = Transaction::with(['buyer:id,name,email', 'provider:id,name,email'])
            ->when($search, fn($q) => $q->where('invoice_number', 'like', "%{$search}%"))
            ->when($status, fn($q) => $q->where('status', $status))
            ->whereIn('status', ['pending', 'paid', 'shipped', 'delivered'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Staff/Dashboard', [
            'stats' => $stats,
            'transactions' => $transactions,
            'filters' => ['search' => $search, 'status' => $status],
        ]);
    }
}
