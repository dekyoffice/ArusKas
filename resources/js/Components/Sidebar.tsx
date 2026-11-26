import { Link, usePage, router } from '@inertiajs/react';
import { LayoutDashboard, Wallet, Plane, Coffee, FileText, Users, Eye, X, LogOut, AlertCircle, History } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const { url, props } = usePage() as any;
    const user = props.auth.user;
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
        { id: 'subkegiatan', label: 'Sub Kegiatan', icon: Wallet, route: '/sub-kegiatan' },
        { id: 'monitoring', label: 'Monitoring', icon: Eye, route: '/monitoring' },
        { id: 'pd', label: 'Perjalanan Dinas', icon: Plane, route: '/perjalanan-dinas' },
        { id: 'mm', label: 'Makan & Minum', icon: Coffee, route: '/makan-minum' },
        { id: 'dpa', label: 'DPA', icon: FileText, route: '/dpa' },
    ];

    if (user.role === 'admin') {
        menuItems.push({ id: 'activity_logs', label: 'Log Aktivitas', icon: History, route: '/activity-logs' });
        menuItems.push({ id: 'users', label: 'Manajemen Pengguna', icon: Users, route: '/users' });
    }

    const handleConfirmLogout = () => {
        setIsLogoutModalOpen(false);
        router.post(route('logout'));
    };

    return (
        <>
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col shrink-0 border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                    }`}
            >
                {/* Header Sidebar dengan Warna */}
                <div className="h-20 px-6 flex items-center justify-between bg-blue-600 border-b border-blue-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1 rounded-lg shadow-sm">
                            <img src="/images/akcaya-logo.png" alt="Logo Akcaya" className="w-9 h-9 object-contain" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">Arus Kas</span>
                    </div>
                    {/* Tombol tutup sidebar di mobile */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 lg:hidden text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <nav className="mt-2 flex-1 px-3">
                    <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu Utama</div>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = url.startsWith(item.route);

                        return (
                            <Link
                                key={item.id}
                                href={item.route}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all mb-1 ${isActive
                                    ? 'bg-blue-50 text-blue-600 shadow-2xs font-bold'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    {/* User Info Card */}
                    <div className="mb-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs ${
                            user.role === 'admin' ? 'bg-purple-600' :
                            user.role === 'staff' ? 'bg-blue-600' :
                            'bg-slate-700'
                        }`}>
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
                            <div className="text-[11px] font-mono text-slate-500 truncate">@{user.username}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    {user.role === 'admin' ? 'Administrator' : user.role === 'staff' ? 'Staff' : 'Viewer'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs text-red-600 font-bold bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-xl transition-colors cursor-pointer"
                    >
                        <LogOut size={15} />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Modal Konfirmasi Log Out */}
            {isLogoutModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-scale-up">
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <LogOut size={28} className="translate-x-0.5" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg mb-1.5">Konfirmasi Keluar</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">
                                Apakah Anda yakin ingin keluar dari akun <span className="font-bold text-slate-700">@{user.username}</span>? Anda perlu masuk kembali untuk mengakses sistem.
                            </p>
                        </div>
                        <div className="p-4 pt-0 flex gap-2.5 bg-white">
                            <button
                                type="button"
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors focus:outline-none"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmLogout}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                            >
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
