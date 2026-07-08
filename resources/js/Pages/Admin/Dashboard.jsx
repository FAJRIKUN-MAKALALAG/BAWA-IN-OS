import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import StatCard from '@/Components/StatCard';
import TransactionTable from '@/Components/TransactionTable';
import FinancialChart from '@/Components/FinancialChart';
import {
    ArrowLeftRight, TrendingUp, ShieldCheck, Wallet,
    Play, RefreshCw, Wifi, WifiOff, Zap, ZapOff, Trash2, AlertTriangle,
} from 'lucide-react';

const formatRupiah = (value) => {
    const n = parseFloat(value) || 0;
    if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)}M`;
    if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(2)}jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
};

// ── interval constants ─────────────────────────────
const STATS_INTERVAL  = 2_000;   // 2 detik  — fetch JSON stats
const TABLE_INTERVAL  = 3_000;   // 3 detik  — Inertia partial reload tabel

export default function AdminDashboard({ stats: initialStats, transactions, chartData, filters }) {
    const [stats,            setStats]            = useState(initialStats);
    const [simulatorEnabled, setSimulatorEnabled] = useState(false);
    const [simulatedCount,   setSimulatedCount]   = useState(0);
    const [lastRefreshed,    setLastRefreshed]     = useState(new Date());
    const [isLive,           setIsLive]           = useState(true);
    const [loading, setLoading] = useState({ start: false, stop: false, reset: false, simulate: false });
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [tableRefreshing,  setTableRefreshing]  = useState(false);

    const statsTimerRef  = useRef(null);
    const tableTimerRef  = useRef(null);
    const isLiveRef      = useRef(true);   // untuk akses di dalam callback tanpa re-create

    // ── 1. Fetch JSON stats (ringan, tidak reload halaman) ──────────────
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/dashboard-live', {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) return;
            const data = await res.json();
            setStats({
                total_transactions: data.total_transactions,
                total_gmv:          parseFloat(data.total_gmv),
                platform_revenue:   parseFloat(data.platform_revenue),
                active_escrow:      data.active_escrow,
            });
            setSimulatorEnabled(data.simulator_enabled);
            setSimulatedCount(data.simulated_count ?? 0);
            setLastRefreshed(new Date());
        } catch (_) { /* diam jika offline */ }
    }, []);

    // ── 2. Inertia partial reload — hanya prop 'transactions' ──────────
    const reloadTable = useCallback(() => {
        setTableRefreshing(true);
        router.reload({
            only: ['transactions'],
            preserveScroll: true,
            onFinish: () => setTableRefreshing(false),
        });
    }, []);

    // ── 3. Mulai / stop semua polling ──────────────────────────────────
    const startPolling = useCallback(() => {
        if (statsTimerRef.current) return; // sudah berjalan

        statsTimerRef.current = setInterval(() => {
            if (isLiveRef.current) fetchStats();
        }, STATS_INTERVAL);

        tableTimerRef.current = setInterval(() => {
            if (isLiveRef.current) reloadTable();
        }, TABLE_INTERVAL);
    }, [fetchStats, reloadTable]);

    const stopPolling = useCallback(() => {
        clearInterval(statsTimerRef.current);
        clearInterval(tableTimerRef.current);
        statsTimerRef.current = null;
        tableTimerRef.current = null;
    }, []);

    // ── 4. Page Visibility API — pause saat tab tidak aktif ───────────
    useEffect(() => {
        const handleVisibility = () => {
            if (document.hidden) {
                isLiveRef.current = false;
            } else {
                isLiveRef.current = isLive;
                if (isLive) {
                    fetchStats();
                    reloadTable();
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [isLive, fetchStats, reloadTable]);

    // ── 5. Mount/unmount ──────────────────────────────────────────────
    useEffect(() => {
        fetchStats();   // langsung fetch saat halaman dibuka
        startPolling();
        return () => stopPolling();
    }, []);             // sekali saja

    // ── 6. Toggle live ────────────────────────────────────────────────
    const toggleLive = () => {
        const next = !isLive;
        isLiveRef.current = next;
        setIsLive(next);
        if (next) {
            fetchStats();
            reloadTable();
            startPolling();
        } else {
            stopPolling();
        }
    };

    // ── 7. Manual refresh ─────────────────────────────────────────────
    const handleManualRefresh = () => {
        fetchStats();
        reloadTable();
    };

    // ── Helpers ────────────────────────────────────────────────────────
    const setLoad = (key, val) => setLoading(p => ({ ...p, [key]: val }));

    const afterAction = () => { fetchStats(); reloadTable(); };

    const handleStartEngine = () => {
        setLoad('start', true);
        router.post('/admin/simulate/engine/start', {}, {
            preserveScroll: true,
            onSuccess: () => { setLoad('start', false); afterAction(); },
            onError:   () => setLoad('start', false),
        });
    };

    const handleStopEngine = () => {
        setLoad('stop', true);
        router.post('/admin/simulate/engine/stop', {}, {
            preserveScroll: true,
            onSuccess: () => { setLoad('stop', false); afterAction(); },
            onError:   () => setLoad('stop', false),
        });
    };

    const handleReset = () => {
        setLoad('reset', true);
        setShowResetConfirm(false);
        router.delete('/admin/simulate/engine/reset', {
            preserveScroll: true,
            onSuccess: () => { setLoad('reset', false); afterAction(); },
            onError:   () => setLoad('reset', false),
        });
    };

    const handleSimulate = () => {
        setLoad('simulate', true);
        router.post('/admin/simulate/new-transaction', {}, {
            preserveScroll: true,
            onSuccess: () => { setLoad('simulate', false); afterAction(); },
            onError:   () => setLoad('simulate', false),
        });
    };

    // ── Render ─────────────────────────────────────────────────────────
    return (
        <DashboardLayout title="Super Admin · Control Center">
            <Head title="Admin Dashboard — Bawa.in" />

            {/* ═══ ANTIGRAVITY ENGINE PANEL ═══ */}
            <div className={`mb-4 rounded-2xl border transition-all duration-300 ${
                simulatorEnabled
                    ? 'bg-violet-950/40 border-violet-500/30 shadow-lg shadow-violet-500/10'
                    : 'bg-gray-900 border-gray-800'
            }`}>
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Status */}
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${simulatorEnabled ? 'bg-violet-500/20' : 'bg-gray-800'}`}>
                            {simulatorEnabled
                                ? <Zap size={18} className="text-violet-400 animate-pulse" />
                                : <ZapOff size={18} className="text-gray-500" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">Antigravity Engine</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    simulatorEnabled
                                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                        : 'bg-gray-700 text-gray-400 border-gray-600'
                                }`}>
                                    {simulatorEnabled ? '● AKTIF' : '○ NON-AKTIF'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {simulatorEnabled
                                    ? `Traffic simulator berjalan · ${simulatedCount} data simulasi`
                                    : 'Traffic simulator belum aktif'}
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {!simulatorEnabled ? (
                            <button onClick={handleStartEngine} disabled={loading.start} id="btn-engine-start"
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-violet-500/30 transition-all disabled:opacity-50">
                                <Zap size={13} />
                                {loading.start ? 'Memulai...' : '▶ Start Engine'}
                            </button>
                        ) : (
                            <button onClick={handleStopEngine} disabled={loading.stop} id="btn-engine-stop"
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-xl transition-all disabled:opacity-50">
                                <ZapOff size={13} />
                                {loading.stop ? 'Menghentikan...' : '⏹ Stop Engine'}
                            </button>
                        )}
                        <button onClick={handleSimulate} disabled={loading.simulate} id="btn-one-shot"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl transition-all disabled:opacity-50">
                            <Play size={11} fill="currentColor" />
                            {loading.simulate ? 'Dispatching...' : '1 Siklus'}
                        </button>
                        {simulatedCount > 0 && (
                            <button onClick={() => setShowResetConfirm(true)} disabled={loading.reset} id="btn-reset"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all disabled:opacity-50">
                                <Trash2 size={11} />
                                {loading.reset ? 'Menghapus...' : `Reset (${simulatedCount})`}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ LIVE STATUS BAR ═══ */}
            <div className="flex items-center justify-between mb-5 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-xs text-gray-400 font-medium">
                        {isLive
                            ? `Live · stats tiap ${STATS_INTERVAL / 1000}s · tabel tiap ${TABLE_INTERVAL / 1000}s`
                            : 'Auto-refresh nonaktif'}
                    </span>
                    {tableRefreshing && (
                        <span className="text-[10px] text-violet-400 animate-pulse">↻ memuat...</span>
                    )}
                    <span className="text-[10px] text-gray-600 hidden sm:inline">
                        · {lastRefreshed.toLocaleTimeString('id-ID')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleManualRefresh} title="Refresh sekarang"
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                        <RefreshCw size={13} />
                    </button>
                    <button onClick={toggleLive}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                            isLive
                                ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                        }`}>
                        {isLive ? <Wifi size={11} /> : <WifiOff size={11} />}
                        {isLive ? 'Live' : 'Paused'}
                    </button>
                </div>
            </div>

            {/* ═══ STAT CARDS ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatCard icon={ArrowLeftRight} label="Total Transaksi"       value={stats.total_transactions.toLocaleString('id-ID')} sub="Semua status"                           color="violet" trend={12} />
                <StatCard icon={TrendingUp}     label="Gross Merchandise Value" value={formatRupiah(stats.total_gmv)}                  sub="Kumulatif semua transaksi"              color="blue"   trend={8}  />
                <StatCard icon={Wallet}         label="Pendapatan Platform"   value={formatRupiah(stats.platform_revenue)}             sub="Fee 5% dari GMV"                        color="green"  trend={5}  />
                <StatCard icon={ShieldCheck}    label="Dana dalam Escrow"     value={stats.active_escrow.toLocaleString('id-ID')}      sub="Transaksi aktif (paid/shipped/delivered)" color="orange"           />
            </div>

            {/* ═══ CHART ═══ */}
            <div className="mb-6">
                <FinancialChart chartData={chartData} />
            </div>

            {/* ═══ TRANSACTION TABLE ═══ */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-base font-semibold text-white">Daftar Transaksi</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Diperbarui setiap {TABLE_INTERVAL / 1000} detik
                        </p>
                    </div>
                </div>

                {/* Overlay tipis saat tabel sedang refresh */}
                <div className={`relative transition-opacity duration-300 ${tableRefreshing ? 'opacity-70' : 'opacity-100'}`}>
                    <TransactionTable
                        transactions={transactions}
                        filters={filters}
                        baseRoute="/admin/dashboard"
                    />
                    {tableRefreshing && (
                        <div className="absolute inset-0 rounded-xl pointer-events-none border border-violet-500/20" />
                    )}
                </div>
            </div>

            {/* ═══ RESET CONFIRM MODAL ═══ */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-red-500/20 rounded-xl">
                                <AlertTriangle size={20} className="text-red-400" />
                            </div>
                            <h3 className="text-base font-bold text-white">Hapus Data Simulasi?</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-5">
                            <strong className="text-red-400">{simulatedCount} transaksi simulasi</strong> beserta
                            escrow ledger-nya akan dihapus permanen. Data asli tidak terpengaruh.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowResetConfirm(false)}
                                className="flex-1 py-2 text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
                                Batal
                            </button>
                            <button onClick={handleReset}
                                className="flex-1 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors">
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
