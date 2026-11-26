import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { router, usePage } from '@inertiajs/react';
import { Calendar, User, ChevronDown, Menu, Plus, Trash2, AlertTriangle, X } from 'lucide-react';

export default function Header({ title, onMenuClick }: { title: string, onMenuClick?: () => void }) {
    const props = usePage().props as any;
    const isViewer = props.auth?.user?.role === 'viewer';
    
    const currentYear = new Date().getFullYear();
    const availableYears: number[] = props.availableYears && props.availableYears.length > 0
        ? props.availableYears
        : [2025, 2026, 2027];

    const selectedYear = props.selectedYear || availableYears[0] || currentYear;

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isDeleting, setIsDeleting] = useState(false);

    // Timer 5 detik ketika modal hapus dibuka
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isDeleteModalOpen) {
            setCountdown(5);
            timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isDeleteModalOpen]);

    const handleYearChange = (year: string) => {
        router.post(route('settings.year'), { year: Number(year) }, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const handleAddYear = () => {
        router.post(route('settings.year.add'), {}, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const handleConfirmDelete = () => {
        if (countdown > 0) return;
        setIsDeleting(true);
        router.post(route('settings.year.delete'), { year: selectedYear }, {
            preserveScroll: true,
            preserveState: false,
            onFinish: () => {
                setIsDeleting(false);
                setIsDeleteModalOpen(false);
            }
        });
    };

    return (
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-3 lg:px-8 shrink-0 z-10 sticky top-0 gap-2">
            <div className="flex items-center gap-2 lg:gap-6 flex-1 min-w-0">
                {onMenuClick && (
                    <button 
                        onClick={onMenuClick}
                        className="p-1.5 -ml-1 lg:hidden text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none shrink-0"
                    >
                        <Menu size={22} />
                    </button>
                )}
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 truncate leading-tight">{title}</h2>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-6 shrink-0">
                {/* Periode Selector dengan Tambah dan Hapus */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 lg:px-2.5 py-1 rounded-xl text-xs lg:text-sm">
                    <Calendar size={14} className="text-slate-400 hidden sm:block mr-1" />
                    <span className="font-medium text-slate-600 hidden sm:inline mr-1">Periode:</span>
                    
                    <div className="relative flex items-center">
                        <select
                            value={selectedYear}
                            onChange={e => handleYearChange(e.target.value)}
                            className="font-bold text-blue-600 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer py-0 pl-1 pr-4 sm:pr-5 text-xs sm:text-sm appearance-none"
                            style={{ backgroundImage: 'none' }}
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="text-blue-500 pointer-events-none absolute right-0 sm:right-1" />
                    </div>

                    {!isViewer && (
                        <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 ml-1">
                            {/* Tombol Tambah Periode */}
                            <button
                                onClick={handleAddYear}
                                type="button"
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Tambah Periode (Tahun Baru)"
                            >
                                <Plus size={15} />
                            </button>

                            {/* Tombol Hapus Periode Terpilih */}
                            {availableYears.length > 1 && (
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    type="button"
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title={`Hapus Periode Tahun ${selectedYear}`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
                
                {(() => {
                    const user = props.auth?.user;
                    const role = user?.role || 'viewer';
                    let bgClass = "bg-slate-50 border-slate-200 text-slate-700";
                    let badgeClass = "bg-slate-200 text-slate-700 border-slate-300";
                    let avatarBg = "bg-slate-700 text-white";
                    let roleLabel = "Viewer";
                    
                    if (role === 'admin') {
                        bgClass = "bg-purple-50/80 border-purple-200 text-purple-900";
                        badgeClass = "bg-purple-100 text-purple-800 border-purple-200";
                        avatarBg = "bg-purple-600 text-white";
                        roleLabel = "Admin";
                    } else if (role === 'staff') {
                        bgClass = "bg-blue-50/80 border-blue-200 text-blue-900";
                        badgeClass = "bg-blue-100 text-blue-800 border-blue-200";
                        avatarBg = "bg-blue-600 text-white";
                        roleLabel = "Staff";
                    }

                    return (
                        <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-xl border ${bgClass} shadow-2xs`}>
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${avatarBg} shrink-0 shadow-xs`}>
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex flex-col text-left leading-tight">
                                <div className="text-xs font-bold flex items-center gap-1.5">
                                    <span className="truncate max-w-[85px] sm:max-w-[130px] md:max-w-xs">{user?.name}</span>
                                    <span className={`px-1.5 py-0.2 rounded-md font-extrabold uppercase text-[9px] tracking-wider border ${badgeClass}`}>
                                        {roleLabel}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">@{user?.username}</span>
                            </div>
                        </div>
                    );
                })()}
                
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border bg-slate-100 border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                        Database Lokal
                    </span>
                </div>
            </div>

            {/* Modal Konfirmasi Hapus Periode dengan Countdown 5 Detik */}
            {isDeleteModalOpen && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                        {/* Header Modal */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-red-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-base">Hapus Periode {selectedYear}</h3>
                                    <p className="text-xs text-slate-500">Konfirmasi tindakan berisiko tinggi</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 space-y-4">
                            <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 space-y-1.5">
                                <p className="font-semibold text-red-900">Peringatan Penting:</p>
                                <p className="leading-relaxed">
                                    Apakah Anda yakin ingin menghapus periode tahun <strong className="text-red-950 font-bold">{selectedYear}</strong>? 
                                    Semua data anggaran, transaksi Makan & Minum, SPPD, dan berkas DPA pada tahun ini akan dihapus dari sistem.
                                </p>
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={countdown > 0 || isDeleting}
                                onClick={handleConfirmDelete}
                                className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 ${
                                    countdown > 0 || isDeleting
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 hover:shadow'
                                }`}
                            >
                                <Trash2 size={15} />
                                {countdown > 0 
                                    ? `Hapus Periode (${countdown}s)` 
                                    : (isDeleting ? 'Menghapus...' : `Hapus Periode ${selectedYear}`)}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
}
