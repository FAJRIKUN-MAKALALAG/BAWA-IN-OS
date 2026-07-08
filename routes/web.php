<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::get('/admin/dashboard', [DashboardController::class, 'adminDashboard'])
    ->middleware(['auth', 'verified', 'role:super_admin'])
    ->name('admin.dashboard');

Route::get('/auditor/dashboard', [DashboardController::class, 'auditorDashboard'])
    ->middleware(['auth', 'verified', 'role:financial_auditor,super_admin'])
    ->name('auditor.dashboard');

Route::get('/staff/dashboard', [DashboardController::class, 'staffDashboard'])
    ->middleware(['auth', 'verified', 'role:operations_staff,super_admin'])
    ->name('staff.dashboard');

use App\Http\Controllers\TransactionController;

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\SimulationController;

use App\Http\Controllers\UserController;

Route::middleware('auth')->group(function () {
    Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');
    Route::post('/transactions/{id}/transition', [TransactionController::class, 'transition'])->name('transactions.transition');
    Route::get('/admin/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/admin/transactions/{id}', [TransactionController::class, 'show'])->name('transactions.show');

    // Simulation routes (Super Admin only)
    Route::prefix('admin/simulate')->middleware('role:super_admin')->group(function () {
        Route::post('/new-transaction', [SimulationController::class, 'simulateTransaction'])->name('simulate.new-transaction');
        Route::post('/payment', [SimulationController::class, 'simulatePaymentWebhook'])->name('simulate.payment');

        // Antigravity Engine toggle & reset
        Route::post('/engine/start', [SimulationController::class, 'startEngine'])->name('simulate.engine.start');
        Route::post('/engine/stop', [SimulationController::class, 'stopEngine'])->name('simulate.engine.stop');
        Route::delete('/engine/reset', [SimulationController::class, 'resetSimulationData'])->name('simulate.engine.reset');
    });

    // Live data API endpoint untuk auto-refresh dashboard
    Route::get('/api/admin/dashboard-live', function () {
        return response()->json([
            'total_transactions' => \App\Models\Transaction::count(),
            'total_gmv'          => \App\Models\Transaction::sum('gross_amount'),
            'platform_revenue'   => \App\Models\EscrowLedger::sum('platform_fee_cut'),
            'active_escrow'      => \App\Models\Transaction::whereIn('status', ['paid', 'shipped', 'delivered'])->count(),
            'simulated_count'    => \App\Models\Transaction::where('is_simulated', true)->count(),
            'simulator_enabled'  => (bool) \Illuminate\Support\Facades\Cache::get('simulator:enabled', false),
        ]);
    })->middleware('role:super_admin,financial_auditor')->name('api.dashboard-live');
    Route::get('/admin/users', [UserController::class, 'index'])->middleware('role:super_admin')->name('users.index');
    Route::post('/admin/users/{id}/role', [UserController::class, 'updateRole'])->middleware('role:super_admin')->name('users.update-role');
    Route::get('/admin/activity-logs', [ActivityLogController::class, 'index'])
        ->middleware('role:super_admin,financial_auditor')
        ->name('activity-logs.index');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

use App\Http\Controllers\PaymentWebhookController;

Route::post('/payment/webhook', [PaymentWebhookController::class, 'handle'])->name('payment.webhook');

require __DIR__.'/auth.php';
