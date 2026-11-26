import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { 
    History, Search, Filter, Calendar, User, Activity, 
    ArrowRight, CheckCircle2, AlertTriangle, Trash2, Edit3, PlusCircle, MinusCircle, RefreshCw
} from 'lucide-react';

interface ActivityLogItem {
    id: number;
    user_id: number | null;
    user?: {
        name: string;
        username: string;
        role: string;
    };
    action: string;
    module: string;
    description: string;
    details?: any;
    ip_address?: string;
    created_at: string;
}

interface ActivityLogProps {
    logs: {
        data: ActivityLogItem[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        module?: string;
        action?: string;
        search?: string;
        date?: string;
    };
    modules: string[];
    actions: string[];
}

export default function ActivityLogIndex({ logs, filters, modules, actions }: ActivityLogProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedModule, setSelectedModule] = useState(filters.module || '');
    const [selectedAction, setSelectedAction] = useState(filters.action || '');
    const [selectedDate, setSelectedDate] = useState(filters.date || '');

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            route('activity-logs.index'),
            {
                search: search || undefined,
                module: selectedModule || undefined,
                action: selectedAction || undefined,
                date: selectedDate || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setSelectedModule('');
        setSelectedAction('');
        setSelectedDate('');
        router.get(route('activity-logs.index'));
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'tambah':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                        <PlusCircle size={13} className="text-emerald-600" /> Tambah
                    </span>
                );
            case 'ubah':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-500/10 text-slate-700 border border-slate-500/20">
                        <Edit3 size={13} className="text-slate-600" /> Ubah
                    </span>
                );
            case 'kurangi_pagu':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                        <MinusCircle size={13} className="text-amber-600" /> Kurangi Pagu
                    </span>
                );
            case 'hapus':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/20">
                        <Trash2 size={13} className="text-rose-600" /> Hapus
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <Activity size={13} className="text-slate-400" /> {action}
                    </span>
                );
        }
    };

    const getModuleBadge = (mod: string) => {
        const colors: Record<string, string> = {
            'Sub Kegiatan': 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
            'Perjalanan Dinas': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
            'Makan Minum': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
            'Pengaturan': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
            'Monitoring': 'bg-teal-500/10 text-teal-700 border-teal-500/20',
            'DPA': 'bg-amber-500/10 text-amber-800 border-amber-500/20',
        };
        const cls = colors[mod] || 'bg-slate-500/10 text-slate-700 border-slate-500/20';
        return (
            <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cls}`}>
                {mod}
            </span>
        );
    };

    const formatDate = (isoStr: string) => {
        try {
            const date = new Date(isoStr);
            return new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }).format(date);
        } catch {
            return isoStr;
        }
    };

    return (
        <MainLayout title="Log Aktivitas Pengguna">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <History size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Log Aktivitas Pengguna</h3>
                                <p className="text-xs text-slate-500">
                                    Audit trail riwayat aktivitas multi-user (penambahan, pengurangan pagu, pengeditan, penghapusan data)
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
                            Total {logs.total} Log Aktivitas
                        </span>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama user / deskripsi..."
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <select
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                            >
                                <option value="">Semua Modul</option>
                                {modules.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                            >
                                <option value="">Semua Aksi</option>
                                {actions.map((a) => (
                                    <option key={a} value={a}>{a.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Filter size={14} /> Filter
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                title="Reset Filter"
                                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
                            >
                                <RefreshCw size={15} />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3.5 w-14 text-center">No</th>
                                    <th className="px-4 py-3.5 w-48">Waktu (WIB)</th>
                                    <th className="px-4 py-3.5 w-44">Pengguna</th>
                                    <th className="px-4 py-3.5 w-32">Modul</th>
                                    <th className="px-4 py-3.5 w-32">Aksi</th>
                                    <th className="px-4 py-3.5">Keterangan / Aktivitas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                            <History size={36} className="mx-auto mb-2 text-slate-300" />
                                            Belum ada riwayat aktivitas yang tercatat sesuai filter.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log, index) => {
                                        const rowNum = (logs.current_page - 1) * 25 + index + 1;
                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-4 py-3 text-center text-slate-400 font-medium">
                                                    {rowNum}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={13} className="text-slate-400" />
                                                        {formatDate(log.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {log.user ? (
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 border ${
                                                                log.user.role === 'admin' ? 'bg-purple-500/10 text-purple-700 border-purple-500/20' :
                                                                log.user.role === 'staff' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' :
                                                                'bg-slate-500/10 text-slate-700 border-slate-500/20'
                                                            }`}>
                                                                {log.user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-slate-800 truncate text-xs">
                                                                    {log.user.name}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="font-mono text-[10px] text-slate-400">@{log.user.username}</span>
                                                                    <span className={`text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border ${
                                                                        log.user.role === 'admin' ? 'bg-purple-500/10 text-purple-700 border-purple-500/20' :
                                                                        log.user.role === 'staff' ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' :
                                                                        'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                                                    }`}>
                                                                        {log.user.role}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Sistem / Terhapus</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getModuleBadge(log.module)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getActionBadge(log.action)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-slate-800 font-medium leading-relaxed">
                                                        {log.description}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.last_page > 1 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Halaman {logs.current_page} dari {logs.last_page}
                            </span>
                            <div className="flex gap-1">
                                {logs.links.map((link: any, i: number) => (
                                    <button
                                        key={i}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                : 'text-slate-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
