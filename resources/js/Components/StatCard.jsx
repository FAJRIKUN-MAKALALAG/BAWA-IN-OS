export default function StatCard({ icon: Icon, label, value, sub, color = 'violet', trend }) {
    const colorMap = {
        violet: 'from-violet-500 to-indigo-600 shadow-violet-500/20',
        green: 'from-green-500 to-emerald-600 shadow-green-500/20',
        blue: 'from-blue-500 to-cyan-600 shadow-blue-500/20',
        orange: 'from-orange-500 to-amber-600 shadow-orange-500/20',
        red: 'from-red-500 to-rose-600 shadow-red-500/20',
    };

    const trendColor = trend >= 0 ? 'text-green-400' : 'text-red-400';
    const trendPrefix = trend >= 0 ? '↑' : '↓';

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start gap-4 hover:border-gray-700 transition-colors duration-200">
            <div className={`w-11 h-11 bg-gradient-to-br ${colorMap[color]} rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
                <Icon size={20} className="text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-white mt-0.5 truncate">{value}</p>
                <div className="flex items-center gap-2 mt-1">
                    {sub && <p className="text-xs text-gray-500 truncate">{sub}</p>}
                    {trend !== undefined && (
                        <span className={`text-xs font-medium ${trendColor}`}>
                            {trendPrefix} {Math.abs(trend)}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
