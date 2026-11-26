import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { formatRupiah } from '@/utils/formatters';
import { Eye, ChevronUp, ChevronDown } from 'lucide-react';

const NumberStepper = ({
    value,
    onChange,
    color = 'blue'
}: {
    value: string;
    onChange: (val: string) => void;
    color?: 'blue' | 'amber';
}) => {
    const handleIncrement = () => {
        const current = parseInt(value, 10) || 0;
        onChange(String(current + 1));
    };

    const handleDecrement = () => {
        const current = parseInt(value, 10) || 0;
        onChange(String(Math.max(0, current - 1)));
    };

    const ringColor = color === 'amber' 
        ? 'focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20' 
        : 'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20';

    return (
        <div className={`relative flex items-center w-16 h-[28px] rounded-md border border-slate-300 bg-white shadow-2xs ${ringColor} overflow-hidden`}>
            <input
                type="number"
                min="0"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-full border-0 p-0 pl-2 text-xs font-bold text-slate-800 bg-transparent focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
            />
            <div className="absolute right-0 top-0 bottom-0 w-6 flex flex-col border-l border-slate-200 divide-y divide-slate-200 bg-slate-50">
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleIncrement}
                    className="flex-1 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors cursor-pointer"
                    title="Tambah 1"
                >
                    <ChevronUp size={11} strokeWidth={2.5} />
                </button>
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={handleDecrement}
                    className="flex-1 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors cursor-pointer"
                    title="Kurang 1"
                >
                    <ChevronDown size={11} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

const SubKegiatanRow = ({ sk, mmTransactions, selectedYear, index }: any) => {
    const [targetBiasaInput, setTargetBiasaInput] = useState(sk.target_rapat != null ? String(sk.target_rapat) : '0');
    const [targetBesarInput, setTargetBesarInput] = useState(sk.target_rapat_besar != null ? String(sk.target_rapat_besar) : '0');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setTargetBiasaInput(sk.target_rapat != null ? String(sk.target_rapat) : '0');
        setTargetBesarInput(sk.target_rapat_besar != null ? String(sk.target_rapat_besar) : '0');
    }, [sk.target_rapat, sk.target_rapat_besar]);

    const isBiasaChanged = targetBiasaInput !== (sk.target_rapat != null ? String(sk.target_rapat) : '0');
    const isBesarChanged = targetBesarInput !== (sk.target_rapat_besar != null ? String(sk.target_rapat_besar) : '0');
    const isChanged = isBiasaChanged || isBesarChanged;

    const handleSave = () => {
        setIsSaving(true);
        router.patch(route('monitoring.target.update', sk.id), {
            target_rapat: parseInt(targetBiasaInput) || 0,
            target_rapat_besar: parseInt(targetBesarInput) || 0
        }, {
            preserveScroll: true,
            onFinish: () => setIsSaving(false)
        });
    };

    const mmTxs = mmTransactions.filter((tx: any) => String(tx.sub_kegiatan_id) === String(sk.id) && Number(tx.tahun) === Number(selectedYear));
    
    const rapatBiasaTelahDilakukan = mmTxs.filter((tx: any) => !tx.jenis_rapat || tx.jenis_rapat === 'biasa').length;
    const rapatBesarTelahDilakukan = mmTxs.filter((tx: any) => tx.jenis_rapat === 'besar').length;

    const rencanaRapatBiasa = sk.target_rapat || 0;
    const rencanaRapatBesar = sk.target_rapat_besar || 0;

    const sisaRapatBiasa = Math.max(0, rencanaRapatBiasa - rapatBiasaTelahDilakukan);
    const sisaRapatBesar = Math.max(0, rencanaRapatBesar - rapatBesarTelahDilakukan);
    
    const paguMM = Number(sk.anggaran_perubahan_mm) || Number(sk.anggaran_murni_mm) || 0;
    const realisasiMM = mmTxs.reduce((sum: number, tx: any) => sum + Number(tx.grand_total), 0);
    const sisaNominalMM = Math.max(0, paguMM - realisasiMM);

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-4 whitespace-nowrap text-center w-16 align-top">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm shadow-sm border border-blue-200">
                    {index + 1}
                </div>
            </td>
            <td className="px-4 py-4 max-w-[200px] align-top">
                <div className="text-sm font-medium text-gray-900 line-clamp-2" title={sk.nama}>{sk.nama}</div>
                <div className="text-xs text-gray-500 mt-1">Pagu: {formatRupiah(paguMM)}</div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="flex flex-col space-y-2 w-32">
                    <div className="flex items-center justify-between h-[28px] gap-2">
                        <span className="text-xs text-slate-600 font-semibold shrink-0">Biasa:</span>
                        <NumberStepper 
                            value={targetBiasaInput} 
                            onChange={setTargetBiasaInput} 
                            color="blue" 
                        />
                    </div>
                    <div className="flex items-center justify-between h-[28px] gap-2">
                        <span className="text-xs text-amber-600 font-semibold shrink-0">Besar:</span>
                        <NumberStepper 
                            value={targetBesarInput} 
                            onChange={setTargetBesarInput} 
                            color="amber" 
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !isChanged}
                        className={`w-full py-1 rounded-md text-xs font-semibold transition-all ${
                            isSaving 
                                ? 'bg-gray-300 text-gray-500' 
                                : !isChanged 
                                    ? 'bg-gray-100 text-gray-400 cursor-default' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                    >
                        {isSaving ? '...' : isChanged ? 'Simpan' : 'Tersimpan'}
                    </button>
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap align-top">
                <div className="flex flex-col space-y-2 text-sm text-center">
                    <div className="inline-flex items-center justify-center px-3 rounded text-xs font-medium bg-blue-50 text-blue-700 h-[28px]">
                        {rapatBiasaTelahDilakukan} Kali
                    </div>
                    <div className="inline-flex items-center justify-center px-3 rounded text-xs font-medium bg-amber-50 text-amber-700 h-[28px]">
                        {rapatBesarTelahDilakukan} Kali
                    </div>
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-center align-top">
                <div className="flex flex-col space-y-2 text-sm">
                    <div className={`inline-flex items-center justify-center px-3 rounded text-xs font-medium h-[28px] ${sisaRapatBiasa === 0 && rencanaRapatBiasa > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                        {sisaRapatBiasa} Kali
                    </div>
                    <div className={`inline-flex items-center justify-center px-3 rounded text-xs font-medium h-[28px] ${sisaRapatBesar === 0 && rencanaRapatBesar > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                        {sisaRapatBesar} Kali
                    </div>
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                <div className={sisaNominalMM <= 0 && paguMM > 0 ? 'text-red-600' : 'text-gray-900'}>
                    {formatRupiah(sisaNominalMM)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Realisasi: {formatRupiah(realisasiMM)}</div>
            </td>
        </tr>
    );
};

export default function MonitoringIndex() {
    const { subKegiatans, mmTransactions, selectedYear } = usePage().props as any;

    return (
        <MainLayout title="Monitoring">
            <Head title="Monitoring" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-3">
                        <Eye size={22} className="text-blue-600" />
                        <h2 className="text-xl font-bold text-slate-800">Monitoring Rapat {selectedYear}</h2>
                    </div>
                    <div className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-medium">
                        {subKegiatans.length} Sub Kegiatan
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50 sticky top-0 z-10 outline outline-1 outline-slate-200">
                                <tr>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-16 border-b border-slate-200">No.</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">Sub Kegiatan</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 w-36">Rencana (Biasa & Besar)</th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">Realisasi (Biasa & Besar)</th>
                                    <th className="px-4 py-4 text-center text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">Sisa (Biasa & Besar)</th>
                                    <th className="px-4 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">Sisa Nominal MM</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {subKegiatans.length > 0 ? (
                                    subKegiatans.map((sk: any, index: number) => (
                                        <SubKegiatanRow 
                                            key={sk.id} 
                                            sk={sk} 
                                            mmTransactions={mmTransactions} 
                                            selectedYear={selectedYear} 
                                            index={index}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <div className="text-slate-400 mb-2">Tidak ada data Sub Kegiatan</div>
                                            <div className="text-sm text-slate-500">Tambahkan Sub Kegiatan terlebih dahulu</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
