import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import StatusBadge from './StatusBadge';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = ['', 'pending', 'paid', 'shipped', 'delivered', 'released', 'refunded'];
const STATUS_LABELS = {
    '': 'Semua Status',
    pending: 'Pending',
    paid: 'Dibayar',
    shipped: 'Dikirim',
    delivered: 'Terkirim',
    released: 'Dicairkan',
    refunded: 'Refunded',
};

export default function TransactionTable({ transactions, filters, baseRoute }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');

    const applyFilters = () => {
        router.get(baseRoute, { search, status }, { preserveScroll: true, preserveState: true });
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') applyFilters();
    };

    const formatRupiah = (value) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const { data, links, from, to, total } = transactions;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-800">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        placeholder="Cari nomor invoice atau nama..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                </div>
                {/* Status filter */}
                <div className="relative">
                    <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            router.get(baseRoute, { search, status: e.target.value }, { preserveScroll: true, preserveState: true });
                        }}
                        className="pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                    >
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Invoice</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Buyer</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Provider</th>
                            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Nominal</th>
                            <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Tanggal</th>
                            <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-gray-500">
                                    Tidak ada transaksi yang ditemukan
                                </td>
                            </tr>
                        ) : (
                            data.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-violet-400">{tx.invoice_number}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-200 text-xs">{tx.buyer?.name ?? '-'}</p>
                                            <p className="text-gray-500 text-[11px]">{tx.buyer?.email ?? ''}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <div>
                                            <p className="font-medium text-gray-200 text-xs">{tx.provider?.name ?? '-'}</p>
                                            <p className="text-gray-500 text-[11px]">{tx.provider?.email ?? ''}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="text-white font-semibold text-xs">{formatRupiah(tx.gross_amount)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={tx.status} />
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                                        {new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Link
                                            href={`/admin/transactions/${tx.id}`}
                                            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium px-2.5 py-1 bg-violet-500/10 hover:bg-violet-500/20 rounded-lg border border-violet-500/20 transition-colors"
                                        >
                                            Detail
                                        </Link>
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
                    Menampilkan {from ?? 0}–{to ?? 0} dari <span className="text-gray-300 font-medium">{total ?? 0}</span> transaksi
                </p>
                <div className="flex items-center gap-1">
                    {links.map((link, idx) => {
                        if (link.label.includes('Previous')) {
                            return (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    className={`p-1.5 rounded-lg transition-colors ${link.url ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-700 cursor-not-allowed'}`}
                                    preserveScroll
                                >
                                    <ChevronLeft size={16} />
                                </Link>
                            );
                        }
                        if (link.label.includes('Next')) {
                            return (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    className={`p-1.5 rounded-lg transition-colors ${link.url ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-700 cursor-not-allowed'}`}
                                    preserveScroll
                                >
                                    <ChevronRight size={16} />
                                </Link>
                            );
                        }
                        return (
                            <Link
                                key={idx}
                                href={link.url || '#'}
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
    );
}
