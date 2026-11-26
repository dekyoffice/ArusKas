import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { formatRupiah, parseRupiah } from '@/utils/formatters';
import CurrencyInput from '@/Components/CurrencyInput';
import { PlusCircle, Plane, Coffee, Pencil, Trash2, X } from 'lucide-react';

interface SubKegiatanRow {
    id: number;
    nama: string;
    anggaran_murni_pd: number;
    anggaran_perubahan_pd: number;
    anggaran_murni_mm: number;
    anggaran_perubahan_mm: number;
    tahun: number;
    totalMurni: number;
    totalPerubahan: number;
    totalPagu: number;
    totalRealisasi: number;
    sisa: number;
    persentase: number;
}

interface Props {
    selectedYear: number;
    subKegiatans: SubKegiatanRow[];
}

export default function SubKegiatanIndex({ selectedYear, subKegiatans }: Props) {
    const { auth } = usePage().props as any;
    const isViewer = auth.user.role === 'viewer';

    // Formulir Tambah
    const formAdd = useForm({
        nama: '',
        tahun: selectedYear,
        anggaran_murni_pd: '',
        anggaran_perubahan_pd: '',
        anggaran_murni_mm: '',
        anggaran_perubahan_mm: '',
    });

    const handleCurrencyChange = (formObj: any, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        formObj.setData(field, val ? formatRupiah(Number(val)) : '');
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formAdd.data,
            anggaran_murni_pd: parseRupiah(formAdd.data.anggaran_murni_pd || '0'),
            anggaran_perubahan_pd: parseRupiah(formAdd.data.anggaran_perubahan_pd || '0'),
            anggaran_murni_mm: parseRupiah(formAdd.data.anggaran_murni_mm || '0'),
            anggaran_perubahan_mm: parseRupiah(formAdd.data.anggaran_perubahan_mm || '0'),
        };
        router.post(route('sub-kegiatan.store'), payload, {
            onSuccess: () => {
                formAdd.reset();
                formAdd.setData('tahun', selectedYear);
            }
        });
    };

    // Modal Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const formEdit = useForm({
        id: 0,
        nama: '',
        tahun: selectedYear,
        anggaran_murni_pd: '',
        anggaran_perubahan_pd: '',
        anggaran_murni_mm: '',
        anggaran_perubahan_mm: '',
    });

    const handleOpenEdit = (item: SubKegiatanRow) => {
        formEdit.setData({
            id: item.id,
            nama: item.nama,
            tahun: item.tahun,
            anggaran_murni_pd: item.anggaran_murni_pd ? formatRupiah(item.anggaran_murni_pd) : '',
            anggaran_perubahan_pd: item.anggaran_perubahan_pd ? formatRupiah(item.anggaran_perubahan_pd) : '',
            anggaran_murni_mm: item.anggaran_murni_mm ? formatRupiah(item.anggaran_murni_mm) : '',
            anggaran_perubahan_mm: item.anggaran_perubahan_mm ? formatRupiah(item.anggaran_perubahan_mm) : '',
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formEdit.data,
            anggaran_murni_pd: parseRupiah(formEdit.data.anggaran_murni_pd || '0'),
            anggaran_perubahan_pd: parseRupiah(formEdit.data.anggaran_perubahan_pd || '0'),
            anggaran_murni_mm: parseRupiah(formEdit.data.anggaran_murni_mm || '0'),
            anggaran_perubahan_mm: parseRupiah(formEdit.data.anggaran_perubahan_mm || '0'),
        };
        router.put(route('sub-kegiatan.update', formEdit.data.id), payload, {
            onSuccess: () => setIsEditModalOpen(false)
        });
    };

    // Modal Hapus
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<{ id: number, nama: string } | null>(null);

    const handleOpenDelete = (item: SubKegiatanRow) => {
        setDeleteItem({ id: item.id, nama: item.nama });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteItem) {
            router.delete(route('sub-kegiatan.destroy', deleteItem.id), {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setIsEditModalOpen(false);
                }
            });
        }
    };

    return (
        <MainLayout title="Master Sub Kegiatan">
            <div className="space-y-8">
                {/* Form Card */}
                {!isViewer && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <PlusCircle className="text-blue-500" size={20} /> Tambah Sub Kegiatan Baru
                        </h3>
                        <form onSubmit={handleAddSubmit} className="space-y-6">
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Sub Kegiatan</label>
                                <input
                                    type="text"
                                    required
                                    value={formAdd.data.nama}
                                    onChange={e => formAdd.setData('nama', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white"
                                    placeholder="Contoh: Rapat Koordinasi Tahunan"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-4"><Plane size={18} className="text-blue-500" /> Anggaran Perjalanan Dinas </h4>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1.5">Anggaran Murni</label>
                                        <CurrencyInput
                                            value={formAdd.data.anggaran_murni_pd}
                                            onChange={(val) => formAdd.setData('anggaran_murni_pd', val ? String(val) : '')}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                                            placeholder="Rp 0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1.5">Anggaran Perubahan (Opsional)</label>
                                        <CurrencyInput
                                            value={formAdd.data.anggaran_perubahan_pd}
                                            onChange={(val) => formAdd.setData('anggaran_perubahan_pd', val ? String(val) : '')}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                                            placeholder="Rp 0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-4"><Coffee size={18} className="text-emerald-500" /> Anggaran Makan & Minum </h4>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1.5">Anggaran Murni</label>
                                        <CurrencyInput
                                            value={formAdd.data.anggaran_murni_mm}
                                            onChange={(val) => formAdd.setData('anggaran_murni_mm', val ? String(val) : '')}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                            placeholder="Rp 0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1.5">Anggaran Perubahan (Opsional)</label>
                                        <CurrencyInput
                                            value={formAdd.data.anggaran_perubahan_mm}
                                            onChange={(val) => formAdd.setData('anggaran_perubahan_mm', val ? String(val) : '')}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                            placeholder="Rp 0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={formAdd.processing}
                                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    Simpan Sub Kegiatan
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table Card */}
                <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">Daftar Sub Kegiatan Terkini</h3>
                        <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                            {subKegiatans.length} Sub Kegiatan
                        </span>
                    </div>
                    <div className="overflow-auto custom-scrollbar max-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th rowSpan={2} className="px-5 py-3 border-b border-r border-slate-100 bg-slate-50 text-slate-700 align-middle text-center w-12">No.</th>
                                    <th rowSpan={2} className="px-5 py-3 border-b border-r border-slate-100 bg-slate-50 text-slate-700 align-middle min-w-[150px]">Sub Kegiatan</th>
                                    <th colSpan={2} className="px-5 py-2 border-b border-r border-slate-100 text-center bg-slate-50 text-slate-700">Anggaran Murni</th>
                                    <th colSpan={2} className="px-5 py-2 border-b border-r border-slate-100 text-center bg-slate-50 text-slate-700">Anggaran Perubahan</th>
                                    <th rowSpan={2} className="px-5 py-3 border-b border-r border-slate-100 text-blue-600 bg-slate-50 align-middle">Total Pagu</th>
                                    <th rowSpan={2} className="px-5 py-3 border-b border-r border-slate-100 bg-slate-50 text-slate-700 align-middle">Realisasi</th>
                                    <th rowSpan={2} className="px-5 py-3 border-b border-r border-slate-100 text-slate-700 bg-slate-50 align-middle">Sisa</th>
                                    <th rowSpan={2} className="px-5 py-3 border-b border-r border-slate-100 text-center text-slate-700 bg-slate-50 align-middle">Status</th>
                                    {!isViewer && <th rowSpan={2} className="px-5 py-3 border-b border-slate-100 text-center text-slate-700 bg-slate-50 align-middle">Aksi</th>}
                                </tr>
                                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="px-5 py-2 border-b border-r border-slate-100 text-slate-700 bg-slate-50">Perjalanan Dinas</th>
                                    <th className="px-5 py-2 border-b border-r border-slate-100 text-slate-700 bg-slate-50">Makan Minum</th>
                                    <th className="px-5 py-2 border-b border-r border-slate-100 text-slate-700 bg-slate-50">Perjalanan Dinas</th>
                                    <th className="px-5 py-2 border-b border-r border-slate-100 text-slate-700 bg-slate-50">Makan Minum</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-100">
                                {subKegiatans.length === 0 ? (
                                    <tr>
                                        <td colSpan={isViewer ? 8 : 9} className="px-5 py-12 text-center text-slate-400">
                                            Belum ada data sub kegiatan.
                                        </td>
                                    </tr>
                                ) : (
                                    subKegiatans.map((row, index) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4 text-center text-slate-500 font-medium border-r border-slate-50">{index + 1}</td>
                                            <td className="px-5 py-4 font-semibold text-slate-700 border-r border-slate-50">{row.nama}</td>
                                            <td className="px-5 py-4 text-slate-500 border-r border-slate-50">{formatRupiah(row.anggaran_murni_pd)}</td>
                                            <td className="px-5 py-4 text-slate-500 border-r border-slate-50">{formatRupiah(row.anggaran_murni_mm)}</td>
                                            <td className="px-5 py-4 text-emerald-600 font-medium border-r border-slate-50">{row.anggaran_perubahan_pd > 0 ? '+' : ''}{formatRupiah(row.anggaran_perubahan_pd)}</td>
                                            <td className="px-5 py-4 text-emerald-600 font-medium border-r border-slate-50">{row.anggaran_perubahan_mm > 0 ? '+' : ''}{formatRupiah(row.anggaran_perubahan_mm)}</td>
                                            <td className="px-5 py-4 text-blue-700 font-bold bg-blue-50/30 border-r border-slate-50">{formatRupiah(row.totalPagu)}</td>
                                            <td className="px-5 py-4 text-slate-600 border-r border-slate-50">{formatRupiah(row.totalRealisasi)}</td>
                                            <td className="px-5 py-4 font-semibold text-slate-700">{formatRupiah(row.sisa)}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-md font-bold text-xs ${row.persentase > 80
                                                    ? 'bg-red-50 text-red-600'
                                                    : 'bg-green-50 text-green-600'
                                                    }`}>
                                                    {row.persentase.toFixed(1)}%
                                                </span>
                                            </td>
                                            {!isViewer && (
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenEdit(row)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Sub Kegiatan"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Edit Modal */}
                {isEditModalOpen && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-lg">Edit Sub Kegiatan</h3>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <form id="edit-form" onSubmit={handleEditSubmit} className="space-y-6">
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Nama Sub Kegiatan</label>
                                        <input
                                            type="text"
                                            required
                                            value={formEdit.data.nama}
                                            onChange={e => formEdit.setData('nama', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-slate-50 focus:bg-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
                                            <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-4"><Plane size={18} className="text-blue-500" /> Anggaran PD</h4>
                                            <div>
                                                <label className="block text-sm text-slate-600 mb-1.5">Anggaran Murni</label>
                                                <CurrencyInput
                                                    value={formEdit.data.anggaran_murni_pd}
                                                    onChange={(val) => formEdit.setData('anggaran_murni_pd', val ? String(val) : '')}
                                                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                                                    placeholder="Rp 0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-600 mb-1.5">Anggaran Perubahan</label>
                                                <CurrencyInput
                                                    value={formEdit.data.anggaran_perubahan_pd}
                                                    onChange={(val) => formEdit.setData('anggaran_perubahan_pd', val ? String(val) : '')}
                                                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                                                    placeholder="Rp 0"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 p-5 bg-slate-50/50 rounded-xl border border-slate-100">
                                            <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-4"><Coffee size={18} className="text-emerald-500" /> Anggaran MM</h4>
                                            <div>
                                                <label className="block text-sm text-slate-600 mb-1.5">Anggaran Murni</label>
                                                <CurrencyInput
                                                    value={formEdit.data.anggaran_murni_mm}
                                                    onChange={(val) => formEdit.setData('anggaran_murni_mm', val ? String(val) : '')}
                                                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                                    placeholder="Rp 0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-600 mb-1.5">Anggaran Perubahan</label>
                                                <CurrencyInput
                                                    value={formEdit.data.anggaran_perubahan_mm}
                                                    onChange={(val) => formEdit.setData('anggaran_perubahan_mm', val ? String(val) : '')}
                                                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                                    placeholder="Rp 0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const current = subKegiatans.find((item: SubKegiatanRow) => item.id === formEdit.data.id);
                                            if (current) handleOpenDelete(current);
                                        }}
                                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl border border-red-200 transition-colors flex items-center gap-2 shadow-sm focus:outline-none"
                                        title="Hapus Sub Kegiatan Ini"
                                    >
                                        <Trash2 size={16} />
                                        <span>Hapus Sub Kegiatan</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors shadow-sm focus:outline-none"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        form="edit-form"
                                        disabled={formEdit.processing}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && deleteItem && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-xl mb-2">Hapus Sub Kegiatan?</h3>
                                <p className="text-slate-500 text-sm mb-1">
                                    Anda yakin ingin menghapus <span className="font-bold text-slate-700">"{deleteItem.nama}"</span>?
                                </p>
                                <p className="text-slate-400 text-xs">
                                    Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                            <div className="p-6 pt-0 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors focus:outline-none"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </MainLayout>
    );
}
