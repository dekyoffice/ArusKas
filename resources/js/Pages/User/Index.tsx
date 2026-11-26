import { useState, useMemo } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Users as UsersIcon, UserPlus, Trash2, Pencil, X, KeyRound, Search, CheckCircle2, ShieldCheck, UserCheck, Eye, Sparkles } from 'lucide-react';

interface UserRow {
    id: number;
    name: string;
    username: string;
    role: 'admin' | 'staff' | 'viewer';
    created_at?: string;
}

interface Props {
    users: UserRow[];
}

export default function UserIndex({ users }: Props) {
    const { errors, auth, flash } = usePage().props as any;

    // Filter & Search State
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff' | 'viewer'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Hitung jumlah per role
    const counts = useMemo(() => {
        return {
            all: users.length,
            admin: users.filter(u => u.role === 'admin').length,
            staff: users.filter(u => u.role === 'staff').length,
            viewer: users.filter(u => u.role === 'viewer').length,
        };
    }, [users]);

    // Data terfilter
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            const matchesSearch = searchQuery === '' || 
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.username.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesRole && matchesSearch;
        });
    }, [users, roleFilter, searchQuery]);

    // Form Tambah
    const formAdd = useForm({
        name: '',
        username: '',
        role: 'staff',
        password: '',
    });

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        formAdd.post(route('users.store'), {
            onSuccess: () => {
                formAdd.reset();
            }
        });
    };

    // Modal Edit & Reset Password
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const formEdit = useForm({
        id: 0,
        name: '',
        username: '',
        role: 'staff',
        password: '', // Opsional untuk diubah
    });

    const handleOpenEdit = (user: UserRow) => {
        formEdit.setData({
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            password: '',
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        formEdit.put(route('users.update', formEdit.data.id), {
            onSuccess: () => setIsEditModalOpen(false)
        });
    };

    // Modal Hapus
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<{id: number, name: string} | null>(null);

    const handleOpenDelete = (user: UserRow) => {
        setDeleteItem({ id: user.id, name: user.name });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteItem) {
            router.delete(route('users.destroy', deleteItem.id), {
                onSuccess: () => setIsDeleteModalOpen(false)
            });
        }
    };

    return (
        <MainLayout title="Manajemen Pengguna">
            <div className="space-y-8">
                {/* Flash Success Notification */}
                {flash?.success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-xs animate-fade-in">
                        <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
                        <span className="font-semibold text-sm">{flash.success}</span>
                    </div>
                )}

                {/* Error Banner */}
                {errors.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl shadow-xs">
                        <span className="font-bold">Error:</span> {errors.error}
                    </div>
                )}
                
                {/* Form Card Tambah Pengguna */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-base lg:text-lg">
                        <UserPlus className="text-blue-600" size={22} /> Tambah Pengguna Baru
                    </h3>
                    <form onSubmit={handleAddSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Contoh: John Doe"
                                    value={formAdd.data.name}
                                    onChange={e => formAdd.setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white text-sm"
                                />
                                {formAdd.errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{formAdd.errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Username (untuk Login)</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Contoh: johndoe (tanpa spasi)"
                                    value={formAdd.data.username}
                                    onChange={e => formAdd.setData('username', e.target.value.toLowerCase().trim())}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white font-mono text-sm"
                                />
                                {formAdd.errors.username && <p className="text-red-500 text-xs mt-1 font-medium">{formAdd.errors.username}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Role Akses Akun</label>
                                <select 
                                    value={formAdd.data.role}
                                    onChange={e => formAdd.setData('role', e.target.value as any)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white text-sm cursor-pointer"
                                >
                                    <option value="admin">Administrator (Akses Penuh Kelola Anggaran & Pengguna)</option>
                                    <option value="staff">Staff (Operator Input / Edit Transaksi & Bukti Belanja)</option>
                                    <option value="viewer">Viewer (Pimpinan - Hanya Melihat & Unduh Laporan)</option>
                                </select>
                                {formAdd.errors.role && <p className="text-red-500 text-xs mt-1 font-medium">{formAdd.errors.role}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Password <span className="text-xs text-slate-400 font-normal">(Minimal 6 karakter)</span>
                                </label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="password" 
                                        required
                                        placeholder="Masukkan password akun baru"
                                        value={formAdd.data.password}
                                        onChange={e => formAdd.setData('password', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white text-sm"
                                    />
                                </div>
                                {formAdd.errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{formAdd.errors.password}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit" 
                                disabled={formAdd.processing}
                                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <UserPlus size={18} />
                                {formAdd.processing ? 'Menyimpan...' : 'Simpan Pengguna Baru'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table Card Daftar Pengguna */}
                <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                    {/* Header Tabel dengan Pencarian & Filter Role */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/70 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                                    <UsersIcon className="text-blue-600" size={20} /> Daftar Pengguna Sistem
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Kelola akun, tingkat akses peran, dan kata sandi pengguna.</p>
                            </div>

                            {/* Kotak Pencarian */}
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama / username..."
                                    className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Tabs / Pills untuk Membedakan Role */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                            <span className="text-xs font-semibold text-slate-500 mr-1">Filter Role:</span>
                            <button
                                onClick={() => setRoleFilter('all')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    roleFilter === 'all'
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <span>Semua</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roleFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                    {counts.all}
                                </span>
                            </button>

                            <button
                                onClick={() => setRoleFilter('admin')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    roleFilter === 'admin'
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
                                }`}
                            >
                                <ShieldCheck size={14} />
                                <span>Administrator</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roleFilter === 'admin' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
                                    {counts.admin}
                                </span>
                            </button>

                            <button
                                onClick={() => setRoleFilter('staff')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    roleFilter === 'staff'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                                }`}
                            >
                                <UserCheck size={14} />
                                <span>Staff / Operator</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roleFilter === 'staff' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
                                    {counts.staff}
                                </span>
                            </button>

                            <button
                                onClick={() => setRoleFilter('viewer')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    roleFilter === 'viewer'
                                        ? 'bg-slate-700 text-white shadow-sm'
                                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <Eye size={14} />
                                <span>Viewer / Pimpinan</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roleFilter === 'viewer' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                    {counts.viewer}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Tabel Daftar Pengguna */}
                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-slate-200">
                                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-6 py-4">Nama Pengguna</th>
                                    <th className="px-6 py-4">Username Login</th>
                                    <th className="px-6 py-4">Role Akses</th>
                                    <th className="px-6 py-4 text-center">Status Akun</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-100">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada pengguna yang cocok dengan kriteria filter atau pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((row) => {
                                        const isCurrent = auth.user.id === row.id;

                                        return (
                                            <tr key={row.id} className={`transition-colors ${isCurrent ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                                                            row.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                            row.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-200 text-slate-700'
                                                        }`}>
                                                            {row.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                                {row.name}
                                                                {isCurrent && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                                                        <Sparkles size={11} className="text-emerald-600" /> Anda (Aktif)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-400">Terdaftar: {row.created_at || '-'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
                                                        @{row.username}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                                                        row.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                                        row.role === 'staff' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                        'bg-slate-100 text-slate-700 border border-slate-200'
                                                    }`}>
                                                        {row.role === 'admin' && <ShieldCheck size={13} />}
                                                        {row.role === 'staff' && <UserCheck size={13} />}
                                                        {row.role === 'viewer' && <Eye size={13} />}
                                                        {row.role === 'admin' ? 'ADMINISTRATOR' : row.role === 'staff' ? 'STAFF / OPERATOR' : 'VIEWER / PIMPINAN'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {isCurrent ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sedang Digunakan
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-medium">Tersedia</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleOpenEdit(row)}
                                                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                            title="Edit Data Pengguna"
                                                        >
                                                            <Pencil size={17} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-lg">Edit Data Pengguna</h3>
                                <button 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <form id="edit-user-form" onSubmit={handleEditSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={formEdit.data.name}
                                                onChange={e => formEdit.setData('name', e.target.value)}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white text-sm"
                                            />
                                            {formEdit.errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{formEdit.errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Username Login</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={formEdit.data.username}
                                                onChange={e => formEdit.setData('username', e.target.value.toLowerCase().trim())}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white font-mono text-sm"
                                            />
                                            {formEdit.errors.username && <p className="text-red-500 text-xs mt-1 font-medium">{formEdit.errors.username}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Role Akses</label>
                                            <select 
                                                value={formEdit.data.role}
                                                onChange={e => formEdit.setData('role', e.target.value as any)}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white text-sm cursor-pointer disabled:bg-slate-100 disabled:text-slate-500"
                                                disabled={auth.user.id === formEdit.data.id} // Cegah admin ubah rolenya sendiri jadi viewer
                                            >
                                                <option value="admin">Administrator (Akses Penuh)</option>
                                                <option value="staff">Staff (Operator)</option>
                                                <option value="viewer">Viewer (Pimpinan)</option>
                                            </select>
                                            {auth.user.id === formEdit.data.id && (
                                                <p className="text-xs text-amber-600 mt-1 font-medium">Anda tidak dapat menurunkan role dari akun yang sedang Anda gunakan.</p>
                                            )}
                                        </div>
                                        <div className="pt-4 border-t border-slate-100">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Reset Password Baru <span className="text-xs text-slate-400 font-normal">(Opsional - Kosongkan jika tidak ingin diubah)</span>
                                            </label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="password" 
                                                    value={formEdit.data.password}
                                                    onChange={e => formEdit.setData('password', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white text-sm"
                                                    placeholder="Minimal 6 karakter"
                                                />
                                            </div>
                                            {formEdit.errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{formEdit.errors.password}</p>}
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                                <div>
                                    {auth.user.id !== formEdit.data.id && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const u = users.find(x => x.id === formEdit.data.id);
                                                if (u) {
                                                    setIsEditModalOpen(false);
                                                    handleOpenDelete(u);
                                                }
                                            }}
                                            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl border border-red-200 transition-colors flex items-center gap-2 text-sm shadow-xs"
                                            title="Hapus Akun Pengguna Ini"
                                        >
                                            <Trash2 size={16} />
                                            <span>Hapus Pengguna</span>
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors shadow-xs text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        form="edit-user-form"
                                        disabled={formEdit.processing}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 text-sm"
                                    >
                                        {formEdit.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && deleteItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mb-2">Hapus Akun Pengguna?</h3>
                                <p className="text-slate-500 text-sm mb-1">
                                    Anda yakin ingin menghapus akun <span className="font-bold text-slate-800">"{deleteItem.name}"</span>?
                                </p>
                                <p className="text-slate-400 text-xs">
                                    Pengguna ini tidak akan bisa login lagi ke sistem. Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                            <div className="p-6 pt-0 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 text-sm"
                                >
                                    Hapus Sekarang
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
