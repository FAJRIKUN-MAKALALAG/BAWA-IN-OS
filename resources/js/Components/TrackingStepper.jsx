import { CheckCircle, Circle, Clock, Package, Truck, PackageCheck, Wallet, XCircle } from 'lucide-react';

const STEPS = [
    {
        status: 'pending',
        label: 'Menunggu Pembayaran',
        description: 'Transaksi dibuat, menunggu konfirmasi pembayaran dari buyer.',
        icon: Clock,
    },
    {
        status: 'paid',
        label: 'Pembayaran Diterima',
        description: 'Dana berhasil diterima dan ditahan di rekening escrow Bawa.in.',
        icon: Wallet,
    },
    {
        status: 'shipped',
        label: 'Paket Dikirim',
        description: 'Jastiper telah mengambil paket dan dalam perjalanan ke pembeli.',
        icon: Truck,
    },
    {
        status: 'delivered',
        label: 'Paket Tiba',
        description: 'Paket telah sampai di tangan pembeli, menunggu konfirmasi.',
        icon: PackageCheck,
    },
    {
        status: 'released',
        label: 'Dana Dicairkan',
        description: 'Pembeli mengkonfirmasi penerimaan. Dana diserahkan ke provider.',
        icon: CheckCircle,
    },
];

const STATUS_ORDER = ['pending', 'paid', 'shipped', 'delivered', 'released'];

export default function TrackingStepper({ status, trackingLogs = [] }) {
    const isRefunded = status === 'refunded';
    const currentIdx = STATUS_ORDER.indexOf(status);

    if (isRefunded) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                    <XCircle className="text-red-400" size={24} />
                </div>
                <div>
                    <p className="text-red-300 font-semibold">Transaksi Direfund</p>
                    <p className="text-red-400/70 text-sm mt-0.5">Dana dikembalikan ke pembeli. Transaksi ini telah dibatalkan.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {STEPS.map((step, idx) => {
                const isDone = idx < currentIdx || (idx === currentIdx && status === 'released');
                const isActive = idx === currentIdx && status !== 'released';
                const isFuture = idx > currentIdx;
                const Icon = step.icon;

                // Cari tracking log yang relevan untuk step ini
                const log = trackingLogs.find(l => l.status === step.status);

                return (
                    <div key={step.status} className="flex gap-4">
                        {/* Line + Icon */}
                        <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500
                                ${isDone ? 'bg-green-500/20 border-2 border-green-500 shadow-lg shadow-green-500/20'
                                    : isActive ? 'bg-violet-500/20 border-2 border-violet-500 shadow-lg shadow-violet-500/20 animate-pulse'
                                    : 'bg-gray-800 border-2 border-gray-700'}`}>
                                <Icon
                                    size={18}
                                    className={isDone ? 'text-green-400' : isActive ? 'text-violet-400' : 'text-gray-600'}
                                />
                            </div>
                            {idx < STEPS.length - 1 && (
                                <div className={`w-0.5 flex-1 my-1 transition-all duration-700 ${idx < currentIdx ? 'bg-green-500/50' : 'bg-gray-800'}`} style={{ minHeight: '32px' }} />
                            )}
                        </div>

                        {/* Content */}
                        <div className={`pb-6 min-w-0 flex-1 pt-1.5 ${idx === STEPS.length - 1 ? 'pb-0' : ''}`}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm font-semibold ${isDone ? 'text-green-300' : isActive ? 'text-violet-300' : 'text-gray-600'}`}>
                                    {step.label}
                                </p>
                                {isDone && (
                                    <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-medium">Selesai</span>
                                )}
                                {isActive && (
                                    <span className="text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full font-medium">Proses</span>
                                )}
                            </div>
                            <p className={`text-xs mt-0.5 ${isFuture ? 'text-gray-600' : 'text-gray-400'}`}>
                                {step.description}
                            </p>
                            {log && (
                                <div className="mt-2 bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2">
                                    <p className="text-[11px] text-gray-300">{log.details}</p>
                                    {log.latitude && log.longitude && (
                                        <p className="text-[10px] text-gray-500 mt-1 font-mono">
                                            📍 {parseFloat(log.latitude).toFixed(5)}, {parseFloat(log.longitude).toFixed(5)}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-gray-600 mt-1">
                                        {new Date(log.created_at).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
