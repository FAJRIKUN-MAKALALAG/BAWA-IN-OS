import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    LayoutDashboard,
    ArrowLeftRight,
    FileText,
    ShieldCheck,
    Users,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Bell,
} from 'lucide-react';

const roleMenus = {
    super_admin: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/transactions', label: 'Transaksi', icon: ArrowLeftRight },
        { href: '/admin/activity-logs', label: 'Audit Trails', icon: FileText },
        { href: '/admin/users', label: 'Manajemen User', icon: Users },
    ],
    financial_auditor: [
        { href: '/auditor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/auditor/transactions', label: 'Laporan Transaksi', icon: ArrowLeftRight },
        { href: '/auditor/activity-logs', label: 'Audit Trails', icon: FileText },
    ],
    operations_staff: [
        { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/staff/transactions', label: 'Monitoring', icon: ArrowLeftRight },
    ],
};

const roleBadgeStyles = {
    super_admin: 'bg-red-500/20 text-red-400 border border-red-500/30',
    financial_auditor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    operations_staff: 'bg-green-500/20 text-green-400 border border-green-500/30',
    user: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

const roleLabels = {
    super_admin: 'Super Admin',
    financial_auditor: 'Financial Auditor',
    operations_staff: 'Operations Staff',
    user: 'User',
};

export default function DashboardLayout({ title, children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menus = roleMenus[user.role] || [];

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const isActive = (href) => window.location.pathname.startsWith(href);

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex">
            {/* Overlay mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-30 transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto flex flex-col`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <ShieldCheck size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">Bawa.in</span>
                    </div>
                    <button
                        className="lg:hidden text-gray-400 hover:text-white"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* User info */}
                <div className="px-4 py-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${roleBadgeStyles[user.role] || roleBadgeStyles.user}`}>
                                {roleLabels[user.role] || 'User'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Nav menu */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {menus.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                                    ${active
                                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={17} className={active ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'} />
                                <span className="flex-1">{item.label}</span>
                                {active && <ChevronRight size={14} className="text-violet-400 opacity-70" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="px-3 py-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 group"
                    >
                        <LogOut size={17} className="text-red-500/70 group-hover:text-red-400" />
                        Keluar
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                {/* Topbar */}
                <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-10">
                    <div className="flex items-center justify-between px-4 sm:px-6 h-14">
                        <div className="flex items-center gap-3">
                            <button
                                className="lg:hidden text-gray-400 hover:text-white p-1"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu size={22} />
                            </button>
                            <h1 className="text-base font-semibold text-white">{title}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                <Bell size={18} />
                                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
