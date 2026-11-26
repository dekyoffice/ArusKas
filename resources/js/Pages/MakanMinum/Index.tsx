import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { formatRupiah, formatDate } from '@/utils/formatters';
import { Coffee, Calendar, FileText, Package, ChevronRight, ChevronDown, ChevronUp, Pencil, Trash2, X, Filter, Upload, Table, FileSpreadsheet, ArrowLeft, Search, RotateCcw, Download, ArrowLeftRight, Settings, Check } from 'lucide-react';
import FileViewerModal from '@/Components/FileViewerModal';

interface SubKegiatan {
    id: number;
    nama: string;
    anggaran_murni_mm: number;
    anggaran_perubahan_mm: number;
}

interface MmTransaction {
    id: number;
    sub_kegiatan_id: number;
    judul: string;
    tanggal: string;
    qty_snack: number;
    qty_nasi: number;
    base_harga: number;
    pajak: number;
    pph: number;
    grand_total: number;
    undangan_file?: string | null;
    dokumentasi_files?: string[] | null;
    created_at: string;
}

interface Props {
    selectedYear: number;
    subKegiatans: SubKegiatan[];
    mmTransactions: MmTransaction[];
    pricing?: {
        snack_price: number;
        nasi_price: number;
    };
}

export default function MmIndex({ selectedYear, subKegiatans, mmTransactions, pricing }: Props) {
    const { errors, auth } = usePage().props as any;
    const isViewer = auth.user.role === 'viewer';

    const defaultSnack = pricing?.snack_price ?? 15400;
    const defaultNasi = pricing?.nasi_price ?? 46300;

    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const formPrice = useForm({
        snack_price: defaultSnack,
        nasi_price: defaultNasi,
    });

    const SNACK_PRICE = defaultSnack;
    const NASI_PRICE = defaultNasi;

    // Form Tambah
    const formAdd = useForm({
        sub_kegiatan_id: '',
        judul: '',
        tanggal: new Date().toISOString().split('T')[0],
        jenis_rapat: 'biasa',
        qty_snack: '',
        qty_nasi: '',
        undangan_file: null as File | null,
    });

    const numSnack = parseInt(formAdd.data.qty_snack) || 0;
    const numNasi = parseInt(formAdd.data.qty_nasi) || 0;
    const baseHarga = (numSnack * SNACK_PRICE) + (numNasi * NASI_PRICE);
    const pajak = baseHarga * 0.10;
    const pph = baseHarga * 0.005;
    const grandTotal = baseHarga + pajak;

    // Validasi Frontend Budget
    const selectedSubKegiatan = subKegiatans.find(sk => String(sk.id) === formAdd.data.sub_kegiatan_id);
    const paguMM = selectedSubKegiatan ? (Number(selectedSubKegiatan.anggaran_murni_mm) + Number(selectedSubKegiatan.anggaran_perubahan_mm)) : 0;
    const realisasiMM = mmTransactions
        .filter(tx => String(tx.sub_kegiatan_id) === formAdd.data.sub_kegiatan_id)
        .reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);
    const sisaAnggaranMM = paguMM - realisasiMM;
    const isOverBudget = formAdd.data.sub_kegiatan_id !== '' && grandTotal > sisaAnggaranMM;

    const getSisaAnggaranMM = (skId: number) => {
        const sk = subKegiatans.find(s => s.id === skId);
        if (!sk) return 0;
        const pagu = Number(sk.anggaran_murni_mm) + Number(sk.anggaran_perubahan_mm);
        const terpakai = mmTransactions.filter(tx => tx.sub_kegiatan_id === skId).reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);
        return pagu - terpakai;
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (numSnack < 0 || numNasi < 0) {
            alert('Jumlah tidak boleh minus.');
            return;
        }

        formAdd.post(route('makan-minum.store'), {
            onSuccess: () => {
                formAdd.reset();
            }
        });
    };

    // Modal Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<MmTransaction | null>(null);
    const formEdit = useForm<{
        id: number;
        sub_kegiatan_id: string;
        judul: string;
        tanggal: string;
        jenis_rapat: string;
        qty_snack: string;
        qty_nasi: string;
        undangan_file: File | null;
        dokumentasi_files: File[];
    }>({
        id: 0,
        sub_kegiatan_id: '',
        judul: '',
        tanggal: '',
        jenis_rapat: 'biasa',
        qty_snack: '',
        qty_nasi: '',
        undangan_file: null,
        dokumentasi_files: [],
    });

    const editNumSnack = parseInt(formEdit.data.qty_snack) || 0;
    const editNumNasi = parseInt(formEdit.data.qty_nasi) || 0;
    const editBaseHarga = (editNumSnack * SNACK_PRICE) + (editNumNasi * NASI_PRICE);
    const editPajak = editBaseHarga * 0.10;
    const editPph = editBaseHarga * 0.005;
    const editGrandTotal = editBaseHarga + editPajak;

    const editSelectedSubKegiatan = subKegiatans.find(sk => String(sk.id) === formEdit.data.sub_kegiatan_id);
    const editPaguMM = editSelectedSubKegiatan ? (Number(editSelectedSubKegiatan.anggaran_murni_mm) + Number(editSelectedSubKegiatan.anggaran_perubahan_mm)) : 0;
    const editRealisasiMM = mmTransactions
        .filter(tx => String(tx.sub_kegiatan_id) === formEdit.data.sub_kegiatan_id && String(tx.id) !== String(formEdit.data.id))
        .reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);
    const editSisaAnggaranMM = editPaguMM - editRealisasiMM;
    const isEditOverBudget = formEdit.data.sub_kegiatan_id !== '' && editGrandTotal > editSisaAnggaranMM;

    const getSisaAnggaranMMEdit = (skId: number, editTxId: number) => {
        const sk = subKegiatans.find(s => s.id === skId);
        if (!sk) return 0;
        const pagu = Number(sk.anggaran_murni_mm) + Number(sk.anggaran_perubahan_mm);
        const terpakai = mmTransactions.filter(tx => tx.sub_kegiatan_id === skId && String(tx.id) !== String(editTxId)).reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);
        return pagu - terpakai;
    };

    const handleOpenEdit = (tx: MmTransaction) => {
        setEditingTx(tx);
        formEdit.setData({
            id: tx.id,
            sub_kegiatan_id: String(tx.sub_kegiatan_id),
            judul: tx.judul,
            tanggal: tx.tanggal ? tx.tanggal.split('T')[0] : '',
            jenis_rapat: (tx as any).jenis_rapat || 'biasa',
            qty_snack: String(tx.qty_snack),
            qty_nasi: String(tx.qty_nasi),
            undangan_file: null,
            dokumentasi_files: [],
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editNumSnack < 0 || editNumNasi < 0) {
            alert('Jumlah tidak boleh minus.');
            return;
        }

        formEdit.transform(data => ({
            ...data,
            _method: 'put',
        }));
        formEdit.post(route('makan-minum.update', formEdit.data.id), {
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
    const [deleteItem, setDeleteItem] = useState<{ id: number, judul: string } | null>(null);

    // Modal Hapus File (Undangan / Dokumentasi)
    const [deleteFileItem, setDeleteFileItem] = useState<{ txId: number; type: 'undangan' | 'dokumentasi'; path?: string; label: string } | null>(null);

    const handleOpenDelete = (tx: MmTransaction) => {
        setDeleteItem({ id: tx.id, judul: tx.judul });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteItem) {
            router.delete(route('makan-minum.destroy', deleteItem.id), {
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
        router.post(route('makan-minum.delete-file', txId), {
            _method: 'POST',
            type,
            path,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (type === 'undangan') {
                    setEditingTx(prev => prev ? { ...prev, undangan_file: null } : null);
                } else if (type === 'dokumentasi' && path) {
                    setEditingTx(prev => prev ? {
                        ...prev,
                        dokumentasi_files: (prev.dokumentasi_files || []).filter(f => f !== path)
                    } : null);
                }
                setDeleteFileItem(null);
            }
        });
    };

    const handleUploadDokumentasi = (txId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            router.post(route('makan-minum.upload-dokumentasi', txId), {
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
            router.post(route('makan-minum.upload-undangan', txId), {
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
            router.post(route('makan-minum.delete-file', txId), {
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

    // State Modal Rekap Excel per Sub Kegiatan
    // State Modal Rekap per Sub Kegiatan
    const [isRekapModalOpen, setIsRekapModalOpen] = useState(false);
    const [selectedRekapSkId, setSelectedRekapSkId] = useState<number | null>(null);
    const [rekapDate, setRekapDate] = useState('');
    const [rekapSearch, setRekapSearch] = useState('');
    const [rekapSkSortOrder, setRekapSkSortOrder] = useState<'terbaru' | 'terlama' | 'terbesar' | 'terkecil'>('terbaru');
    const [rekapSkSearch, setRekapSkSearch] = useState('');

    // Global Key Handlers untuk Modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isViewerOpen) return; // Biarkan FileViewerModal yang handle
                if (deleteFileItem) setDeleteFileItem(null);
                else if (isDeleteModalOpen) setIsDeleteModalOpen(false);
                else if (isEditModalOpen) setIsEditModalOpen(false);
                else if (isRekapModalOpen) {
                    if (selectedRekapSkId !== null) setSelectedRekapSkId(null);
                    else setIsRekapModalOpen(false);
                }
                else if (selectedHistoryGroup !== null) setSelectedHistoryGroup(null);
            }
            if (e.key === 'Enter') {
                if (deleteFileItem) handleConfirmDeleteFile();
                else if (isDeleteModalOpen) handleConfirmDelete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isViewerOpen, isDeleteModalOpen, isEditModalOpen, isRekapModalOpen, selectedRekapSkId, selectedHistoryGroup, deleteItem, deleteFileItem]);

    // Filter Bulan di Modal Riwayat
    const BULAN_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const [filterBulan, setFilterBulan] = useState<string>('');

    const groupedTransactions = useMemo(() => {
        const groups: Record<number, MmTransaction[]> = {};
        mmTransactions.forEach(tx => {
            if (!groups[tx.sub_kegiatan_id]) {
                groups[tx.sub_kegiatan_id] = [];
            }
            groups[tx.sub_kegiatan_id].push(tx);
        });
        return groups;
    }, [mmTransactions]);

    // Filtered transactions di dalam modal riwayat lama
    const getFilteredModalTxs = (txs: MmTransaction[]) => {
        if (filterBulan === '') return txs;
        return txs.filter(tx => new Date(tx.tanggal).getMonth() === Number(filterBulan));
    };

    // List Sub Kegiatan terurut untuk View 1 (List Atas ke Bawah dengan filter terbaru, terlama, terbanyak, tersedikit)
    const sortedRekapSubKegiatans = useMemo(() => {
        let list = subKegiatans.map(sk => {
            const txs = mmTransactions.filter(tx => tx.sub_kegiatan_id === sk.id);
            const totalSpending = txs.reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);
            const pagu = Number(sk.anggaran_murni_mm) + Number(sk.anggaran_perubahan_mm);
            const sisa = pagu - totalSpending;
            const percent = pagu > 0 ? (totalSpending / pagu) * 100 : 0;
            const timestamps = txs.map(t => new Date(t.tanggal).getTime()).filter(t => !isNaN(t));
            const latestDate = timestamps.length > 0 ? Math.max(...timestamps) : 0;
            const earliestDate = timestamps.length > 0 ? Math.min(...timestamps) : Infinity;

            return {
                ...sk,
                txsCount: txs.length,
                totalSpending,
                pagu,
                sisa,
                percent,
                latestDate,
                earliestDate,
            };
        });

        if (rekapSkSearch.trim()) {
            const q = rekapSkSearch.toLowerCase();
            list = list.filter(sk => (sk.nama || '').toLowerCase().includes(q));
        }

        list.sort((a, b) => {
            if (rekapSkSortOrder === 'terbaru') {
                return b.latestDate - a.latestDate;
            } else if (rekapSkSortOrder === 'terlama') {
                const aTime = a.earliestDate === Infinity ? 0 : a.earliestDate;
                const bTime = b.earliestDate === Infinity ? 0 : b.earliestDate;
                return aTime - bTime;
            } else if (rekapSkSortOrder === 'terbesar') {
                return b.totalSpending - a.totalSpending;
            } else if (rekapSkSortOrder === 'terkecil') {
                return a.totalSpending - b.totalSpending;
            }
            return 0;
        });

        return list;
    }, [subKegiatans, mmTransactions, rekapSkSortOrder, rekapSkSearch]);

    // Data Rekap untuk Sub Kegiatan Terpilih
    const selectedRekapSubKegiatan = subKegiatans.find(sk => sk.id === selectedRekapSkId);

    const rekapData = useMemo(() => {
        if (!selectedRekapSubKegiatan) {
            return {
                paguAwal: 0,
                txs: [] as any[],
                totalRealisasi: 0,
                sisaAkhir: 0,
                totalSnack: 0,
                totalNasi: 0,
                totalPaket: 0,
            };
        }

        const paguAwal = Number(selectedRekapSubKegiatan.anggaran_murni_mm) + Number(selectedRekapSubKegiatan.anggaran_perubahan_mm);
        const skTxs = mmTransactions.filter(tx => tx.sub_kegiatan_id === selectedRekapSubKegiatan.id);

        // Urutkan kronologis dari paling awal ke akhir untuk menghitung akumulasi saldo berjalan
        const chronoSorted = [...skTxs].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

        let running = 0;
        const enriched = chronoSorted.map((tx) => {
            const realisasi = Number(tx.grand_total) || 0;
            running += realisasi;
            const sisa = paguAwal - running;
            const snack = Number(tx.qty_snack) || 0;
            const nasi = Number(tx.qty_nasi) || 0;
            const paket = snack + nasi;
            return {
                ...tx,
                realisasi,
                realisasiTotal: running,
                sisa,
                qty_snack: snack,
                qty_nasi: nasi,
                totalPaket: paket,
            };
        });

        // Filter Tanggal Tunggal & Pencarian
        let filtered = enriched;
        if (rekapDate) {
            filtered = filtered.filter(tx => tx.tanggal === rekapDate || tx.tanggal.startsWith(rekapDate));
        }
        if (rekapSearch.trim()) {
            const query = rekapSearch.toLowerCase();
            filtered = filtered.filter(tx => (tx.judul || '').toLowerCase().includes(query));
        }

        // Default sorting: YANG PALING ATAS ADALAH YANG TERBARU (descending)
        const sortedDisplay = [...filtered].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

        const totalRealisasi = filtered.reduce((sum, tx) => sum + tx.realisasi, 0);
        const totalSnack = filtered.reduce((sum, tx) => sum + tx.qty_snack, 0);
        const totalNasi = filtered.reduce((sum, tx) => sum + tx.qty_nasi, 0);
        const totalPaket = totalSnack + totalNasi;
        const sisaAkhir = paguAwal - running;

        return {
            paguAwal,
            txs: sortedDisplay,
            totalRealisasi,
            sisaAkhir,
            totalSnack,
            totalNasi,
            totalPaket,
        };
    }, [selectedRekapSubKegiatan, mmTransactions, rekapDate, rekapSearch]);

    // Export Excel / CSV Function menggunakan Blob (100% aman dan kompatibel di browser)
    const handleExportRekapExcel = () => {
        if (!selectedRekapSubKegiatan || rekapData.txs.length === 0) return;
        const skName = selectedRekapSubKegiatan.nama;
        const headers = ['No', 'Nama Sub Kegiatan', 'Pagu Awal Mamin', 'Realisasi', 'Sisa', 'Realisasi Total', 'Jumlah Paket', 'Nama Rapat', 'Tanggal'];
        // OWASP A03 Mitigation: Sanitasi sel CSV untuk mencegah CSV Formula Injection (DDE injection)
        const sanitizeCsvCell = (val: any) => {
            let str = String(val ?? '');
            if (/^[=+\-@\t\r]/.test(str)) {
                str = "'" + str; // Tambahkan single quote agar Microsoft Excel membacanya sebagai teks murni
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
            `"${tx.qty_snack} Snack, ${tx.qty_nasi} Nasi (Total: ${tx.totalPaket})"`,
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
        link.download = `Rekap_Konsumsi_${safeName}.csv`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 300);
    };

    return (
        <MainLayout title="Makan & Minum">
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
                            <Coffee className="text-emerald-500" size={20} /> Input Pengeluaran Konsumsi
                        </h3>
                        <form onSubmit={handleAddSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Sub Kegiatan</label>
                                    <select
                                        required
                                        value={formAdd.data.sub_kegiatan_id}
                                        onChange={e => formAdd.setData('sub_kegiatan_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                    >
                                        <option value="">-- Pilih Sub Kegiatan --</option>
                                        {subKegiatans.filter(sk => getSisaAnggaranMM(sk.id) > 0).map(sk => (
                                            <option key={sk.id} value={sk.id}>{sk.nama}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            required
                                            value={formAdd.data.tanggal}
                                            onChange={e => formAdd.setData('tanggal', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Rapat</label>
                                    <select
                                        required
                                        value={formAdd.data.jenis_rapat}
                                        onChange={e => formAdd.setData('jenis_rapat', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                    >
                                        <option value="biasa">Rapat Biasa</option>
                                        <option value="besar">Rapat Besar</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Judul Pengeluaran (Rapat/Kegiatan)</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={formAdd.data.judul}
                                            onChange={e => formAdd.setData('judul', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                            placeholder="Contoh: Rapat Evaluasi Kinerja"
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
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors cursor-pointer"
                                />
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/60 relative">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Rincian Konsumsi
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsPriceModalOpen(true)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-300"
                                        title="Ubah tarif standar acuan harga snack & nasi kotak"
                                    >
                                        <Pencil size={12} className="text-slate-400" />
                                        <span>Ubah Harga Acuan</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Qty Snack Box</label>
                                    <div className="relative">
                                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                                        <input
                                            type="number"
                                            min="0"
                                            value={formAdd.data.qty_snack}
                                            onChange={e => formAdd.setData('qty_snack', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                            placeholder={`Jumlah (${formatRupiah(SNACK_PRICE)} / box)`}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Qty Nasi Kotak</label>
                                    <div className="relative">
                                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                                        <input
                                            type="number"
                                            min="0"
                                            value={formAdd.data.qty_nasi}
                                            onChange={e => formAdd.setData('qty_nasi', e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                            placeholder={`Jumlah (${formatRupiah(NASI_PRICE)} / box)`}
                                        />
                                    </div>
                                </div>
                                </div>
                            </div>

                            {baseHarga > 0 && (
                                <div className={`p-5 rounded-xl border space-y-3 text-sm ${isOverBudget ? 'bg-red-50/50 border-red-200' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Base Harga (Snack + Nasi)</span>
                                        <span>{formatRupiah(baseHarga)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Pajak Daerah (10%)</span>
                                        <span>+ {formatRupiah(pajak)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 text-xs">
                                        <span>PPh 23 (0.5%) - Potongan</span>
                                        <span>- {formatRupiah(pph)}</span>
                                    </div>
                                    <div className={`pt-3 border-t flex justify-between font-bold text-lg ${isOverBudget ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-900'}`}>
                                        <span>Grand Total</span>
                                        <span>{formatRupiah(grandTotal)}</span>
                                    </div>
                                    {isOverBudget && (
                                        <div className="pt-2 text-red-600 font-medium text-xs flex justify-between">
                                            <span>Peringatan: Anggaran tidak mencukupi!</span>
                                            <span>Sisa saat ini: {formatRupiah(sisaAnggaranMM)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isOverBudget || formAdd.processing}
                                    className={`w-full sm:w-auto px-8 py-3 text-white font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isOverBudget
                                        ? 'bg-slate-400 cursor-not-allowed focus:ring-slate-400'
                                        : 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-900'
                                        }`}
                                >
                                    Simpan Transaksi
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* History Accordion */}
                <div className="bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-800">Riwayat Makan & Minum</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRekapModalOpen(true);
                                    setSelectedRekapSkId(null);
                                    setRekapDate('');
                                    setRekapSearch('');
                                    setRekapSkSearch('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
                                title="Buka Rekap Rinci per Sub Kegiatan"
                            >
                                <Table size={15} className="text-emerald-600" />
                                <span>Rekap</span>
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as any)}
                                className="pl-3 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white cursor-pointer"
                            >
                                <option value="terbaru">Terbaru</option>
                                <option value="terlama">Terlama</option>
                                <option value="terbesar">Pengeluaran Terbesar</option>
                                <option value="terkecil">Pengeluaran Terkecil</option>
                            </select>
                            <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full whitespace-nowrap">
                                {mmTransactions.length} Transaksi Total
                            </span>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar" style={{ maxHeight: '354px' }}>
                        {Object.keys(groupedTransactions).length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                Belum ada riwayat transaksi makan & minum.
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
                                        const totalA = txsA.reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);
                                        const totalB = txsB.reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);
                                        return totalB - totalA;
                                    } else if (sortOrder === 'terkecil') {
                                        const totalA = txsA.reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);
                                        const totalB = txsB.reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);
                                        return totalA - totalB;
                                    }
                                    return 0;
                                })
                                .map(([subKegiatanIdStr, txs]) => {
                                    const subKegiatanId = Number(subKegiatanIdStr);
                                    const subKegiatan = subKegiatans.find(sk => sk.id === subKegiatanId);
                                    const groupTotal = txs.reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);

                                    return (
                                        <div key={subKegiatanId} className="bg-white">
                                            <button
                                                onClick={() => setSelectedHistoryGroup(subKegiatanId)}
                                                className="w-full px-4 sm:px-6 py-3.5 sm:py-4 flex items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors focus:outline-none text-left cursor-pointer"
                                            >
                                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                                    <div className="p-1.5 rounded-full transition-transform bg-slate-100 text-slate-400 shrink-0 mt-0.5 sm:mt-0">
                                                        <ChevronRight size={16} />
                                                    </div>
                                                    <div className="min-w-0 flex-1 text-left">
                                                        <h4
                                                            className="font-semibold text-slate-800 text-xs sm:text-sm leading-snug break-words line-clamp-2 sm:line-clamp-none"
                                                            title={subKegiatan?.nama}
                                                        >
                                                            {subKegiatan?.nama || 'Sub Kegiatan Tidak Dikenal'}
                                                        </h4>
                                                        <p className="text-[11px] sm:text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                                                            <span>{txs.length} Transaksi</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 pl-2">
                                                    <span className="font-bold text-slate-900 text-xs sm:text-sm block whitespace-nowrap">
                                                        {formatRupiah(groupTotal)}
                                                    </span>
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
                                        <Filter size={16} className="text-emerald-500" /> Filter Bulan:
                                    </div>
                                    <select
                                        value={filterBulan}
                                        onChange={e => setFilterBulan(e.target.value)}
                                        className="rounded-lg border border-slate-300 pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-white cursor-pointer"
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
                                        <div key={tx.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md hover:border-emerald-200">
                                            <div>
                                                <div className="mb-2">
                                                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full inline-flex items-center gap-1 mb-2">
                                                        <Calendar size={12} /> {formatDate(tx.tanggal)} • {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <h5 className="font-bold text-slate-800 text-base mt-1.5">{tx.judul}</h5>
                                                </div>
                                                <div className="text-sm text-slate-600 flex flex-wrap items-center gap-5 mt-3 bg-slate-50 p-2 rounded-lg inline-flex">
                                                    <span className="flex items-center gap-1.5"><Package size={16} className="text-emerald-500" /> {tx.qty_snack} Snack Box</span>
                                                    <span className="w-px h-4 bg-slate-200 hidden sm:block"></span>
                                                    <span className="flex items-center gap-1.5"><Package size={16} className="text-emerald-500" /> {tx.qty_nasi} Nasi Kotak</span>
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
                                                            {tx.dokumentasi_files && tx.dokumentasi_files.length > 0 ? (
                                                                <>
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {(expandedDocs[tx.id] ? tx.dokumentasi_files : tx.dokumentasi_files.slice(0, 5)).map((file, idx) => (
                                                                            <button key={idx} onClick={() => openViewer(`/storage/${file}`)} className="text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                                                                                <FileText size={14} /> Foto {idx + 1}
                                                                            </button>
                                                                        ))}
                                                                        {tx.dokumentasi_files.length > 5 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleExpandDocs(tx.id)}
                                                                                className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                                                                            >
                                                                                {expandedDocs[tx.id] ? (
                                                                                    <>Tutup <ChevronUp size={13} /></>
                                                                                ) : (
                                                                                    <>+{tx.dokumentasi_files.length - 5} Lainnya <ChevronDown size={13} /></>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs font-medium bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                                                    <FileText size={14} /> Tdk Ada Dokumentasi
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full md:w-auto mt-2 md:mt-0">
                                                <div className="text-left md:text-right bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-lg">
                                                    <div className="text-xs text-slate-500 mb-1">Base: {formatRupiah(tx.base_harga)} | Pajak: {formatRupiah(tx.pajak)}</div>
                                                    <div className="text-xs text-rose-500 mb-1 font-medium">PPh 23: -{formatRupiah(tx.pph)}</div>
                                                    <div className="font-bold text-emerald-600 text-lg">{formatRupiah(tx.grand_total)}</div>
                                                </div>
                                                {!isViewer && (
                                                    <div className="flex items-center gap-2 md:pl-5 md:border-l border-slate-200 justify-end">
                                                        <button
                                                            onClick={() => handleOpenEdit(tx)}
                                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                                            title="Edit Transaksi"
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

                {/* Edit Modal (Sisa form edit) */}
                {isEditModalOpen && createPortal(
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 text-lg">Edit Pengeluaran Makan & Minum</h3>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <form id="edit-mm-form" onSubmit={handleEditSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Sub Kegiatan</label>
                                            <select
                                                required
                                                value={formEdit.data.sub_kegiatan_id}
                                                onChange={e => formEdit.setData('sub_kegiatan_id', e.target.value)}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                            >
                                                <option value="">-- Pilih Sub Kegiatan --</option>
                                                {subKegiatans.filter(sk => getSisaAnggaranMMEdit(sk.id, formEdit.data.id) > 0 || sk.id === Number(formEdit.data.sub_kegiatan_id)).map(sk => (

                                                    <option key={sk.id} value={sk.id}>{sk.nama}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="date"
                                                    required
                                                    value={formEdit.data.tanggal}
                                                    onChange={e => formEdit.setData('tanggal', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Rapat</label>
                                            <select
                                                required
                                                value={formEdit.data.jenis_rapat}
                                                onChange={e => formEdit.setData('jenis_rapat', e.target.value)}
                                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                            >
                                                <option value="biasa">Rapat Biasa</option>
                                                <option value="besar">Rapat Besar</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Judul Pengeluaran (Rapat/Kegiatan)</label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={formEdit.data.judul}
                                                    onChange={e => formEdit.setData('judul', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                                    placeholder="Contoh: Rapat Evaluasi Kinerja"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200/60">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Qty Snack Box</label>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formEdit.data.qty_snack}
                                                    onChange={e => formEdit.setData('qty_snack', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Qty Nasi Kotak</label>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formEdit.data.qty_nasi}
                                                    onChange={e => formEdit.setData('qty_nasi', e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload / Ganti Undangan & Dokumentasi */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 items-start">
                                        <div className="flex flex-col">
                                            <label className="block text-sm font-medium text-slate-700 mb-2 h-10 flex items-center">
                                                File Undangan (PDF)
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={e => formEdit.setData('undangan_file', e.target.files ? e.target.files[0] : null)}
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-slate-300 rounded-xl cursor-pointer bg-white"
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
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-slate-300 rounded-xl cursor-pointer bg-white"
                                            />
                                            <p className="text-[11px] text-slate-400 mt-1 mb-2">Dapat memilih lebih dari 1 file foto gambar (PNG, JPG, JPEG).</p>

                                            {editingTx?.dokumentasi_files && editingTx.dokumentasi_files.length > 0 ? (
                                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 mt-2">
                                                    {editingTx.dokumentasi_files.map((file, idx) => (
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
                                                                    txId: editingTx.id,
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
                                            )}
                                        </div>
                                    </div>

                                    {editBaseHarga > 0 && (
                                        <div className={`p-5 rounded-xl border space-y-3 text-sm ${isEditOverBudget ? 'bg-red-50/50 border-red-200' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Base Harga (Snack + Nasi)</span>
                                                <span>{formatRupiah(editBaseHarga)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600">
                                                <span>Pajak Daerah (10%)</span>
                                                <span>+ {formatRupiah(editPajak)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-500 text-xs">
                                                <span>PPh 23 (0.5%) - Potongan</span>
                                                <span>- {formatRupiah(editPph)}</span>
                                            </div>
                                            <div className={`pt-3 border-t flex justify-between font-bold text-lg ${isEditOverBudget ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-900'}`}>
                                                <span>Grand Total</span>
                                                <span>{formatRupiah(editGrandTotal)}</span>
                                            </div>
                                            {isEditOverBudget && (
                                                <div className="pt-2 text-red-600 font-medium text-xs flex justify-between">
                                                    <span>Peringatan: Anggaran tidak mencukupi!</span>
                                                    <span>Sisa saat ini: {formatRupiah(editSisaAnggaranMM)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                        form="edit-mm-form"
                                        disabled={isEditOverBudget || formEdit.processing}
                                        className={`px-6 py-2.5 text-white font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${isEditOverBudget
                                            ? 'bg-slate-400 cursor-not-allowed focus:ring-slate-400'
                                            : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-600'
                                            }`}
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Modal Hapus */}
                {isDeleteModalOpen && deleteItem && createPortal(
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-xl mb-2">Hapus Transaksi?</h3>
                                <p className="text-slate-500 text-sm mb-1">
                                    Anda yakin ingin menghapus <span className="font-bold text-slate-700">"{deleteItem.judul}"</span>?
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

                {/* Modal Pengaturan Harga Satuan Konsumsi */}
                {isPriceModalOpen && createPortal(
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
                            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                        <Settings size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">Pengaturan Harga Satuan Konsumsi</h3>
                                        <p className="text-[11px] text-slate-500">Sesuaikan harga acuan default snack box dan nasi kotak</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsPriceModalOpen(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    formPrice.post(route('settings.pricing.update'), {
                                        onSuccess: () => setIsPriceModalOpen(false),
                                    });
                                }}
                                className="p-5 space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Harga Satuan Snack Box (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={formPrice.data.snack_price}
                                        onChange={(e) => formPrice.setData('snack_price', Number(e.target.value))}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                                        placeholder="Default 15400"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Acuan standar awal: Rp 15.400 / kotak</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Harga Satuan Nasi Kotak (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={formPrice.data.nasi_price}
                                        onChange={(e) => formPrice.setData('nasi_price', Number(e.target.value))}
                                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-semibold"
                                        placeholder="Default 46300"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Acuan standar awal: Rp 46.300 / kotak</p>
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsPriceModalOpen(false)}
                                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formPrice.processing}
                                        className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                                    >
                                        <Check size={14} /> Simpan Pengaturan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Modal Rekap per Sub Kegiatan */}
                {isRekapModalOpen && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[96vw] xl:max-w-[1550px] h-[92vh] max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 animate-fade-in-up">

                            {/* CASE 1: TAMPILAN DAFTAR SUB KEGIATAN (LIST ATAS KE BAWAH) */}
                            {selectedRekapSkId === null ? (
                                <>
                                    {/* Modal Header */}
                                    <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                                                <Table size={22} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                                                    Rekap Keseluruhan per Sub Kegiatan
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Pilih Sub Kegiatan di bawah ini untuk melihat lembar kerja rincian kegiatan
                                                </p>
                                            </div>
                                        </div>

                                        {/* Filter Toolbar: Search, Sort Dropdown & Close */}
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={rekapSkSearch}
                                                    onChange={e => setRekapSkSearch(e.target.value)}
                                                    placeholder="Cari Sub Kegiatan..."
                                                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white w-40 sm:w-52 focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            </div>

                                            <select
                                                value={rekapSkSortOrder}
                                                onChange={e => setRekapSkSortOrder(e.target.value as any)}
                                                className="pl-3 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white cursor-pointer font-semibold text-slate-700"
                                                title="Urutkan Sub Kegiatan"
                                            >
                                                <option value="terbaru">Terbaru</option>
                                                <option value="terlama">Terlama</option>
                                                <option value="terbesar">Pengeluaran Terbesar</option>
                                                <option value="terkecil">Pengeluaran Terkecil</option>
                                            </select>

                                            <span className="text-xs font-semibold px-2.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg whitespace-nowrap hidden sm:inline">
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

                                    {/* Sub Kegiatan List: Atas ke Bawah */}
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
                                                    className="bg-white rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                                                >
                                                    {/* Kiri: Nomor, Nama Sub Kegiatan, Kode & Info Transaksi */}
                                                    <div className="flex items-start gap-3 min-w-0 md:w-5/12">
                                                        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-emerald-700 transition-colors break-words line-clamp-2 sm:line-clamp-none" title={sk.nama}>
                                                                    {sk.nama}
                                                                </h4>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                                                    {sk.txsCount} Transaksi
                                                                </span>
                                                            </div>
                                                            {sk.latestDate > 0 && (
                                                                <span className="text-[11px] text-slate-500 mt-1 block">
                                                                    Transaksi terakhir: <span className="font-semibold text-slate-700">{new Date(sk.latestDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Tengah: Pagu, Realisasi, Sisa & Bar Penyerapan */}
                                                    <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-4 border-t md:border-t-0 md:border-l md:border-r border-slate-100 pt-3 md:pt-0 md:px-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Pagu Mamin</span>
                                                            <span className="text-xs sm:text-sm font-bold text-slate-800">{formatRupiah(sk.pagu)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Realisasi</span>
                                                            <span className="text-xs sm:text-sm font-bold text-emerald-600">{formatRupiah(sk.totalSpending)}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] uppercase font-bold text-slate-400">Sisa Anggaran</span>
                                                            <span className="text-xs sm:text-sm font-bold text-blue-600">{formatRupiah(sk.sisa)}</span>
                                                        </div>
                                                        <div className="col-span-3 mt-1">
                                                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                                                <span>Penyerapan</span>
                                                                <span className="font-bold text-slate-700">{sk.percent.toFixed(1)}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(sk.percent, 100)}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Kanan: Tombol Buka Rekap */}
                                                    <div className="shrink-0 flex items-center justify-end md:pl-2">
                                                        <button
                                                            type="button"
                                                            className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition-all flex items-center gap-1.5 border border-emerald-200 group-hover:border-emerald-600 shadow-xs cursor-pointer"
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
                                    {/* CASE 2: TAMPILAN LEMBAR KERJA REKAP */}
                                    {/* Modal Header */}
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
                                                <span className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-block mt-0.5">
                                                    Rekap Transaksi Konsumsi
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                                            {/* Quick Dropdown Selector */}
                                            <select
                                                value={selectedRekapSkId}
                                                onChange={e => {
                                                    setSelectedRekapSkId(Number(e.target.value));
                                                    setRekapDate('');
                                                    setRekapSearch('');
                                                }}
                                                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 w-auto min-w-[150px] max-w-[260px] truncate focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer shadow-xs"
                                            >
                                                {subKegiatans.map(sk => (
                                                    <option key={sk.id} value={sk.id}>{sk.nama}</option>
                                                ))}
                                            </select>

                                            {/* Button Export CSV / Excel */}
                                            <button
                                                type="button"
                                                onClick={handleExportRekapExcel}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
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

                                    {/* KPI Summary Strip */}
                                    <div className="p-3 sm:p-4 bg-white border-b border-slate-200 shrink-0">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-50 p-2.5 sm:p-3.5 rounded-xl border border-slate-200/80">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Pagu Awal Mamin</span>
                                                <span className="text-xs sm:text-base font-extrabold text-slate-800">{formatRupiah(rekapData.paguAwal)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Total Realisasi</span>
                                                <span className="text-xs sm:text-base font-extrabold text-emerald-600">{formatRupiah(rekapData.totalRealisasi)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Sisa Anggaran</span>
                                                <span className="text-xs sm:text-base font-extrabold text-blue-600">{formatRupiah(rekapData.sisaAkhir)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Total Paket Konsumsi</span>
                                                <span className="text-xs sm:text-base font-extrabold text-slate-700">{rekapData.totalSnack} Snack, {rekapData.totalNasi} Nasi</span>
                                            </div>
                                        </div>

                                        {/* Filter Bar: Single Date Filter & Search */}
                                        <div className="flex flex-wrap items-center justify-between gap-2.5 mt-3 pt-3 border-t border-slate-100 text-xs">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-bold text-slate-600 flex items-center gap-1">
                                                    <Filter size={13} className="text-emerald-600" /> Filter Tanggal:
                                                </span>
                                                <input
                                                    type="date"
                                                    value={rekapDate}
                                                    onChange={e => setRekapDate(e.target.value)}
                                                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
                                                    title="Pilih tanggal spesifik"
                                                />
                                                {(rekapDate || rekapSearch) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setRekapDate(''); setRekapSearch(''); }}
                                                        className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <RotateCcw size={11} /> Reset Filter
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={rekapSearch}
                                                        onChange={e => setRekapSearch(e.target.value)}
                                                        placeholder="Cari nama rapat..."
                                                        className="pl-7 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white w-44 sm:w-56 focus:ring-emerald-500 focus:border-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Excel Table with Fixed Sticky Header & Horizontal Scroll Support */}
                                    <div className="flex-1 overflow-auto p-2 sm:p-4 min-h-0 bg-slate-50/40">
                                        {/* Mobile Swipe Hint */}
                                        <div className="sm:hidden mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5 shadow-xs">
                                            <ArrowLeftRight size={13} className="text-amber-600 shrink-0" />
                                            <span>Geser tabel ke samping untuk melihat kolom rincian lengkap</span>
                                        </div>

                                        <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs bg-white">
                                            <div className="overflow-x-auto w-full custom-scrollbar">
                                                <table className="min-w-[1100px] w-full text-xs text-left border-collapse">
                                                    <thead className="sticky top-0 z-20 bg-slate-100 shadow-xs border-b-2 border-slate-300 text-slate-700">
                                                        <tr>
                                                            <th className="border border-slate-300 px-3 py-2.5 text-center align-middle font-bold w-12 bg-slate-100">No</th>
                                                            <th className="border border-slate-300 px-3 py-2.5 text-center align-middle font-bold min-w-[180px] max-w-[240px] bg-slate-100">Nama Sub Kegiatan</th>
                                                            <th className="border border-slate-300 px-3 py-2.5 text-center align-middle font-bold w-36 bg-slate-100 whitespace-nowrap">Pagu Awal Mamin</th>
                                                            <th className="border border-slate-300 px-3 py-2.5 text-center align-middle font-bold w-32 bg-slate-100 whitespace-nowrap">Realisasi</th>
                                                            <th className="border border-slate-300 px-3 py-2.5 text-center align-middle font-bold w-36 bg-slate-100 whitespace-nowrap">Sisa</th>
                                                            <th className="border border-slate-300 px-3 py-2.5 text-center align-middle font-bold w-36 bg-slate-100 whitespace-nowrap">Realisasi Total</th>
                                                            <th className="border border-slate-300 px-3 py-2.5 text-center align-middle font-bold w-40 bg-slate-100 whitespace-nowrap">Jumlah Paket</th>
                                                            <th className="border border-slate-300 px-3 py-2.5 text-center align-middle font-bold min-w-[180px] bg-slate-100">Nama Rapat</th>
                                                            <th className="border border-slate-300 px-3 py-2.5 text-center align-middle font-bold w-32 bg-slate-100 whitespace-nowrap">Tanggal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200">
                                                        {rekapData.txs.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={9} className="p-10 text-center text-slate-400 font-medium">
                                                                    Tidak ada transaksi konsumsi pada sub kegiatan atau filter ini.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            rekapData.txs.map((tx, idx) => (
                                                                <tr key={tx.id} className="hover:bg-emerald-50/50 transition-colors odd:bg-white even:bg-slate-50/70">
                                                                    <td className="border border-slate-200 px-3 py-2.5 text-center align-middle text-slate-500 font-medium">{idx + 1}</td>
                                                                    {idx === 0 && (
                                                                        <td
                                                                            rowSpan={rekapData.txs.length}
                                                                            className="border border-slate-200 px-3 py-2.5 font-semibold text-slate-800 break-words align-middle text-center bg-white"
                                                                        >
                                                                            {selectedRekapSubKegiatan?.nama}
                                                                        </td>
                                                                    )}
                                                                    <td className="border border-slate-200 px-3 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">{formatRupiah(rekapData.paguAwal)}</td>
                                                                    <td className="border border-slate-200 px-3 py-2.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">{formatRupiah(tx.realisasi)}</td>
                                                                    <td className="border border-slate-200 px-3 py-2.5 text-right font-mono font-bold text-blue-700 whitespace-nowrap">{formatRupiah(tx.sisa)}</td>
                                                                    <td className="border border-slate-200 px-3 py-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">{formatRupiah(tx.realisasiTotal)}</td>
                                                                    <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-700 whitespace-nowrap">
                                                                        <span className="font-semibold">{tx.qty_snack}</span> Snack, <span className="font-semibold">{tx.qty_nasi}</span> Nasi
                                                                        <span className="text-[10px] text-slate-400 block font-normal">(Total: {tx.totalPaket})</span>
                                                                    </td>
                                                                    <td className="border border-slate-200 px-3 py-2.5 text-slate-800 font-medium break-words">{tx.judul || '-'}</td>
                                                                    <td className="border border-slate-200 px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">{formatDate(tx.tanggal)}</td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                    <tfoot className="sticky bottom-0 z-20 bg-slate-200 border-t-2 border-slate-400 font-bold text-slate-800 shadow-md">
                                                        <tr>
                                                            <td colSpan={2} className="border border-slate-300 px-3 py-2.5 text-center align-middle font-extrabold uppercase bg-slate-200">
                                                                Total Rekapitulasi ({rekapData.txs.length} Kegiatan)
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-right font-mono bg-slate-200 whitespace-nowrap">
                                                                {formatRupiah(rekapData.paguAwal)}
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-right font-mono text-emerald-800 bg-slate-200 whitespace-nowrap">
                                                                {formatRupiah(rekapData.totalRealisasi)}
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-right font-mono text-blue-800 bg-slate-200 whitespace-nowrap">
                                                                {formatRupiah(rekapData.sisaAkhir)}
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-right font-mono text-emerald-800 bg-slate-200 whitespace-nowrap">
                                                                {formatRupiah(rekapData.totalRealisasi)}
                                                            </td>
                                                            <td className="border border-slate-300 px-3 py-2.5 text-center bg-slate-200 whitespace-nowrap">
                                                                {rekapData.totalSnack} Snack, {rekapData.totalNasi} Nasi ({rekapData.totalPaket} Paket)
                                                            </td>
                                                            <td colSpan={2} className="border border-slate-300 px-3 py-2.5 text-center text-slate-500 bg-slate-200 text-[11px]">
                                                                -
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

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
