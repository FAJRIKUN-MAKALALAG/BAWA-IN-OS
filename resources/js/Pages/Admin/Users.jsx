import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Search, Filter, ChevronLeft, ChevronRight, Edit2, ShieldAlert } from 'lucide-react';

const ROLE_COLORS = {
    super_admin: 'bg-red-500/15 text-red-400 border-red-500/30',
    financial_auditor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    operations_staff: 'bg-green-500/15 text-green-400 border-green-500/30',
    user: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    financial_auditor: 'Financial Auditor',
    operations_staff: 'Operations Staff',
    user: 'User',
};

export default function Users({ users, filters }) {
    const { auth, errors } = usePage().props;
    const currentUser = auth.user;

    const [search, setSearch] = useState(filters?.search || '');
    const [role, setRole] = useState(filters?.role || '');

    const [editingUser, setEditingUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [loading, setLoading] = useState(false);

    const applyFilters = (overrides = {}) => {
        router.get(
            route('users.index'),
            { search, role, ...overrides },
            { preserveScroll: true, preserveState: true }
        );
    };

    const handleUpdateRole = (e) => {
        e.preventDefault();
        if (!selectedRole || !editingUser) return;

        setLoading(true);
        router.post(
            route('users.update-role', editingUser.id),
            { role: selectedRole },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLoading(false);
                    setEditingUser(null);
                },
                onError: () => {
                    setLoading(false);
                }
            }
        );
    };

    const { data, links, from, to, total } = users;

    return (
        <DashboardLayout title="Manajemen Pengguna">
            <Head title="Manajemen Pengguna — Bawa.in" />

            {/* Error notifications */}
            {errors.message && (
                <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
                    <ShieldAlert size={18} />
                    <span>{errors.message}</span>
                </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-800">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Cari user berdasarkan nama atau email..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div className="relative">
                        <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        <select
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value);
                                applyFilters({ role: e.target.value });
                            }}
                            className="pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                        >
                            <option value="">Semua Peran</option>
                            {Object.entries(ROLE_LABELS).map(([val, label]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Nama</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
                                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Peran (Role)</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Bergabung</th>
                                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-500 text-sm">
                                        Tidak ada pengguna yang ditemukan
                                    </td>
                                </tr>
                            ) : (
                                data.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-gray-200 text-sm">
                                                    {u.name} {u.id === currentUser.id && <span className="text-[10px] bg-violet-600/30 text-violet-400 px-1.5 py-0.5 rounded-full ml-1.5">Anda</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm font-medium">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLORS[u.role] || ROLE_COLORS.user}`}>
                                                {ROLE_LABELS[u.role] || u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(u.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {u.id !== currentUser.id ? (
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(u);
                                                        setSelectedRole(u.role);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold px-2.5 py-1 bg-violet-500/10 hover:bg-violet-500/20 rounded-lg border border-violet-500/20 transition-colors"
                                                >
                                                    <Edit2 size={12} />
                                                    Ubah Role
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-600 italic">Terkunci</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-800">
                    <p className="text-xs text-gray-500">
                        Menampilkan {from ?? 0}–{to ?? 0} dari <span className="text-gray-300 font-medium">{total ?? 0}</span> pengguna
                    </p>
                    <div className="flex items-center gap-1">
                        {links.map((link, idx) => {
                            if (link.label.includes('Previous')) {
                                return (
                                    <Link key={idx} href={link.url || '#'}
                                        className={`p-1.5 rounded-lg transition-colors ${link.url ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-700 cursor-not-allowed'}`}
                                        preserveScroll
                                    >
                                        <ChevronLeft size={16} />
                                    </Link>
                                );
                            }
                            if (link.label.includes('Next')) {
                                return (
                                    <Link key={idx} href={link.url || '#'}
                                        className={`p-1.5 rounded-lg transition-colors ${link.url ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-700 cursor-not-allowed'}`}
                                        preserveScroll
                                    >
                                        <ChevronRight size={16} />
                                    </Link>
                                );
                            }
                            return (
                                <Link key={idx} href={link.url || '#'}
                                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors
                                        ${link.active ? 'bg-violet-600 text-white' : link.url ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-700'}`}
                                    preserveScroll
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Edit Role Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-base font-bold text-white mb-2">Ubah Peran Pengguna</h3>
                        <p className="text-xs text-gray-500 mb-5">
                            Pilih hak akses baru untuk <span className="font-semibold text-gray-300">{editingUser.name}</span> ({editingUser.email}).
                        </p>

                        <form onSubmit={handleUpdateRole} className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pilih Role</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors"
                                >
                                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 justify-end pt-2 border-t border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
