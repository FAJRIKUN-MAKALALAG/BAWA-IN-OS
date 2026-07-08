import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Search, Filter, ChevronLeft, ChevronRight, Shield, Clock, Users } from 'lucide-react';

const ACTION_COLORS = {
    TRANSITION_STATUS: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    LOGIN: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    LOGOUT: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    CREATE: 'bg-green-500/15 text-green-400 border-green-500/30',
    UPDATE: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
    REFUND: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const ROLE_COLORS = {
    super_admin: 'bg-red-500/15 text-red-400',
    financial_auditor: 'bg-indigo-500/15 text-indigo-400',
    operations_staff: 'bg-green-500/15 text-green-400',
    user: 'bg-gray-500/15 text-gray-400',
};

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    financial_auditor: 'Auditor',
    operations_staff: 'Staff',
    user: 'User',
};

function ActionBadge({ action }) {
    const cls = ACTION_COLORS[action] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium border ${cls}`}>
            {action}
        </span>
    );
}

function PayloadPreview({ payload }) {
    if (!payload || Object.keys(payload).length === 0) return <span className="text-gray-600 text-xs">—</span>;
    const entries = Object.entries(payload).slice(0, 3);
    return (
        <div className="flex flex-wrap gap-1">
            {entries.map(([k, v]) => (
                <span key={k} className="text-[10px] font-mono bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                    {k}: <span className="text-gray-300">{String(v)}</span>
                </span>
            ))}
            {Object.keys(payload).length > 3 && (
                <span className="text-[10px] text-gray-600">+{Object.keys(payload).length - 3} lainnya</span>
            )}
        </div>
    );
}

export default function ActivityLogs({ logs, actions, filters, summary }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [action, setAction] = useState(filters?.action || '');

    const applyFilters = (overrides = {}) => {
        router.get(
            route('activity-logs.index'),
            { search, action, ...overrides },
            { preserveScroll: true, preserveState: true }
        );
    };

    const { data, links, from, to, total } = logs;

    return (
        <DashboardLayout title="Audit Trails">
            <Head title="Audit Trails — Bawa.in" />

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                        <Shield size={18} className="text-violet-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Total Log Aktivitas</p>
                        <p className="text-xl font-bold text-white">{summary.total.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Clock size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Aktivitas Hari Ini</p>
                        <p className="text-xl font-bold text-white">{summary.today.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Users size={18} className="text-green-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Aktor Unik</p>
                        <p className="text-xl font-bold text-white">{summary.unique_actors.toLocaleString('id-ID')}</p>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-800">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            placeholder="Cari nama user atau model ID..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div className="relative">
                        <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        <select
                            value={action}
                            onChange={(e) => {
                                setAction(e.target.value);
                                applyFilters({ action: e.target.value });
                            }}
                            className="pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                        >
                            <option value="">Semua Aksi</option>
                            {actions.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Waktu</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Aktor</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Aksi</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Target</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Payload</th>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-500 text-sm">
                                        Tidak ada log yang ditemukan
                                    </td>
                                </tr>
                            ) : (
                                data.map((log) => {
                                    const modelShort = log.model_type
                                        ? log.model_type.split('\\').pop()
                                        : null;
                                    return (
                                        <tr key={log.id} className="hover:bg-gray-800/40 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div>
                                                    <p className="text-xs text-gray-300">
                                                        {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-mono">
                                                        {new Date(log.created_at).toLocaleTimeString('id-ID')}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.user ? (
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-200">{log.user.name}</p>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[log.user.role] || 'bg-gray-500/15 text-gray-400'}`}>
                                                            {ROLE_LABELS[log.user.role] || log.user.role}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-600 italic">Sistem</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <ActionBadge action={log.action} />
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                {modelShort ? (
                                                    <div>
                                                        <p className="text-[11px] text-gray-400 font-medium">{modelShort}</p>
                                                        <p className="text-[10px] text-gray-600 font-mono truncate max-w-[120px]">{log.model_id}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 hidden lg:table-cell">
                                                <PayloadPreview payload={log.payload} />
                                            </td>
                                            <td className="px-4 py-3 hidden xl:table-cell">
                                                <span className="text-[11px] text-gray-500 font-mono">{log.ip_address || '—'}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-800">
                    <p className="text-xs text-gray-500">
                        Menampilkan {from ?? 0}–{to ?? 0} dari <span className="text-gray-300 font-medium">{total ?? 0}</span> log
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
        </DashboardLayout>
    );
}
