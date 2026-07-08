import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import TransactionTable from '@/Components/TransactionTable';

export default function Transactions({ transactions, filters }) {
    return (
        <DashboardLayout title="Manajemen Transaksi">
            <Head title="Manajemen Transaksi — Bawa.in" />

            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-semibold text-white">Semua Transaksi Platform</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Daftar transaksi jastip secara komprehensif</p>
                    </div>
                </div>
                <TransactionTable
                    transactions={transactions}
                    filters={filters}
                    baseRoute="/admin/transactions"
                />
            </div>
        </DashboardLayout>
    );
}
