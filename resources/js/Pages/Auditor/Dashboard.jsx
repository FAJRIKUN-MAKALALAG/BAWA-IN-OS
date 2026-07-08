import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import StatCard from '@/Components/StatCard';
import TransactionTable from '@/Components/TransactionTable';
import FinancialChart from '@/Components/FinancialChart';
import { Wallet, TrendingUp, ShieldCheck } from 'lucide-react';

const formatRupiah = (value) => {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

export default function AuditorDashboard({ stats, transactions, chartData, filters }) {
    return (
        <DashboardLayout title="Financial Auditor · Laporan Keuangan">
            <Head title="Auditor Dashboard — Bawa.in" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                    icon={Wallet}
                    label="Pendapatan Platform"
                    value={formatRupiah(stats.platform_revenue)}
                    sub="Total fee 5% dari semua transaksi"
                    color="green"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Total Dicairkan ke Provider"
                    value={formatRupiah(stats.total_disbursed)}
                    sub="Net setelah fee dipotong"
                    color="blue"
                />
                <StatCard
                    icon={ShieldCheck}
                    label="Dana Tertahan (Escrow)"
                    value={formatRupiah(stats.total_held)}
                    sub="Dana aktif belum direlease"
                    color="orange"
                />
            </div>

            {/* Financial Chart */}
            <div className="mb-6">
                <FinancialChart chartData={chartData} />
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">Laporan Transaksi</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Data finansial seluruh transaksi platform</p>
                    </div>
                </div>
                <TransactionTable
                    transactions={transactions}
                    filters={filters}
                    baseRoute="/auditor/dashboard"
                />
            </div>
        </DashboardLayout>
    );
}
