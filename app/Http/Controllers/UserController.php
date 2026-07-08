<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Menampilkan daftar user untuk Super Admin.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search', '');
        $role = $request->input('role', '');

        $users = User::query()
            ->when($search, function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($role, fn($q) => $q->where('role', $role))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => ['search' => $search, 'role' => $role],
        ]);
    }

    /**
     * Memperbarui role pengguna.
     */
    public function updateRole(Request $request, string $id)
    {
        $request->validate([
            'role' => 'required|string|in:super_admin,financial_auditor,operations_staff,user',
        ]);

        $user = User::findOrFail($id);

        // Cegah user mengubah role dirinya sendiri agar tidak kehilangan akses
        if ($user->id === auth()->id()) {
            return back()->withErrors(['message' => 'Anda tidak bisa mengubah role akun Anda sendiri.']);
        }

        $user->role = $request->role;
        $user->save();

        // Bersihkan cache dashboard agar data ter-refresh
        Cache::forget('admin_dashboard_stats');
        Cache::forget('auditor_dashboard_stats');
        Cache::forget('staff_dashboard_stats');

        return back()->with('success', "Role {$user->name} berhasil diperbarui.");
    }
}
