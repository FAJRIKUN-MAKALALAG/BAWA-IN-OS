<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Menampilkan halaman Audit Trails dengan filter dan pagination.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search', '');
        $action = $request->input('action', '');

        $logs = ActivityLog::with('user:id,name,email,role')
            ->when($search, function ($q) use ($search) {
                $q->whereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"))
                    ->orWhere('model_id', 'like', "%{$search}%");
            })
            ->when($action, fn($q) => $q->where('action', $action))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        // Ambil daftar action unik untuk filter dropdown
        $actions = ActivityLog::query()
            ->select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        return Inertia::render('Admin/ActivityLogs', [
            'logs' => $logs,
            'actions' => $actions,
            'filters' => ['search' => $search, 'action' => $action],
            'summary' => [
                'total' => ActivityLog::count(),
                'today' => ActivityLog::whereDate('created_at', today())->count(),
                'unique_actors' => ActivityLog::distinct('user_id')->count('user_id'),
            ],
        ]);
    }
}
