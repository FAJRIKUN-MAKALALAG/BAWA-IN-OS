import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import StatCard from '@/Components/StatCard';
import TransactionTable from '@/Components/TransactionTable';
import { Clock, Truck, PackageCheck } from 'lucide-react';

export default function StaffDashboard({ stats, transactions, filters }) {
    return (
        <DashboardLayout title="Operations Staff · Monitoring Pengiriman">
            <Head title="Staff Dashboard — Bawa.in" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <StatCard
                    icon={Clock}
                    label="Menunggu Pembayaran"
                    value={stats.pending_count.toLocaleString('id-ID')}
                    sub="Status: Pending"
                    color="orange"
                />
                <StatCard
                    icon={Truck}
                    label="Dalam Pengiriman"
                    value={stats.shipped_count.toLocaleString('id-ID')}
                    sub="Status: Shipped"
                    color="violet"
                />
                <StatCard
                    icon={PackageCheck}
                    label="Terkirim ke Pembeli"
                    value={stats.delivered_count.toLocaleString('id-ID')}
                    sub="Status: Delivered"
                    color="green"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">Monitoring Transaksi Aktif</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Transaksi yang sedang dalam proses</p>
                    </div>
                </div>
                <TransactionTable
                    transactions={transactions}
                    filters={filters}
                    baseRoute="/staff/dashboard"
                />
            </div>
        </DashboardLayout>
    );
}
