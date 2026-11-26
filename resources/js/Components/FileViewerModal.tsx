import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Download, FileText, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string | null;
}

export default function FileViewerModal({ isOpen, onClose, fileUrl }: FileViewerModalProps) {
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            setLoadError(false);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, fileUrl]);

    if (!isOpen || !fileUrl) return null;

    const isPdf = fileUrl.toLowerCase().split('?')[0].endsWith('.pdf');
    const fileName = fileUrl.split('/').pop() || 'Dokumen';

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col h-[88vh] sm:h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <FileText size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">Lihat Berkas</h3>
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-md">{fileName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                            title="Buka Dokumen di Tab Baru"
                        >
                            <ExternalLink size={15} />
                            <span className="hidden sm:inline">Buka Tab Baru</span>
                        </a>
                        <a 
                            href={fileUrl} 
                            download 
                            className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="Download Berkas"
                        >
                            <Download size={18} />
                        </a>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Tutup"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 bg-slate-100 overflow-hidden relative flex items-center justify-center">
                    {isPdf ? (
                        loadError ? (
                            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md mx-4">
                                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                                    <AlertCircle size={26} />
                                </div>
                                <h4 className="font-bold text-slate-800 mb-1">Pratinjau PDF Dibatasi Browser</h4>
                                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                                    Browser memblokir pratinjau PDF langsung di dalam frame. Anda dapat membuka atau mengunduh dokumen secara langsung:
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-sm inline-flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <ExternalLink size={14} /> Buka di Tab Baru
                                    </a>
                                    <a
                                        href={fileUrl}
                                        download
                                        className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl inline-flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <Download size={14} /> Download File
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <object 
                                data={fileUrl} 
                                type="application/pdf"
                                className="w-full h-full border-0"
                                onError={() => setLoadError(true)}
                            >
                                <iframe 
                                    src={fileUrl} 
                                    className="w-full h-full border-0"
                                    title="PDF Viewer"
                                    onError={() => setLoadError(true)}
                                >
                                    <div className="p-6 text-center text-slate-500">
                                        Browser tidak mendukung tampilan PDF bawaan. Silakan{' '}
                                        <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">
                                            klik di sini untuk melihat
                                        </a>.
                                    </div>
                                </iframe>
                            </object>
                        )
                    ) : (
                        <img 
                            src={fileUrl} 
                            alt="Dokumen" 
                            className="max-w-full max-h-full object-contain p-2"
                        />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
