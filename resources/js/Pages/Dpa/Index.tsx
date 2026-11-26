import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { UploadCloud, FileText, Trash2, Loader2, X, Eye, Search, CheckSquare, Square, Pencil, Check } from 'lucide-react';

interface DpaFile {
    id: number;
    name: string;
    file_path: string;
    size: number;
    jenis: 'murni' | 'perubahan';
    tahun: number;
    uploaded_at: string;
}

interface Props {
    selectedYear: number;
    dpaFiles: DpaFile[];
}

export default function DpaIndex({ selectedYear, dpaFiles }: Props) {
    const { errors, auth } = usePage().props as any;
    const isViewer = auth.user.role === 'viewer';

    const [isDragging, setIsDragging] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number; error?: string }[]>([]);
    const [previewFile, setPreviewFile] = useState<DpaFile | null>(null);
    const [uploadJenis, setUploadJenis] = useState<'murni' | 'perubahan'>('murni');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const filteredFiles = dpaFiles.filter(f => {
        const matchName = f.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchMonth = filterMonth ? new Date(f.uploaded_at).getMonth() + 1 === parseInt(filterMonth) : true;
        return matchName && matchMonth;
    });

    const murniFiles = filteredFiles.filter(f => f.jenis === 'murni');
    const perubahanFiles = filteredFiles.filter(f => f.jenis === 'perubahan');

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = (files: File[]) => {
        const pdfFiles = files.filter(f => f.type === 'application/pdf');
        if (pdfFiles.length !== files.length) {
            alert('Beberapa file diabaikan karena bukan file PDF.');
        }
        if (pdfFiles.length === 0) return;

        // Visual feedback
        setUploadingFiles(pdfFiles.map(f => ({ name: f.name, progress: 0 })));

        // Inertia.js tidak mendukung progress otomatis array file via router.post secara individual.
        // Kita post semua, lalu update progress sekaligus.
        router.post(route('dpa.store'), {
            files: pdfFiles,
            jenis: uploadJenis,
            tahun: selectedYear
        }, {
            forceFormData: true,
            onProgress: (e) => {
                const progress = e?.percentage || 0;
                setUploadingFiles(pdfFiles.map(f => ({ name: f.name, progress })));
            },
            onSuccess: () => {
                setUploadingFiles([]);
            },
            onError: (errors) => {
                alert('Gagal mengunggah beberapa file. Pastikan ukuran di bawah 10MB.');
                setUploadingFiles([]);
            }
        });
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteItem, setDeleteItem] = useState<{ id: number, name: string } | null>(null);

    const handleOpenDelete = (file: DpaFile) => {
        setDeleteItem({ id: file.id, name: file.name });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteItem) {
            router.delete(route('dpa.destroy', deleteItem.id), {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setDeleteItem(null);
                }
            });
        }
    };

    const toggleSelectFile = (id: number) => {
        setSelectedFileIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleConfirmBulkDelete = () => {
        if (selectedFileIds.length === 0) return;
        router.delete(route('dpa.destroy-bulk'), {
            data: { ids: selectedFileIds },
            onSuccess: () => {
                setIsBulkDeleteModalOpen(false);
                setSelectedFileIds([]);
            }
        });
    };

    return (
        <MainLayout title="Dokumen Pelaksanaan Anggaran">
            <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <FileText className="text-blue-500" size={24} />
                            Dokumen Pelaksanaan Anggaran (DPA) {selectedYear}
                        </h3>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-6">
                        <button 
                            onClick={() => setUploadJenis('murni')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${uploadJenis === 'murni' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            DPA Murni
                        </button>
                        <button 
                            onClick={() => setUploadJenis('perubahan')}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${uploadJenis === 'perubahan' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            DPA Perubahan
                        </button>
                    </div>

                    {/* Drag & Drop Area */}
                    {!isViewer && (
                        <div 
                            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer relative ${
                                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                            }`}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                        >
                            <input 
                                type="file" 
                                multiple 
                                accept=".pdf,application/pdf" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileInput}
                                title="Pilih file PDF DPA"
                            />
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                <UploadCloud size={32} />
                            </div>
                            <h4 className="text-slate-800 font-bold mb-2">Tarik & Lepas File DPA di sini</h4>
                            <p className="text-slate-500 text-sm mb-4">Atau klik untuk memilih file PDF</p>
                            <div className="px-4 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                                Maksimal 10 MB / File
                            </div>
                        </div>
                    )}

                    {/* Uploading List */}
                    {uploadingFiles.length > 0 && (
                        <div className="mt-8 space-y-3">
                            <h4 className="font-semibold text-slate-700 text-sm">Sedang Mengunggah...</h4>
                            {uploadingFiles.map((uf, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <FileText className="text-blue-400" size={20} />
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700 truncate">{uf.name}</span>
                                            <span className="text-slate-500">{uf.error ? 'Gagal' : `${Math.round(uf.progress)}%`}</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-300 ${uf.error ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${uf.progress}%` }}
                                            />
                                        </div>
                                        {uf.error && <p className="text-red-500 text-xs mt-1">{uf.error}</p>}
                                    </div>
                                    {!uf.error && <Loader2 className="animate-spin text-blue-500" size={18} />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Uploaded Files List */}
                <div className="space-y-6">
                    {/* Filters & Action Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full max-w-xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cari nama dokumen DPA..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                />
                            </div>
                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="w-full sm:w-auto pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm cursor-pointer"
                            >
                                <option value="">Semua Bulan</option>
                                <option value="1">Januari</option>
                                <option value="2">Februari</option>
                                <option value="3">Maret</option>
                                <option value="4">April</option>
                                <option value="5">Mei</option>
                                <option value="6">Juni</option>
                                <option value="7">Juli</option>
                                <option value="8">Agustus</option>
                                <option value="9">September</option>
                                <option value="10">Oktober</option>
                                <option value="11">November</option>
                                <option value="12">Desember</option>
                            </select>
                        </div>

                        {!isViewer && (
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                {isEditMode ? (
                                    <div className="flex items-center gap-2">
                                        {selectedFileIds.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setIsBulkDeleteModalOpen(true)}
                                                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer animate-fade-in"
                                            >
                                                <Trash2 size={15} />
                                                <span>Hapus ({selectedFileIds.length})</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditMode(false);
                                                setSelectedFileIds([]);
                                            }}
                                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                            title="Selesai Mengedit"
                                        >
                                            <Check size={15} />
                                            <span>Selesai Edit</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditMode(true)}
                                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                        title="Mode Edit Dokumen DPA"
                                    >
                                        <Pencil size={14} className="text-blue-600" />
                                        <span>Edit Dokumen</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* DPA Murni Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">DPA Murni {selectedYear}</h3>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                                {murniFiles.length} File
                            </span>
                        </div>
                        <div className="p-5 max-h-[380px] overflow-y-auto custom-scrollbar">
                            {murniFiles.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    Belum ada dokumen DPA Murni yang diunggah atau sesuai pencarian.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {murniFiles.map((file) => {
                                        const isSelected = selectedFileIds.includes(file.id);
                                        return (
                                        <div key={file.id} className={`group relative bg-white border rounded-xl p-4 transition-all flex flex-col ${isSelected ? 'border-red-400 ring-2 ring-red-200 shadow-md' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                {!isViewer && isEditMode && (
                                                    <div className="flex items-center z-20 animate-fade-in">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelectFile(file.id); }}
                                                            className={`p-1.5 rounded-lg transition-all ${isSelected ? 'text-red-600 bg-red-50 ring-1 ring-red-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                                            title={isSelected ? "Batal pilih" : "Pilih dokumen untuk dihapus"}
                                                        >
                                                            {isSelected ? <CheckSquare size={19} className="text-red-600" /> : <Square size={19} />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-sm mb-2 text-justify break-words relative z-10 pointer-events-none">
                                                {file.name}
                                            </h4>
                                            <div className="flex justify-between items-center text-xs text-slate-500 mt-auto pt-4 border-t border-slate-50 relative z-10 pointer-events-none">
                                                <span>{formatSize(file.size)}</span>
                                                <span>{new Date(file.uploaded_at).toLocaleDateString('id-ID')}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.preventDefault(); setPreviewFile(file); }}
                                                className="absolute inset-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-left w-full h-full"
                                                aria-label={`Lihat file ${file.name}`}
                                            >
                                                <span className="sr-only">Lihat</span>
                                            </button>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DPA Perubahan Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-emerald-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">DPA Perubahan {selectedYear}</h3>
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                                {perubahanFiles.length} File
                            </span>
                        </div>
                        <div className="p-5 max-h-[380px] overflow-y-auto custom-scrollbar">
                            {perubahanFiles.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    Belum ada dokumen DPA Perubahan yang diunggah atau sesuai pencarian.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {perubahanFiles.map((file) => {
                                        const isSelected = selectedFileIds.includes(file.id);
                                        return (
                                        <div key={file.id} className={`group relative bg-white border rounded-xl p-4 transition-all flex flex-col ${isSelected ? 'border-red-400 ring-2 ring-red-200 shadow-md' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'}`}>
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                {!isViewer && isEditMode && (
                                                    <div className="flex items-center z-20 animate-fade-in">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelectFile(file.id); }}
                                                            className={`p-1.5 rounded-lg transition-all ${isSelected ? 'text-red-600 bg-red-50 ring-1 ring-red-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                                            title={isSelected ? "Batal pilih" : "Pilih dokumen untuk dihapus"}
                                                        >
                                                            {isSelected ? <CheckSquare size={19} className="text-red-600" /> : <Square size={19} />}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-sm mb-2 text-justify break-words relative z-10 pointer-events-none">
                                                {file.name}
                                            </h4>
                                            <div className="flex justify-between items-center text-xs text-slate-500 mt-auto pt-4 border-t border-slate-50 relative z-10 pointer-events-none">
                                                <span>{formatSize(file.size)}</span>
                                                <span>{new Date(file.uploaded_at).toLocaleDateString('id-ID')}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.preventDefault(); setPreviewFile(file); }}
                                                className="absolute inset-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left w-full h-full"
                                                aria-label={`Lihat file ${file.name}`}
                                            >
                                                <span className="sr-only">Lihat</span>
                                            </button>
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PDF Preview Modal */}
                {previewFile && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 truncate pr-4">
                                    <FileText className="text-blue-500 shrink-0" size={20} />
                                    <span className="truncate">{previewFile.name}</span>
                                </h3>
                                <div className="flex items-center gap-2 shrink-0">
                                    <a 
                                        href={previewFile.file_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2"
                                    >
                                        <Eye size={16} /> Buka Tab Baru
                                    </a>
                                    <button 
                                        onClick={() => setPreviewFile(null)}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-100 p-2 relative">
                                <iframe
                                    src={previewFile.file_path}
                                    className="w-full h-full rounded-xl border border-slate-200 relative z-10 bg-white"
                                    title={previewFile.name}
                                ></iframe>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Bulk Delete Confirmation Modal */}
                {isBulkDeleteModalOpen && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-xl mb-2">Hapus {selectedFileIds.length} Dokumen DPA?</h3>
                                <p className="text-slate-500 text-sm mb-1">
                                    Anda yakin ingin menghapus <span className="font-bold text-slate-700">{selectedFileIds.length} dokumen DPA</span> yang telah dicentang?
                                </p>
                                <p className="text-slate-400 text-xs">
                                    Semua dokumen terpilih akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                            <div className="p-6 pt-0 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkDeleteModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors focus:outline-none"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmBulkDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                                >
                                    Hapus Semua Terpilih
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && deleteItem && createPortal(
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800 text-xl mb-2">Hapus DPA?</h3>
                                <p className="text-slate-500 text-sm mb-1">
                                    Anda yakin ingin menghapus dokumen <span className="font-bold text-slate-700">"{deleteItem.name}"</span>?
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
