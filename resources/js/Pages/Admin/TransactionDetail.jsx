import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import TrackingStepper from '@/Components/TrackingStepper';
import StatusBadge from '@/Components/StatusBadge';
import { ArrowLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const formatRupiah = (value) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

const NEXT_STATUS_MAP = {
    pending: { label: 'Konfirmasi Bayar (→ Paid)', value: 'paid', color: 'blue' },
    paid: { label: 'Tandai Dikirim (→ Shipped)', value: 'shipped', color: 'violet' },
    shipped: { label: 'Konfirmasi Tiba (→ Delivered)', value: 'delivered', color: 'cyan' },
    delivered: { label: 'Cairkan Dana (→ Released)', value: 'released', color: 'green' },
};

const REFUND_ELIGIBLE = ['paid', 'shipped', 'delivered'];

export default function TransactionDetail({ transaction }) {
    const [loading, setLoading] = useState(false);
    const [confirmRefund, setConfirmRefund] = useState(false);

    const nextStep = NEXT_STATUS_MAP[transaction.status];
    const canRefund = REFUND_ELIGIBLE.includes(transaction.status);

    const handleTransition = (newStatus) => {
        setLoading(true);
        router.post(
            route('transactions.transition', transaction.id),
            { new_status: newStatus },
            {
                preserveScroll: true,
                onSuccess: () => { setLoading(false); setConfirmRefund(false); },
                onError: () => setLoading(false),
            }
        );
    };

    const ledger = transaction.escrow_ledger;
    const isTerminal = ['released', 'refunded'].includes(transaction.status);

    return (
        <DashboardLayout title="Detail Transaksi">
            <Head title={`${transaction.invoice_number} — Bawa.in`} />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
                <Link href="/admin/dashboard" className="hover:text-gray-300 transition-colors flex items-center gap-1.5">
                    <ArrowLeft size={14} />
                    Dashboard
                </Link>
                <ChevronRight size={14} />
                <span className="text-gray-300 font-mono">{transaction.invoice_number}</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* LEFT: Info transaksi + Stepper */}
                <div className="xl:col-span-2 space-y-5">
                    {/* Header Card */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Nomor Invoice</p>
                                <h2 className="text-lg font-bold font-mono text-violet-400">{transaction.invoice_number}</h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Dibuat: {new Date(transaction.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                            </div>
                            <div className="flex flex-col items-start sm:items-end gap-2">
                                <StatusBadge status={transaction.status} />
                                <p className="text-xl font-bold text-white">{formatRupiah(transaction.gross_amount)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-800">
                            <div>
                                <p className="text-xs text-gray-500 mb-1 font-medium">Buyer (Pembeli)</p>
                                <p className="text-sm font-semibold text-white">{transaction.buyer?.name}</p>
                                <p className="text-xs text-gray-500">{transaction.buyer?.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1 font-medium">Provider (Jastiper)</p>
                                <p className="text-sm font-semibold text-white">{transaction.provider?.name}</p>
                                <p className="text-xs text-gray-500">{transaction.provider?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Live Tracking Stepper */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <div className="mb-5">
                            <h3 className="text-sm font-semibold text-white">Live Tracking Pengiriman</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Progres perjalanan transaksi dari awal hingga selesai</p>
                        </div>
                        <TrackingStepper status={transaction.status} trackingLogs={transaction.tracking_logs} />
                    </div>

                    {/* Action Panel */}
                    {!isTerminal && (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-white mb-4">Aksi Transisi Status</h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                                {nextStep && (
                                    <button
                                        onClick={() => handleTransition(nextStep.value)}
                                        disabled={loading}
                                        className="flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Memproses...' : nextStep.label}
                                    </button>
                                )}
                                {canRefund && !confirmRefund && (
                                    <button
                                        onClick={() => setConfirmRefund(true)}
                                        disabled={loading}
                                        className="flex-1 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        Refund Transaksi
                                    </button>
                                )}
                                {confirmRefund && (
                                    <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle size={15} className="text-red-400 shrink-0" />
                                            <p className="text-xs text-red-300 font-medium">Konfirmasi Refund</p>
                                        </div>
                                        <p className="text-xs text-red-400/80 mb-3">
                                            Dana akan dikembalikan ke pembeli. Tindakan ini tidak dapat dibatalkan.
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleTransition('refunded')}
                                                disabled={loading}
                                                className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors"
                                            >
                                                Ya, Refund
                                            </button>
                                            <button
                                                onClick={() => setConfirmRefund(false)}
                                                className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Escrow Ledger */}
                <div className="space-y-5">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-white mb-4">Rekening Bersama (Escrow)</h3>
                        {ledger ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2.5 border-b border-gray-800">
                                    <span className="text-xs text-gray-500">Gross Amount</span>
                                    <span className="text-sm font-semibold text-white">{formatRupiah(ledger.amount_held)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-gray-800">
                                    <span className="text-xs text-gray-500">Platform Fee (5%)</span>
                                    <span className="text-sm font-medium text-red-400">- {formatRupiah(ledger.platform_fee_cut)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5 border-b border-gray-800">
                                    <span className="text-xs text-gray-500">PG Fee (Flat)</span>
                                    <span className="text-sm font-medium text-red-400">- Rp 4.500</span>
                                </div>
                                <div className="flex justify-between items-center py-2.5">
                                    <span className="text-xs text-gray-400 font-semibold">Dana ke Provider</span>
                                    <span className="text-base font-bold text-green-400">{formatRupiah(ledger.disbursed_amount)}</span>
                                </div>
                                <div className="pt-3 mt-1 border-t border-gray-800 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-gray-500">Dana ditahan sejak</span>
                                        <span className="text-[11px] text-gray-400">
                                            {ledger.held_at ? new Date(ledger.held_at).toLocaleDateString('id-ID') : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-gray-500">Dana dicairkan</span>
                                        <span className="text-[11px] text-gray-400">
                                            {ledger.released_at ? new Date(ledger.released_at).toLocaleDateString('id-ID') : 'Belum dicairkan'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-xs text-gray-500">Ledger akan terbuat setelah pembayaran dikonfirmasi.</p>
                            </div>
                        )}
                    </div>

                    {/* Tracking log count */}
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-white mb-3">Riwayat Log</h3>
                        {transaction.tracking_logs?.length > 0 ? (
                            <div className="space-y-2">
                                {transaction.tracking_logs.map((log, idx) => (
                                    <div key={idx} className="flex gap-3 text-xs">
                                        <span className="text-gray-600 shrink-0 pt-0.5">{new Date(log.created_at).toLocaleString('id-ID', { timeStyle: 'short', dateStyle: 'short' })}</span>
                                        <span className="text-gray-400">{log.details || log.status}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 text-center py-3">Belum ada log tersedia.</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
