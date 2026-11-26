import MainLayout from '@/Layouts/MainLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { formatRupiah } from '@/utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { Plane, Coffee, Briefcase, BarChart2, PieChart as PieChartIcon, Activity, Download, Layers, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface GlobalStats {
    pdPagu: number;
    pdRealisasi: number;
    pdSisa: number;
    pdPercent: number;
    mmPagu: number;
    mmRealisasi: number;
    mmSisa: number;
    mmPercent: number;
}

interface SubKegiatanStat {
    id: number;
    nama: string;
    pdMurni: number;
    pdPerubahan: number;
    pdPagu: number;
    pdRealisasi: number;
    pdSisa: number;
    pdPercent: number;
    mmMurni: number;
    mmPerubahan: number;
    mmPagu: number;
    mmRealisasi: number;
    mmSisa: number;
    mmPercent: number;
}

interface Props {
    globalStats: GlobalStats;
    subKegiatanStats: SubKegiatanStat[];
}

export default function Dashboard({ globalStats, subKegiatanStats }: Props) {
    const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('pie');

    const chartData = [
        { name: 'Realisasi PD', value: globalStats.pdRealisasi, color: '#3b82f6' },
        { name: 'Sisa PD', value: globalStats.pdSisa, color: '#93c5fd' },
        { name: 'Realisasi MM', value: globalStats.mmRealisasi, color: '#10b981' },
        { name: 'Sisa MM', value: globalStats.mmSisa, color: '#6ee7b7' },
    ];

    const currentYear = new URLSearchParams(window.location.search).get('year') || new Date().getFullYear();

    // Total gabungan
    const totalPagu = globalStats.pdPagu + globalStats.mmPagu;
    const totalRealisasi = globalStats.pdRealisasi + globalStats.mmRealisasi;
    const totalSisa = globalStats.pdSisa + globalStats.mmSisa;
    const totalPercent = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

    return (
        <MainLayout title="Dashboard">
            <div className="space-y-6">
                {/* ========================================================= */}
                {/* 1. APP PAGE TITLE / HEADER BANNER                         */}
                {/* ========================================================= */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            <Activity size={26} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                                    Dashboard Monitoring Arus Kas
                                </h1>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Tahun {currentYear}
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-slate-500 mt-1">
                                Rekapitulasi realisasi belanja Perjalanan Dinas dan Makan Minum secara real-time
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                        <a 
                            href={route('export.excel', { year: currentYear })}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <Download size={16} /> Excel
                        </a>
                        <a 
                            href={route('export.pdf', { year: currentYear })}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs md:text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                        >
                            <Download size={16} /> PDF
                        </a>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* 2. SECTION ATAS: RINGKASAN PAGU (PD & MAKAN MINUM)        */}
                {/* 2 Kartu Berjajar Rapi: PD & Makan Minum                   */}
                {/* ========================================================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    
                    {/* Card 1: Perjalanan Dinas */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between gap-4 hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
                        
                        <div className="flex justify-between items-center pt-1">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                                    <Plane size={20} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ringkasan</span>
                                    <h3 className="font-bold text-slate-800 text-sm">Perjalanan Dinas</h3>
                                </div>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200/60 shadow-xs">
                                {globalStats.pdPercent.toFixed(1)}%
                            </span>
                        </div>

                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Pagu</span>
                            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                                {formatRupiah(globalStats.pdPagu)}
                            </div>
                        </div>

                        {/* Micro Progress Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                                <span>Tingkat Penyerapan</span>
                                <span className="font-bold text-blue-600">{globalStats.pdPercent.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-blue-600 rounded-full" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(globalStats.pdPercent, 100)}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                            </div>
                        </div>

                        {/* Sub Metrics */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                            <div className="flex flex-col bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Realisasi
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={formatRupiah(globalStats.pdRealisasi)}>
                                    {formatRupiah(globalStats.pdRealisasi)}
                                </span>
                            </div>
                            <div className="flex flex-col bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Sisa Saldo
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-blue-600 truncate" title={formatRupiah(globalStats.pdSisa)}>
                                    {formatRupiah(globalStats.pdSisa)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Makan & Minum */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between gap-4 hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
                        
                        <div className="flex justify-between items-center pt-1">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                                    <Coffee size={20} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ringkasan</span>
                                    <h3 className="font-bold text-slate-800 text-sm">Makan & Minum</h3>
                                </div>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200/60 shadow-xs">
                                {globalStats.mmPercent.toFixed(1)}%
                            </span>
                        </div>

                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Pagu</span>
                            <div className="text-2xl font-black text-slate-800 tracking-tight mt-0.5">
                                {formatRupiah(globalStats.mmPagu)}
                            </div>
                        </div>

                        {/* Micro Progress Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                                <span>Tingkat Penyerapan</span>
                                <span className="font-bold text-emerald-600">{globalStats.mmPercent.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-emerald-600 rounded-full" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(globalStats.mmPercent, 100)}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                            </div>
                        </div>

                        {/* Sub Metrics */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                            <div className="flex flex-col bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Realisasi
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={formatRupiah(globalStats.mmRealisasi)}>
                                    {formatRupiah(globalStats.mmRealisasi)}
                                </span>
                            </div>
                            <div className="flex flex-col bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Sisa Saldo
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-emerald-600 truncate" title={formatRupiah(globalStats.mmSisa)}>
                                    {formatRupiah(globalStats.mmSisa)}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ========================================================= */}
                {/* 3. SECTION BAWAH: SUB KEGIATAN (KIRI) & CHART (KANAN)     */}
                {/* Menggunakan lg:items-stretch & fixed container height     */}
                {/* agar kedua card sejajar 100% di bagian bawahnya          */}
                {/* ========================================================= */}
                <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch lg:h-[580px] xl:h-[600px] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    
                    {/* ----------------------------------------------------- */}
                    {/* BAGIAN KIRI: Rincian Sub Kegiatan (~62% Desktop)      */}
                    {/* ----------------------------------------------------- */}
                    <div className="w-full lg:w-[58%] xl:w-[62%] flex flex-col h-auto lg:h-full min-w-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col h-full overflow-hidden">
                            
                            {/* Card Header */}
                            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                                        <Briefcase size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-800 text-sm md:text-base truncate">Rincian Sub Kegiatan</h3>
                                        <p className="text-[11px] text-slate-500 truncate">Alokasi & penyerapan anggaran per sub kegiatan</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg shrink-0 shadow-xs">
                                    {subKegiatanStats.length} Kegiatan
                                </span>
                            </div>

                            {/* Card Body: Scrollable Sub-Kegiatan List */}
                            <div className="p-4 md:p-5 flex-1 min-h-0 flex flex-col">
                                {subKegiatanStats.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 text-sm font-medium">
                                        Belum ada data sub kegiatan yang ditambahkan.
                                    </div>
                                ) : (
                                    <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-3.5 custom-scrollbar max-h-[500px] lg:max-h-none">
                                        {subKegiatanStats.map((stat, index) => (
                                            <div 
                                                key={stat.id} 
                                                className="bg-white rounded-xl border border-slate-200/90 p-4 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col gap-3 group"
                                            >
                                                {/* Title & Index */}
                                                <div className="flex items-start gap-2.5">
                                                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 border border-blue-200/60 mt-0.5">
                                                        {index + 1}
                                                    </span>
                                                    <h4 className="font-bold text-slate-800 text-xs md:text-sm line-clamp-2 leading-snug">
                                                        {stat.nama}
                                                    </h4>
                                                </div>

                                                {/* Sub-kegiatan Dual Indicators (PD & MM) */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                    
                                                    {/* PD Box */}
                                                    <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                                                                <Plane size={13} className="text-blue-500" /> Perjalanan Dinas
                                                            </span>
                                                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                                                                {stat.pdPercent.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 text-[11px]">
                                                            <div className="flex justify-between text-slate-500">
                                                                <span>Sisa Murni:</span>
                                                                <span className="font-semibold text-slate-700 truncate pl-1" title={formatRupiah(stat.pdMurni)}>
                                                                    {formatRupiah(stat.pdMurni)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-emerald-600 font-medium">
                                                                <span>Sisa Ubah:</span>
                                                                <span className="font-bold truncate pl-1" title={formatRupiah(stat.pdPerubahan)}>
                                                                    {formatRupiah(stat.pdPerubahan)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                                                            <motion.div 
                                                                className={`h-full ${stat.pdPercent > 80 ? 'bg-rose-500' : 'bg-blue-500'}`} 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(stat.pdPercent, 100)}%` }}
                                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* MM Box */}
                                                    <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                                                                <Coffee size={13} className="text-emerald-500" /> Makan & Minum
                                                            </span>
                                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                                                                {stat.mmPercent.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 text-[11px]">
                                                            <div className="flex justify-between text-slate-500">
                                                                <span>Sisa Murni:</span>
                                                                <span className="font-semibold text-slate-700 truncate pl-1" title={formatRupiah(stat.mmMurni)}>
                                                                    {formatRupiah(stat.mmMurni)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-emerald-600 font-medium">
                                                                <span>Sisa Ubah:</span>
                                                                <span className="font-bold truncate pl-1" title={formatRupiah(stat.mmPerubahan)}>
                                                                    {formatRupiah(stat.mmPerubahan)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-0.5">
                                                            <motion.div 
                                                                className={`h-full ${stat.mmPercent > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${Math.min(stat.mmPercent, 100)}%` }}
                                                                transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                                                            />
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* ----------------------------------------------------- */}
                    {/* BAGIAN KANAN: Rasio Penyerapan / Chart (~38% Desktop) */}
                    {/* ----------------------------------------------------- */}
                    <div className="w-full lg:w-[42%] xl:w-[38%] flex flex-col h-auto lg:h-full min-w-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col h-full overflow-hidden">
                            
                            {/* Card Header */}
                            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                                        <BarChart2 size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm md:text-base">Rasio Penyerapan</h3>
                                        <p className="text-[11px] text-slate-500">Visualisasi komparasi belanja</p>
                                    </div>
                                </div>
                            </div>

                            {/* Segmented Switcher Pills */}
                            <div className="px-4 pt-4 shrink-0">
                                <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                                    <button 
                                        onClick={() => setChartType('pie')}
                                        className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            chartType === 'pie' 
                                                ? 'bg-white shadow-xs text-blue-600' 
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <PieChartIcon size={14} /> Donut
                                    </button>
                                    <button 
                                        onClick={() => setChartType('bar')}
                                        className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            chartType === 'bar' 
                                                ? 'bg-white shadow-xs text-blue-600' 
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <BarChart2 size={14} /> Bar
                                    </button>
                                    <button 
                                        onClick={() => setChartType('line')}
                                        className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                            chartType === 'line' 
                                                ? 'bg-white shadow-xs text-blue-600' 
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <Activity size={14} /> Line
                                    </button>
                                </div>
                            </div>

                            {/* Chart Area & Badges */}
                            <div className="p-4 flex-1 min-h-0 flex flex-col justify-between">
                                <div className="flex-1 w-full min-h-[260px] relative">
                                    {chartData.filter(d => d.value > 0).length > 0 ? (
                                        <div className="absolute inset-0">
                                            {chartType === 'pie' ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={chartData.filter(d => d.value > 0)}
                                                            cx="50%"
                                                            cy="45%"
                                                            innerRadius={65}
                                                            outerRadius={95}
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip 
                                                            formatter={(value: any) => formatRupiah(value as number)}
                                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
                                                        />
                                                        <Legend 
                                                            verticalAlign="bottom" 
                                                            iconType="circle"
                                                            wrapperStyle={{ paddingTop: '10px', fontSize: '11px', lineHeight: '1.8' }} 
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : chartType === 'bar' ? (
                                                <div className="w-full h-full overflow-x-auto custom-scrollbar flex items-end pb-2">
                                                    <div className="min-w-[420px] w-full h-[95%]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={chartData.filter(d => d.value > 0)} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={8} interval={0} />
                                                                <YAxis 
                                                                    axisLine={false} 
                                                                    tickLine={false} 
                                                                    tick={{ fill: '#64748b', fontSize: 10 }} 
                                                                    tickFormatter={(val) => {
                                                                        if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}M`;
                                                                        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Jt`;
                                                                        return `${val}`;
                                                                    }}
                                                                    width={36}
                                                                />
                                                                <Tooltip 
                                                                    formatter={(value: any) => formatRupiah(value as number)}
                                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
                                                                    cursor={{ fill: '#f8fafc' }}
                                                                />
                                                                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={45}>
                                                                    {chartData.filter(d => d.value > 0).map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full overflow-x-auto custom-scrollbar flex items-end pb-2">
                                                    <div className="min-w-[420px] w-full h-[95%]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={chartData.filter(d => d.value > 0)} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={8} interval={0} />
                                                                <YAxis 
                                                                    axisLine={false} 
                                                                    tickLine={false} 
                                                                    tick={{ fill: '#64748b', fontSize: 10 }} 
                                                                    tickFormatter={(val) => {
                                                                        if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}M`;
                                                                        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}Jt`;
                                                                        return `${val}`;
                                                                    }}
                                                                    width={36}
                                                                />
                                                                <Tooltip 
                                                                    formatter={(value: any) => formatRupiah(value as number)}
                                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
                                                                />
                                                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                            <PieChartIcon className="opacity-20 mb-3" width={64} height={64} />
                                            <p className="text-xs font-medium">Belum ada data anggaran yang diinput.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Mini Info Badges ArchitectUI */}
                                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs shrink-0">
                                    <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/60 flex flex-col">
                                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Serapan PD</span>
                                        <span className="font-extrabold text-blue-900 text-sm mt-0.5">{globalStats.pdPercent.toFixed(1)}%</span>
                                    </div>
                                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/60 flex flex-col">
                                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Serapan MM</span>
                                        <span className="font-extrabold text-emerald-900 text-sm mt-0.5">{globalStats.mmPercent.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}
