import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { formatRupiah, parseRupiah, formatDate } from '@/utils/formatters';
import CurrencyInput from '@/Components/CurrencyInput';
import { Plane, Plus, Trash2, Calendar, MapPin, FileText, Pencil, X, ChevronRight, ChevronDown, ChevronUp, Users, Filter, Upload, Table, Search, ArrowLeft, Download, RotateCcw } from 'lucide-react';
import FileViewerModal from '@/Components/FileViewerModal';

interface SubKegiatan {
    id: number;
    nama: string;
    anggaran_murni_pd: number;
    anggaran_perubahan_pd: number;
}

interface Personil {
    id: string;
    nama: string;
    nominal: number;
}

interface PdTransaction {
    id: number;
    sub_kegiatan_id: number;
    judul: string;
    wilayah: string;
    tanggal: string;
    personil: Array<{ id?: string; nama: string; nominal: number }>;
    total: number;
    undangan_file?: string | null;
    dokumentasi_files?: string[] | null;
    created_at: string;
}

interface Props {
    selectedYear: number;
    subKegiatans: SubKegiatan[];
    pdTransactions: PdTransaction[];
}

export default function PdIndex({ selectedYear, subKegiatans, pdTransactions }: Props) {
    const { errors, auth } = usePage().props as any;
    const isViewer = auth.user.role === 'viewer';

    // Form Tambah
    const [personilList, setPersonilList] = useState<Personil[]>([{ id: Date.now().toString(), nama: '', nominal: 0 }]);
    const formAdd = useForm({
        sub_kegiatan_id: '',
        judul: '',
        wilayah: '',
        tanggal: new Date().toISOString().split('T')[0],
        personil: personilList,
        undangan_file: null as File | null,
    });

    const getSisaAnggaran = (skId: number) => {
        const sk = subKegiatans.find(s => s.id === skId);
        if (!sk) return 0;
        const pagu = Number(sk.anggaran_murni_pd) + Number(sk.anggaran_perubahan_pd);
        const terpakai = pdTransactions.filter(tx => tx.sub_kegiatan_id === skId).reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
        return pagu - terpakai;
    };

    const grandTotal = personilList.reduce((sum, p) => sum + (p.nominal || 0), 0);
    const selectedSkIdAdd = formAdd.data.sub_kegiatan_id ? Number(formAdd.data.sub_kegiatan_id) : null;
    const currentSisaAdd = selectedSkIdAdd ? getSisaAnggaran(selectedSkIdAdd) : 0;
    const isOverBudgetAdd = selectedSkIdAdd !== null && grandTotal > currentSisaAdd;

    const handlePersonilChange = (id: string, field: 'nama' | 'nominal', value: any) => {
        setPersonilList(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, [field]: field === 'nominal' ? Number(value || 0) : value };
            }
            return p;
        }));
    };

    const addPersonil = () => setPersonilList(prev => [...prev, { id: Date.now().toString(), nama: '', nominal: 0 }]);
    const removePersonil = (id: string) => {
        if (personilList.length > 1) {
            const personil = personilList.find(p => p.id === id);
            if (personil && (personil.nama.trim() !== '' || personil.nominal > 0)) {
                setDeletePersonilItem({ id, nama: personil.nama || 'personil ini', mode: 'add' });
                return;
            }
            setPersonilList(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (personilList.some(p => !p.nama || p.nominal < 0)) {
            alert('Pastikan semua personil memiliki nama dan nominal tidak minus.');
            return;
        }

        formAdd.transform((data) => ({
            ...data,
            personil: personilList,
        }));
        
        formAdd.post(route('perjalanan-dinas.store'), {
            onSuccess: () => {
                formAdd.reset();
                setPersonilList([{ id: Date.now().toString(), nama: '', nominal: 0 }]);
            }
        });
    };

    // Modal Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<PdTransaction | null>(null);
    const [editPersonilList, setEditPersonilList] = useState<Personil[]>([]);
    const formEdit = useForm<{
        id: number;
        sub_kegiatan_id: string;
        judul: string;
        wilayah: string;
        tanggal: string;
        personil: Personil[];
        undangan_file: File | null;
        dokumentasi_files: File[];
    }>({
        id: 0,
        sub_kegiatan_id: '',
        judul: '',
        wilayah: '',
        tanggal: '',
        personil: [] as Personil[],
        undangan_file: null,
        dokumentasi_files: [],
    });

    const getSisaAnggaranEdit = (skId: number, editTxId: number) => {
        const sk = subKegiatans.find(s => s.id === skId);
        if (!sk) return 0;
        const pagu = Number(sk.anggaran_murni_pd) + Number(sk.anggaran_perubahan_pd);
        const terpakai = pdTransactions.filter(tx => tx.sub_kegiatan_id === skId && tx.id !== editTxId).reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
        return pagu - terpakai;
    };

    const editGrandTotal = editPersonilList.reduce((sum, p) => sum + (p.nominal || 0), 0);
    const selectedSkIdEdit = formEdit.data.sub_kegiatan_id ? Number(formEdit.data.sub_kegiatan_id) : null;
    const currentSisaEdit = selectedSkIdEdit ? getSisaAnggaranEdit(selectedSkIdEdit, formEdit.data.id) : 0;
    const isOverBudgetEdit = selectedSkIdEdit !== null && editGrandTotal > currentSisaEdit;

    const handleEditPersonilChange = (id: string, field: 'nama' | 'nominal', value: any) => {
        setEditPersonilList(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, [field]: field === 'nominal' ? Number(value || 0) : value };
            }
            return p;
        }));
    };

    const addEditPersonil = () => setEditPersonilList(prev => [...prev, { id: Date.now().toString(), nama: '', nominal: 0 }]);
    const removeEditPersonil = (id: string) => {
        if (editPersonilList.length > 1) {
            const personil = editPersonilList.find(p => p.id === id);
            if (personil && (personil.nama.trim() !== '' || personil.nominal > 0)) {
                setDeletePersonilItem({ id, nama: personil.nama || 'personil ini', mode: 'edit' });
                return;
            }
            setEditPersonilList(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleConfirmDeletePersonil = () => {
        if (!deletePersonilItem) return;
        if (deletePersonilItem.mode === 'add') {
            setPersonilList(prev => prev.filter(p => p.id !== deletePersonilItem.id));
        } else {
            setEditPersonilList(prev => prev.filter(p => p.id !== deletePersonilItem.id));
        }
        setDeletePersonilItem(null);
    };

    const handleOpenEdit = (tx: PdTransaction) => {
        setEditingTx(tx);
        const mapped = tx.personil.map((p, i) => ({ ...p, id: p.id || String(Date.now() + i) }));
        formEdit.setData({
            id: tx.id,
            sub_kegiatan_id: String(tx.sub_kegiatan_id),
            judul: tx.judul,
            wilayah: tx.wilayah,
            tanggal: tx.tanggal ? tx.tanggal.split('T')[0] : '',
            personil: mapped,
            undangan_file: null,
            dokumentasi_files: [],
        });
        setEditPersonilList(mapped);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editPersonilList.some(p => !p.nama || p.nominal < 0)) {
            alert('Pastikan semua personil memiliki nama dan nominal tidak minus.');
            return;
        }

        formEdit.transform((data) => ({
            ...data,
            _method: 'put',
            personil: editPersonilList,
        }));
        
        formEdit.post(route('perjalanan-dinas.update', formEdit.data.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingTx(null);
                formEdit.reset();
            }
        });
    };

    // Modal Hapus
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<{id: number, judul: string} | null>(null);

    // Modal Hapus Personil Baris Form
    const [deletePersonilItem, setDeletePersonilItem] = useState<{ id: string; nama: string; mode: 'add' | 'edit' } | null>(null);

    // Modal Hapus File (Undangan / Dokumentasi)
    const [deleteFileItem, setDeleteFileItem] = useState<{ txId: number; type: 'undangan' | 'dokumentasi'; path?: string; label: string } | null>(null);

    const handleOpenDelete = (tx: PdTransaction) => {
        setDeleteItem({ id: tx.id, judul: tx.judul });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteItem) {
            router.delete(route('perjalanan-dinas.destroy', deleteItem.id), {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingTx(null);
                    setSelectedHistoryGroup(null);
                }
            });
        }
    };

    const handleConfirmDeleteFile = () => {
        if (!deleteFileItem) return;
        const { txId, type, path } = deleteFileItem;
        router.post(route('perjalanan-dinas.delete-file', txId), {
            _method: 'POST',
            type,
            path,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (type === 'undangan') {
                    setEditingTx(prev => prev ? { ...prev, undangan_file: null } : null);
                } else if (type === 'dokumentasi' && path) {
                    setEditingTx(prev => {
                        if (!prev) return null;
                        let files: string[] = [];
                        if (Array.isArray(prev.dokumentasi_files)) {
                            files = prev.dokumentasi_files;
                        } else if (typeof prev.dokumentasi_files === 'string') {
                            try {
                                const parsed = JSON.parse(prev.dokumentasi_files);
                                files = Array.isArray(parsed) ? parsed : [prev.dokumentasi_files];
                            } catch {
                                files = [prev.dokumentasi_files];
                            }
                        }
                        return {
                            ...prev,
                            dokumentasi_files: files.filter(f => f !== path)
                        };
                    });
                }
                setDeleteFileItem(null);
            }
        });
    };

    const handleUploadDokumentasi = (txId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            router.post(route('perjalanan-dinas.upload-dokumentasi', txId), {
                _method: 'POST',
                dokumentasi_files: Array.from(e.target.files),
            }, {
                forceFormData: true,
                preserveScroll: true,
            });
        }
    };

    const handleUploadUndangan = (txId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            router.post(route('perjalanan-dinas.upload-undangan', txId), {
                _method: 'POST',
                undangan_file: e.target.files[0],
            }, {
                forceFormData: true,
                preserveScroll: true,
            });
        }
    };

    const handleDeleteFile = (txId: number, type: 'undangan' | 'dokumentasi', path?: string) => {
        if (confirm(`Yakin ingin menghapus ${type} ini?`)) {
            router.post(route('perjalanan-dinas.delete-file', txId), {
                _method: 'POST',
                type,
                path,
            }, {
                preserveScroll: true,
            });
        }
    };

    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [expandedDocs, setExpandedDocs] = useState<Record<number, boolean>>({});

    const toggleExpandDocs = (txId: number) => {
        setExpandedDocs(prev => ({ ...prev, [txId]: !prev[txId] }));
    };

    const openViewer = (url: string) => {
        setViewerUrl(url);
        setIsViewerOpen(true);
    };

    // Grouping Riwayat
    const [selectedHistoryGroup, setSelectedHistoryGroup] = useState<number | null>(null);
    const [sortOrder, setSortOrder] = useState<'terbaru' | 'terlama' | 'terbesar' | 'terkecil'>('terbaru');

    // Global Key Handlers untuk Modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isViewerOpen) return; // Biarkan FileViewerModal yang handle
                if (deleteFileItem) setDeleteFileItem(null);
                else if (isDeleteModalOpen) setIsDeleteModalOpen(false);
                else if (isEditModalOpen) setIsEditModalOpen(false);
                else if (selectedHistoryGroup !== null) setSelectedHistoryGroup(null);
            }
            if (e.key === 'Enter') {
                if (deleteFileItem) handleConfirmDeleteFile();
                else if (isDeleteModalOpen) handleConfirmDelete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isViewerOpen, isDeleteModalOpen, isEditModalOpen, selectedHistoryGroup, deleteItem, deleteFileItem]);

    // State Rekapitulasi SPPD
    const [isRekapModalOpen, setIsRekapModalOpen] = useState(false);
    const [selectedRekapSkId, setSelectedRekapSkId] = useState<number | null>(null);
    const [rekapDate, setRekapDate] = useState('');
    const [rekapSearch, setRekapSearch] = useState('');
    const [rekapSkSearch, setRekapSkSearch] = useState('');
    const [rekapSkSortOrder, setRekapSkSortOrder] = useState<'terbaru' | 'terlama' | 'terbesar' | 'terkecil'>('terbaru');

    const sortedRekapSubKegiatans = useMemo(() => {
        let list = subKegiatans.map(sk => {
            const skTxs = pdTransactions.filter(tx => tx.sub_kegiatan_id === sk.id);
            const totalSpending = skTxs.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
            const pagu = Number(sk.anggaran_murni_pd) + Number(sk.anggaran_perubahan_pd);
            const sisa = Math.max(0, pagu - totalSpending);
            const percent = pagu > 0 ? (totalSpending / pagu) * 100 : 0;
            const timestamps = skTxs.map(tx => new Date(tx.tanggal).getTime()).filter(t => !isNaN(t));
            const latestDate = timestamps.length > 0 ? Math.max(...timestamps) : 0;
            const earliestDate = timestamps.length > 0 ? Math.min(...timestamps) : Infinity;

            return {
                ...sk,
                pagu,
                totalSpending,
                sisa,
                percent,
                txsCount: skTxs.length,
                latestDate,
                earliestDate,
            };
        });

        if (rekapSkSearch.trim()) {
            const q = rekapSkSearch.toLowerCase();
            list = list.filter(sk => (sk.nama || '').toLowerCase().includes(q));
        }

        list.sort((a, b) => {
            if (rekapSkSortOrder === 'terbaru') return b.latestDate - a.latestDate;
            if (rekapSkSortOrder === 'terlama') {
                const aTime = a.earliestDate === Infinity ? 0 : a.earliestDate;
                const bTime = b.earliestDate === Infinity ? 0 : b.earliestDate;
                return aTime - bTime;
            }
            if (rekapSkSortOrder === 'terbesar') return b.totalSpending - a.totalSpending;
            if (rekapSkSortOrder === 'terkecil') return a.totalSpending - b.totalSpending;
            return 0;
        });

        return list;
    }, [subKegiatans, pdTransactions, rekapSkSortOrder, rekapSkSearch]);

    const selectedRekapSubKegiatan = subKegiatans.find(sk => sk.id === selectedRekapSkId);

    const rekapData = useMemo(() => {
        if (!selectedRekapSubKegiatan) {
            return {
                paguAwal: 0,
                txs: [] as any[],
                totalRealisasi: 0,
                sisaAkhir: 0,
                totalPersonil: 0,
            };
        }

        const paguAwal = Number(selectedRekapSubKegiatan.anggaran_murni_pd) + Number(selectedRekapSubKegiatan.anggaran_perubahan_pd);
        const skTxs = pdTransactions.filter(tx => tx.sub_kegiatan_id === selectedRekapSubKegiatan.id);
        const chronoSorted = [...skTxs].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

        let running = 0;
        const enriched = chronoSorted.map(tx => {
            const realisasi = Number(tx.total) || 0;
            running += realisasi;
            const sisa = paguAwal - running;
            const personilCount = (tx.personil || []).length;
            const personilNames = (tx.personil || []).map(p => `${p.nama} (${formatRupiah(p.nominal)})`).join('; ');
            return {
                ...tx,
                realisasi,
                realisasiTotal: running,
                sisa,
                personilCount,
                personilNames,
            };
        });

        let filtered = enriched;
        if (rekapDate) {
            filtered = filtered.filter(tx => tx.tanggal === rekapDate || tx.tanggal.startsWith(rekapDate));
        }
        if (rekapSearch.trim()) {
            const query = rekapSearch.toLowerCase();
            filtered = filtered.filter(tx => 
                (tx.judul || '').toLowerCase().includes(query) ||
                (tx.wilayah || '').toLowerCase().includes(query) ||
                (tx.personilNames || '').toLowerCase().includes(query)
            );
        }

        const sortedDisplay = [...filtered].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        const totalRealisasi = filtered.reduce((sum, tx) => sum + tx.realisasi, 0);
        const totalPersonil = filtered.reduce((sum, tx) => sum + tx.personilCount, 0);
        const sisaAkhir = paguAwal - running;

        return {
            paguAwal,
            txs: sortedDisplay,
            totalRealisasi,
            sisaAkhir,
            totalPersonil,
        };
    }, [selectedRekapSubKegiatan, pdTransactions, rekapDate, rekapSearch]);

    const handleExportRekapExcel = () => {
        if (!selectedRekapSubKegiatan || rekapData.txs.length === 0) return;
        const skName = selectedRekapSubKegiatan.nama;
        const headers = ['No', 'Nama Sub Kegiatan', 'Pagu Awal PD', 'Realisasi', 'Sisa', 'Realisasi Total', 'Personil & Nominal', 'Wilayah', 'Judul SPPD', 'Tanggal'];
        
        const sanitizeCsvCell = (val: any) => {
            let str = String(val ?? '');
            if (/^[=+\-@\t\r]/.test(str)) {
                str = "'" + str;
            }
            return `"${str.replace(/"/g, '""')}"`;
        };

        const rows = rekapData.txs.map((tx, idx) => [
            idx + 1,
            sanitizeCsvCell(skName),
            rekapData.paguAwal,
            tx.realisasi,
            tx.sisa,
            tx.realisasiTotal,
            sanitizeCsvCell(tx.personilNames),
            sanitizeCsvCell(tx.wilayah),
            sanitizeCsvCell(tx.judul),
            `"${tx.tanggal}"`
        ]);

        const BOM = "\uFEFF";
        const csvContent = BOM + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const safeName = skName.substring(0, 30).replace(/[^a-zA-Z0-9_-]/g, '_');
        link.download = `Rekap_SPPD_${safeName}.csv`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 300);
    };

    // Filter Bulan di Modal Riwayat
    const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const [filterBulan, setFilterBulan] = useState<string>('');

    const groupedTransactions = useMemo(() => {
        const groups: Record<number, PdTransaction[]> = {};
        pdTransactions.forEach(tx => {
            if (!groups[tx.sub_kegiatan_id]) {
                groups[tx.sub_kegiatan_id] = [];
            }
            groups[tx.sub_kegiatan_id].push(tx);
        });
        return groups;
    }, [pdTransactions]);

    // Filtered transactions di dalam modal (hanya filter bulan, tahun ikut periode)
    const getFilteredModalTxs = (txs: PdTransaction[]) => {
        if (filterBulan === '') return txs;
        return txs.filter(tx => new Date(tx.tanggal).getMonth() === Number(filterBulan));
    };

    return (
        <MainLayout title="Perjalanan Dinas (SPPD)">
            <div className="space-y-8">
                {/* Menampilkan error global anggaran dari server jika ada */}
                {errors.anggaran && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                        <span className="font-bold">Error:</span> {errors.anggaran}
                    </div>
                )}

                {/* Form Card */}
                {!isViewer && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Plane className="text-blue-500" size={20} /> Input Perjalanan Dinas
                        </h3>
                        <form onSubmit={handleAddSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Sub Kegiatan</label>
                                    <select 
                                        required
                                        value={formAdd.data.sub_kegiatan_id}
                                        onChange={e => formAdd.setData('sub_kegiatan_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white"
                                    >
                                        <option value="">-- Pilih Sub Kegiatan --</option>
                                        {subKegiatans.filter(sk => getSisaAnggaran(sk.id) > 0).map(sk => (
                                            <option key={sk.id} value={sk.id}>{sk.nama}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Keberangkatan</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="date" 
                                            required
                                            value={formAdd.data.tanggal}
                                            onChange={e => formAdd.setData('tanggal', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Judul Kegiatan</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            required
                                            value={formAdd.data.judul}
                                            onChange={e => formAdd.setData('judul', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white"
                                            placeholder="Contoh: Kunjungan Kerja ke Provinsi"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Wilayah Tujuan</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            required
                                            value={formAdd.data.wilayah}
                                            onChange={e => formAdd.setData('wilayah', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white"
                                            placeholder="Contoh: Jakarta"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Undangan (Opsional, PDF, Max 10MB)</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => formAdd.setData('undangan_file', e.target.files ? e.target.files[0] : null)}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-slate-800">Daftar Personil</h4>
                                    <button 
                                        type="button" 
                                        onClick={addPersonil}
                                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Plus size={16} /> Tambah Personil
                                    </button>
                                </div>
                                
                                <div className="space-y-3">
                                    {personilList.map((p, index) => (
                                        <div key={p.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                            <div className="flex-1 w-full">
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={p.nama}
                                                    onChange={e => handlePersonilChange(p.id, 'nama', e.target.value)}
                                                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                                    placeholder={`Nama Personil ${index + 1}`}
                                                />
                                            </div>
                                            <div className="flex-1 w-full flex gap-2">
                                                <CurrencyInput 
                                                    required
                                                    value={p.nominal}
                                                    onChange={(val) => handlePersonilChange(p.id, 'nominal', val)}
                                                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                                    placeholder="Nominal (Rp)"
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => removePersonil(p.id)}
                                                    disabled={personilList.length === 1}
                                                    className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-5 rounded-xl border border-slate-200">
                                    <span className="font-medium text-slate-600 mb-1 sm:mb-0">Grand Total Transaksi:</span>
                                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{formatRupiah(grandTotal)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                {isOverBudgetAdd && (
                                    <div className="text-red-600 text-sm font-medium bg-red-50 px-4 py-3 rounded-xl border border-red-100 flex items-center justify-between">
                                        <span>Total transaksi melebihi sisa anggaran!</span>
                                        <span className="font-bold">Sisa: {formatRupiah(currentSisaAdd)}</span>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={formAdd.processing || isOverBudgetAdd}
                                        className="w-full sm:w-auto px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Simpan SPPD
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* History Grouped */}
                <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-800">Riwayat Perjalanan Dinas</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRekapModalOpen(true);
                                    setSelectedRekapSkId(null);
                                    setRekapDate('');
                                    setRekapSearch('');
                                    setRekapSkSearch('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
                                title="Buka Rekap Rinci SPPD per Sub Kegiatan"
                            >
                                <Table size={15} className="text-blue-600" />
                                <span>Rekap</span>
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as any)}
                                className="pl-3 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                            >
                                <option value="terbaru">Terbaru</option>
                                <option value="terlama">Terlama</option>
                                <option value="terbesar">Pengeluaran Terbesar</option>
                                <option value="terkecil">Pengeluaran Terkecil</option>
                            </select>
                            <span className="text-xs font-semibold px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                                {pdTransactions.length} Transaksi Total
                            </span>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar" style={{ maxHeight: '354px' }}>
                        {Object.keys(groupedTransactions).length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                Belum ada riwayat perjalanan dinas.
                            </div>
                        ) : (
                            Object.entries(groupedTransactions)
                            .sort(([, txsA], [, txsB]) => {
                                if (sortOrder === 'terbaru') {
                                    const latestA = new Date(txsA[0]?.created_at || 0).getTime();
                                    const latestB = new Date(txsB[0]?.created_at || 0).getTime();
                                    return latestB - latestA;
                                } else if (sortOrder === 'terlama') {
                                    const latestA = new Date(txsA[0]?.created_at || 0).getTime();
                                    const latestB = new Date(txsB[0]?.created_at || 0).getTime();
                                    return latestA - latestB;
                                } else if (sortOrder === 'terbesar') {
                                    const totalA = txsA.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
                                    const totalB = txsB.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
                                    return totalB - totalA;
                                } else if (sortOrder === 'terkecil') {
                                    const totalA = txsA.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
                                    const totalB = txsB.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
                                    return totalA - totalB;
                                }
                                return 0;
                            })
                            .map(([subKegiatanIdStr, txs]) => {
                                const subKegiatanId = Number(subKegiatanIdStr);
                                const subKegiatan = subKegiatans.find(sk => sk.id === subKegiatanId);
                                const groupTotal = txs.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);

                                return (
                                    <div key={subKegiatanId} className="bg-white">
                                        <button 
                                            onClick={() => setSelectedHistoryGroup(subKegiatanId)}
                                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-1.5 rounded-full transition-transform bg-slate-100 text-slate-400 shrink-0">
                                                    <ChevronRight size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-semibold text-slate-800">{subKegiatan?.nama || 'Sub Kegiatan Tidak Dikenal'}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">{txs.length} Transaksi</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-slate-900">
                                                {formatRupiah(groupTotal)}
                                            </div>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* History Details Modal */}
                {selectedHistoryGroup !== null && groupedTransactions[selectedHistoryGroup] && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-200 bg-white sticky top-0 z-10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">
                                            {subKegiatans.find(sk => sk.id === selectedHistoryGroup)?.nama || 'Sub Kegiatan Tidak Dikenal'}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {getFilteredModalTxs(groupedTransactions[selectedHistoryGroup]).length} dari {groupedTransactions[selectedHistoryGroup].length} Transaksi
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedHistoryGroup(null); setFilterBulan(''); }}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                {/* Filter Row */}
                                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                                        <Filter size={16} className="text-blue-500" /> Filter Bulan:
                                    </div>
                                    <select
                                        value={filterBulan}
                                        onChange={e => setFilterBulan(e.target.value)}
                                        className="rounded-lg border border-slate-300 pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white cursor-pointer"
                                    >
                                        <option value="">Semua Bulan</option>
                                        {BULAN_NAMES.map((name, idx) => (
                                            <option key={idx} value={idx}>{name}</option>
                                        ))}
                                    </select>
                                    {filterBulan !== '' && (
                                        <button
                                            onClick={() => setFilterBulan('')}
                                            className="text-xs text-rose-500 hover:text-rose-700 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[60vh] scroll-smooth">
                                <div className="space-y-4">
                                    {getFilteredModalTxs(groupedTransactions[selectedHistoryGroup]).length === 0 ? (
                                        <div className="p-12 text-center text-slate-400 text-sm font-medium">
                                            Tidak ada transaksi ditemukan untuk filter yang dipilih.
                                        </div>
                                    ) : getFilteredModalTxs(groupedTransactions[selectedHistoryGroup]).map(tx => (
                                        <div key={tx.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4 transition-all hover:shadow-md hover:border-blue-200">
                                            <div className="flex-1">
                                                <div className="mb-2">
                                                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full inline-flex items-center gap-1 mb-2">
                                                        <Calendar size={12} /> {formatDate(tx.tanggal)} • {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <h5 className="font-bold text-slate-800 text-base mt-1.5">{tx.judul}</h5>
                                                </div>
                                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-4 font-bold uppercase tracking-wider">
                                                    <MapPin size={14} className="text-blue-500" /> {tx.wilayah}
                                                </div>
                                                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/80">
                                                    <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                                                        <Users size={14} className="text-blue-500" /> Daftar Personil
                                                    </div>
                                                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left w-10">No</th>
                                                                    <th className="px-3 py-2 text-left">Nama Personil</th>
                                                                    <th className="px-3 py-2 text-right">Biaya / Nominal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {tx.personil.map((p, idx) => (
                                                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                                        <td className="px-3 py-2 text-slate-400 font-medium">{idx + 1}</td>
                                                                        <td className="px-3 py-2 text-slate-700 font-medium">{p.nama}</td>
                                                                        <td className="px-3 py-2 text-right text-slate-900 font-semibold">{formatRupiah(p.nominal)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2.5 mt-4">
                                                    {/* Bagian Undangan */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-slate-500 w-24 shrink-0">Undangan:</span>
                                                        <div className="flex items-center">
                                                            {tx.undangan_file ? (
                                                                <button onClick={() => openViewer(`/storage/${tx.undangan_file}`)} className="text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                                                                    <FileText size={14} /> Lihat File
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs font-medium bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                                                    <FileText size={14} /> Tdk Ada Undangan
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Bagian Dokumentasi */}
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-xs font-semibold text-slate-500 w-24 shrink-0 pt-1.5">Dokumentasi:</span>
                                                        <div className="flex flex-col gap-1.5">
                                                            {(() => {
                                                                let files: string[] = [];
                                                                if (Array.isArray(tx.dokumentasi_files)) {
                                                                    files = tx.dokumentasi_files;
                                                                } else if (typeof tx.dokumentasi_files === 'string') {
                                                                    try {
                                                                        const parsed = JSON.parse(tx.dokumentasi_files);
                                                                        files = Array.isArray(parsed) ? parsed : [tx.dokumentasi_files];
                                                                    } catch (e) {
                                                                        files = [tx.dokumentasi_files];
                                                                    }
                                                                }
                                                                const displayFiles = expandedDocs[tx.id] ? files : files.slice(0, 5);
                                                                return files.length > 0 ? (
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {displayFiles.map((file: string, idx: number) => (
                                                                            <button key={idx} onClick={() => openViewer(`/storage/${file}`)} className="text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                                                                                <FileText size={14} /> Foto {idx + 1}
                                                                            </button>
                                                                        ))}
                                                                        {files.length > 5 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleExpandDocs(tx.id)}
                                                                                className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                                                                            >
                                                                                {expandedDocs[tx.id] ? (
                                                                                    <>Tutup <ChevronUp size={13} /></>
                                                                                ) : (
                                                                                    <>+{files.length - 5} Lainnya <ChevronDown size={13} /></>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs font-medium bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                                                        <FileText size={14} /> Tdk Ada Dokumentasi
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full md:w-auto mt-2 md:mt-0 items-start md:items-end">
                                                <div className="text-left md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-lg w-full md:w-auto">
                                                    <div className="text-xs text-slate-500 mb-1 font-medium">Total Biaya</div>
                                                    <div className="font-bold text-amber-600 text-lg">{formatRupiah(tx.total)}</div>
                                                </div>
                                                {!isViewer && (
                                                    <div className="flex items-center gap-2 md:pl-5 md:border-l border-slate-200 justify-end w-full md:w-auto">
                                                        <button
                                                            onClick={() => handleOpenEdit(tx)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                            title="Edit SPPD"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Edit Modal */}
                {isEditModalOpen && createPortal(
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-lg">Edit SPPD</h3>
                                <button 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <form id="edit-pd-form" onSubmit={handleEditSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Sub Kegiatan</label>
                                            <select 
                                                required
                                                value={formEdit.data.sub_kegiatan_id}
                                                onChange={e => formEdit.setData('sub_kegiatan_id', e.target.value)}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white"
                                            >
                                                <option value="">-- Pilih Sub Kegiatan --</option>
                                                {subKegiatans.filter(sk => getSisaAnggaranEdit(sk.id, formEdit.data.id) > 0 || sk.id === Number(formEdit.data.sub_kegiatan_id)).map(sk => (
                                                    <option key={sk.id} value={sk.id}>{sk.nama}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Keberangkatan</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="date" 
                                                    required
                                                    value={formEdit.data.tanggal ? formEdit.data.tanggal.split('T')[0] : ''}
                                                    onChange={e => formEdit.setData('tanggal', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Judul Kegiatan</label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={formEdit.data.judul}
                                                    onChange={e => formEdit.setData('judul', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Wilayah Tujuan</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={formEdit.data.wilayah}
                                                    onChange={e => formEdit.setData('wilayah', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-slate-800">Daftar Personil</h4>
                                            <button 
                                                type="button" 
                                                onClick={addEditPersonil}
                                                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Plus size={16} /> Tambah Personil
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {editPersonilList.map((p, index) => (
                                                <div key={p.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                                    <div className="flex-1 w-full">
                                                        <input 
                                                            type="text" 
                                                            required
                                                            value={p.nama}
                                                            onChange={e => handleEditPersonilChange(p.id, 'nama', e.target.value)}
                                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                                            placeholder={`Nama Personil ${index + 1}`}
                                                        />
                                                    </div>
                                                    <div className="flex-1 w-full flex gap-2">
                                                        <CurrencyInput 
                                                            required
                                                            value={p.nominal}
                                                            onChange={(val) => handleEditPersonilChange(p.id, 'nominal', val)}
                                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                                            placeholder="Nominal (Rp)"
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeEditPersonil(p.id)}
                                                            disabled={editPersonilList.length === 1}
                                                            className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-50 transition-colors"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Upload / Ganti Undangan & Dokumentasi */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 items-start">
                                            <div className="flex flex-col">
                                                <label className="block text-sm font-medium text-slate-700 mb-2 h-10 flex items-center">
                                                    File Undangan (PDF)
                                                </label>
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={e => formEdit.setData('undangan_file', e.target.files ? e.target.files[0] : null)}
                                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded-xl cursor-pointer bg-white"
                                                />
                                                <p className="text-[11px] text-slate-400 mt-1 mb-2">Pilih file PDF jika ingin mengganti file undangan.</p>

                                                {editingTx?.undangan_file ? (
                                                    <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between mt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openViewer(`/storage/${editingTx.undangan_file}`)}
                                                            className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1.5 truncate max-w-[180px]"
                                                        >
                                                            <FileText size={15} /> Lihat File Undangan
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteFileItem({
                                                                txId: editingTx.id,
                                                                type: 'undangan',
                                                                label: 'File Undangan'
                                                            })}
                                                            className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                                                            title="Hapus Undangan"
                                                        >
                                                            <Trash2 size={14} /> Hapus
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-slate-400 italic mt-1">Belum ada file undangan tersimpan.</div>
                                                )}
                                            </div>

                                            <div className="flex flex-col">
                                                <label className="block text-sm font-medium text-slate-700 mb-2 h-10 flex items-center">
                                                    Foto / Dokumentasi Kegiatan (PNG, JPG, JPEG)
                                                </label>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept=".jpg,.jpeg,.png"
                                                    onChange={e => formEdit.setData('dokumentasi_files', e.target.files ? Array.from(e.target.files) : [])}
                                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded-xl cursor-pointer bg-white"
                                                />
                                                <p className="text-[11px] text-slate-400 mt-1 mb-2">Dapat memilih lebih dari 1 file foto gambar (PNG, JPG, JPEG).</p>

                                                {(() => {
                                                    let files: string[] = [];
                                                    if (Array.isArray(editingTx?.dokumentasi_files)) {
                                                        files = editingTx.dokumentasi_files;
                                                    } else if (typeof editingTx?.dokumentasi_files === 'string') {
                                                        try {
                                                            const parsed = JSON.parse(editingTx.dokumentasi_files);
                                                            files = Array.isArray(parsed) ? parsed : [editingTx.dokumentasi_files];
                                                        } catch (e) {
                                                            files = [editingTx.dokumentasi_files];
                                                        }
                                                    }
                                                    return files.length > 0 ? (
                                                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 mt-2">
                                                            {files.map((file, idx) => (
                                                                <div key={idx} className="p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openViewer(`/storage/${file}`)}
                                                                        className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1.5 truncate max-w-[180px]"
                                                                    >
                                                                        <FileText size={15} /> Foto {idx + 1}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDeleteFileItem({
                                                                            txId: editingTx!.id,
                                                                            type: 'dokumentasi',
                                                                            path: file,
                                                                            label: `Foto Dokumentasi ${idx + 1}`
                                                                        })}
                                                                        className="p-1.5 hover:bg-red-100 text-red-500 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                                                                        title="Hapus Foto"
                                                                    >
                                                                        <Trash2 size={14} /> Hapus
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400 italic mt-1">Belum ada foto dokumentasi tersimpan.</div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div className="mt-6 flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-slate-600">Grand Total:</span>
                                                <span className="font-bold text-slate-900 text-lg">{formatRupiah(editGrandTotal)}</span>
                                            </div>
                                            {isOverBudgetEdit && (
                                                <div className="pt-2 text-red-600 font-medium text-xs flex justify-between border-t border-slate-200">
                                                    <span>Peringatan: Anggaran tidak mencukupi!</span>
                                                    <span>Sisa saat ini: {formatRupiah(currentSisaEdit)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                                <div>
                                    {editingTx && (
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDelete(editingTx)}
                                            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl border border-red-200 transition-colors flex items-center gap-2 shadow-sm focus:outline-none"
                                            title="Hapus Transaksi Ini"
                                        >
                                            <Trash2 size={16} />
                                            <span>Hapus Transaksi</span>
                                        </button>
                                    )}
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
                                        form="edit-pd-form"
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
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-xl mb-2">Hapus SPPD?</h3>
                                <p className="text-slate-500 text-sm mb-1">
                                    Anda yakin ingin menghapus transaksi <span className="font-bold text-slate-700">"{deleteItem.judul}"</span>?
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

                {/* Modal Rekap per Sub Kegiatan SPPD */}
                {isRekapModalOpen && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[96vw] xl:max-w-[1550px] h-[92vh] max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-fade-in-up">

                            {/* CASE 1: DAFTAR SUB KEGIATAN SPPD */}
                            {selectedRekapSkId === null ? (
                                <>
                                    <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
                                                <Table size={22} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                                                    Rekapitulasi SPPD per Sub Kegiatan
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Pilih Sub Kegiatan di bawah ini untuk melihat lembar kerja rincian perjalanan dinas
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={rekapSkSearch}
                                                    onChange={e => setRekapSkSearch(e.target.value)}
                                                    placeholder="Cari Sub Kegiatan..."
                                                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white w-40 sm:w-52 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            <select
                                                value={rekapSkSortOrder}
                                                onChange={e => setRekapSkSortOrder(e.target.value as any)}
                                                className="pl-3 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer font-semibold text-slate-700"
                                            >
                                                <option value="terbaru">Terbaru</option>
                                                <option value="terlama">Terlama</option>
                                                <option value="terbesar">Pengeluaran Terbesar</option>
                                                <option value="terkecil">Pengeluaran Terkecil</option>
                                            </select>

                                            <span className="text-xs font-semibold px-2.5 py-1.5 bg-blue-100 text-blue-800 rounded-lg whitespace-nowrap hidden sm:inline">
                                                {sortedRekapSubKegiatans.length} Sub Kegiatan
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => setIsRekapModalOpen(false)}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                                                title="Tutup"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/40 space-y-3">
                                        {sortedRekapSubKegiatans.length === 0 ? (
                                            <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-xl border border-slate-200">
                                                Tidak ada sub kegiatan yang sesuai dengan kriteria pencarian.
                                            </div>
                                        ) : (
                                            sortedRekapSubKegiatans.map((sk, idx) => (
                                                <div
                                                    key={sk.id}
                                                    onClick={() => {
                                                        setSelectedRekapSkId(sk.id);
                                                        setRekapDate('');
                                                        setRekapSearch('');
                                                    }}
                                                    className="bg-white rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                                                >
                                                    <div className="flex items-start gap-3 min-w-0 md:w-5/12">
                                                        <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-200 mt-0.5">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-blue-700 transition-colors break-words line-clamp-2 sm:line-clamp-none" title={sk.nama}>
                                                                    {sk.nama}
                                                                </h4>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                                                    {sk.txsCount} SPPD
                                                                </span>
                                                            </div>
                                                            {sk.latestDate > 0 && (
                                                                <span className="text-[11px] text-slate-500 mt-1 block">
                                                                    SPPD terakhir: <span className="font-semibold text-slate-700">{new Date(sk.latestDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-4 border-t md:border-t-0 md:border-l md:border-r border-slate-100 pt-3 md:pt-0 md:px-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Pagu PD</span>
                                                            <span className="text-xs sm:text-sm font-bold text-slate-800">{formatRupiah(sk.pagu)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Realisasi</span>
                                                            <span className="text-xs sm:text-sm font-bold text-blue-600">{formatRupiah(sk.totalSpending)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Sisa Anggaran</span>
                                                            <span className="text-xs sm:text-sm font-bold text-emerald-600">{formatRupiah(sk.sisa)}</span>
                                                        </div>
                                                        <div className="col-span-3 mt-1">
                                                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                                                <span>Penyerapan</span>
                                                                <span className="font-bold text-slate-700">{sk.percent.toFixed(1)}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(sk.percent, 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 flex items-center justify-end md:pl-2">
                                                        <button
                                                            type="button"
                                                            className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white rounded-xl transition-all flex items-center gap-1.5 border border-blue-200 group-hover:border-blue-600 shadow-xs cursor-pointer"
                                                        >
                                                            <Table size={14} />
                                                            <span>Buka Rekap</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* CASE 2: LEMBAR KERJA REKAP SPPD */}
                                    <div className="p-3 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRekapSkId(null)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors shadow-xs shrink-0 cursor-pointer"
                                            >
                                                <ArrowLeft size={14} />
                                                <span className="hidden sm:inline">Daftar Sub Kegiatan</span>
                                                <span className="sm:hidden">Kembali</span>
                                            </button>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate" title={selectedRekapSubKegiatan?.nama}>
                                                    {selectedRekapSubKegiatan?.nama}
                                                </h3>
                                                <span className="text-[10px] sm:text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 inline-block mt-0.5">
                                                    Rekapitulasi Perjalanan Dinas (SPPD)
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                                            <select
                                                value={selectedRekapSkId}
                                                onChange={e => {
                                                    setSelectedRekapSkId(Number(e.target.value));
                                                    setRekapDate('');
                                                    setRekapSearch('');
                                                }}
                                                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 w-auto min-w-[150px] max-w-[260px] truncate focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-xs"
                                            >
                                                {subKegiatans.map(sk => (
                                                    <option key={sk.id} value={sk.id}>{sk.nama}</option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={handleExportRekapExcel}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                                                title="Download file Excel (.csv)"
                                            >
                                                <Download size={14} />
                                                <span className="hidden sm:inline">Export Excel</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setIsRekapModalOpen(false)}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors ml-1 cursor-pointer shrink-0"
                                                title="Tutup"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Summary Strip */}
                                    <div className="p-3 sm:p-4 bg-white border-b border-slate-200 shrink-0">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-50 p-2.5 sm:p-3.5 rounded-xl border border-slate-200/80">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Pagu Awal PD</span>
                                                <span className="text-xs sm:text-base font-extrabold text-slate-800">{formatRupiah(rekapData.paguAwal)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Total Realisasi</span>
                                                <span className="text-xs sm:text-base font-extrabold text-blue-600">{formatRupiah(rekapData.totalRealisasi)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Sisa Akhir Pagu</span>
                                                <span className="text-xs sm:text-base font-extrabold text-emerald-600">{formatRupiah(rekapData.sisaAkhir)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Total Keberangkatan</span>
                                                <span className="text-xs sm:text-base font-extrabold text-purple-700">{rekapData.txs.length} Kegiatan ({rekapData.totalPersonil} Personil)</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <div className="relative flex-1 min-w-[140px] sm:max-w-xs">
                                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={rekapSearch}
                                                    onChange={e => setRekapSearch(e.target.value)}
                                                    placeholder="Cari judul, wilayah, personil..."
                                                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-full bg-white focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={rekapDate}
                                                    onChange={e => setRekapDate(e.target.value)}
                                                    className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
                                                    title="Filter Berdasarkan Tanggal"
                                                />
                                            </div>
                                            {(rekapDate || rekapSearch) && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setRekapDate(''); setRekapSearch(''); }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-200/60 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <RotateCcw size={12} />
                                                    <span>Reset Filter</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rekap Table dengan Merged Cell untuk Sub Kegiatan */}
                                    <div className="flex-1 overflow-auto custom-scrollbar p-3 sm:p-5">
                                        <table className="w-full text-xs text-left border-collapse border border-slate-300">
                                            <thead>
                                                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider text-center border-b border-slate-300">
                                                    <th className="border border-slate-300 px-3 py-2.5 w-12">No</th>
                                                    <th className="border border-slate-300 px-3 py-2.5 w-56">Sub Kegiatan</th>
                                                    <th className="border border-slate-300 px-3 py-2.5 w-32">Pagu Awal PD</th>
                                                    <th className="border border-slate-300 px-3 py-2.5 w-32">Realisasi</th>
                                                    <th className="border border-slate-300 px-3 py-2.5 w-32">Sisa</th>
                                                    <th className="border border-slate-300 px-3 py-2.5 w-32">Realisasi Total</th>
                                                    <th className="border border-slate-300 px-3 py-2.5">Personil & Nominal</th>
                                                    <th className="border border-slate-300 px-3 py-2.5 w-32">Wilayah</th>
                                                    <th className="border border-slate-300 px-3 py-2.5 w-44">Judul SPPD</th>
                                                    <th className="border border-slate-300 px-3 py-2.5 w-28">Tanggal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {rekapData.txs.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={10} className="border border-slate-300 px-4 py-8 text-center text-slate-400">
                                                            Belum ada rincian data SPPD yang sesuai filter.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    rekapData.txs.map((tx, idx) => (
                                                        <tr key={tx.id} className="hover:bg-blue-50/40 transition-colors">
                                                            <td className="border border-slate-300 px-3 py-2.5 text-center font-medium text-slate-500">
                                                                {idx + 1}
                                                            </td>
                                                            {idx === 0 ? (
                                                                <td
                                                                    rowSpan={rekapData.txs.length}
                                                                    className="border border-slate-300 px-3 py-2.5 font-bold text-slate-800 bg-white align-middle text-center break-words"
                                                                >
                                                                    {selectedRekapSubKegiatan?.nama}
                                                                </td>
                                                            ) : null}
                                                            <td className="border border-slate-300 px-3 py-2.5 text-right font-mono font-semibold text-slate-700">
                                                                {formatRupiah(rekapData.paguAwal)}
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-right font-mono font-bold text-blue-600">
                                                                {formatRupiah(tx.realisasi)}
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-right font-mono font-bold text-emerald-600">
                                                                {formatRupiah(tx.sisa)}
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-right font-mono font-bold text-slate-700">
                                                                {formatRupiah(tx.realisasiTotal)}
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-slate-700">
                                                                <div className="space-y-1">
                                                                    {(tx.personil || []).map((p: any, pIdx: number) => (
                                                                        <div key={pIdx} className="flex justify-between gap-2 text-[11px]">
                                                                            <span className="font-medium text-slate-800">• {p.nama}</span>
                                                                            <span className="font-mono text-slate-500 font-semibold">{formatRupiah(p.nominal)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-slate-700 font-medium">
                                                                {tx.wilayah}
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-slate-800 font-semibold">
                                                                {tx.judul}
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-center text-slate-600 font-mono whitespace-nowrap">
                                                                {formatDate(tx.tanggal)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>,
                    document.body
                )}

                {/* Modal Hapus Personil Baris Form */}
                {deletePersonilItem && createPortal(
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in-up">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-xl mb-2">Hapus Personil?</h3>
                                <p className="text-slate-500 text-sm mb-1">
                                    Anda yakin ingin menghapus data personil <span className="font-bold text-slate-700">"{deletePersonilItem.nama}"</span>?
                                </p>
                                <p className="text-slate-400 text-xs">
                                    Data pada baris personil ini akan dihapus dari daftar.
                                </p>
                            </div>
                            <div className="p-6 pt-0 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDeletePersonilItem(null)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors focus:outline-none"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDeletePersonil}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Modal Hapus File (Undangan / Dokumentasi) */}
                {deleteFileItem && createPortal(
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in-up">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-xl mb-2">Hapus Berkas?</h3>
                                <p className="text-slate-500 text-sm mb-1">
                                    Anda yakin ingin menghapus <span className="font-bold text-slate-700">"{deleteFileItem.label}"</span>?
                                </p>
                                <p className="text-slate-400 text-xs">
                                    File akan dihapus permanen dari penyimpanan.
                                </p>
                            </div>
                            <div className="p-6 pt-0 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDeleteFileItem(null)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors focus:outline-none"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDeleteFile}
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
            <FileViewerModal 
                isOpen={isViewerOpen} 
                onClose={() => setIsViewerOpen(false)} 
                fileUrl={viewerUrl} 
            />
        </MainLayout>
    );
}
