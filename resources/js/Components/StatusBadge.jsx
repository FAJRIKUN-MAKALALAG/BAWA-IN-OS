const statusColors = {
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    paid: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    shipped: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    delivered: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    released: 'bg-green-500/15 text-green-400 border-green-500/30',
    refunded: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const statusLabels = {
    pending: 'Pending',
    paid: 'Dibayar',
    shipped: 'Dikirim',
    delivered: 'Terkirim',
    released: 'Dana Dicairkan',
    refunded: 'Refunded',
};

export default function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'pending' ? 'bg-yellow-400' : status === 'paid' ? 'bg-blue-400' : status === 'shipped' ? 'bg-violet-400' : status === 'delivered' ? 'bg-cyan-400' : status === 'released' ? 'bg-green-400' : 'bg-red-400'}`}></span>
            {statusLabels[status] || status}
        </span>
    );
}
