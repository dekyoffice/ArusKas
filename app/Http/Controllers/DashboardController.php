<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SubKegiatan;
use App\Models\PdTransaction;
use App\Models\MmTransaction;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $year = session('selected_year', date('Y'));

        // Fetch sub kegiatans for the given year
        $subKegiatans = SubKegiatan::where('tahun', $year)->get();
        
        // Fetch transactions for the given year
        $pdTransactions = PdTransaction::where('tahun', $year)->get();
        $mmTransactions = MmTransaction::where('tahun', $year)->get();

        // Calculate global stats
        $globalPdPagu = $subKegiatans->sum(fn ($sk) => $sk->anggaran_murni_pd + $sk->anggaran_perubahan_pd);
        $globalPdRealisasi = $pdTransactions->sum('total');
        $globalPdSisa = max(0, $globalPdPagu - $globalPdRealisasi);
        
        $globalMmPagu = $subKegiatans->sum(fn ($sk) => $sk->anggaran_murni_mm + $sk->anggaran_perubahan_mm);
        $globalMmRealisasi = $mmTransactions->sum('grand_total');
        $globalMmSisa = max(0, $globalMmPagu - $globalMmRealisasi);

        // Calculate per sub kegiatan stats
        $subKegiatanStats = $subKegiatans->map(function ($sk) use ($pdTransactions, $mmTransactions) {
            $pdPagu = $sk->anggaran_murni_pd + $sk->anggaran_perubahan_pd;
            $pdRealisasi = $pdTransactions->where('sub_kegiatan_id', $sk->id)->sum('total');
            $pdSisa = max(0, $pdPagu - $pdRealisasi);
            $pdPercent = min(100, $pdPagu > 0 ? ($pdRealisasi / $pdPagu) * 100 : 0);

            $pdMurniTerpakai = min($pdRealisasi, $sk->anggaran_murni_pd);
            $pdSisaMurni = $sk->anggaran_murni_pd - $pdMurniTerpakai;
            $pdPerubahanTerpakai = max(0, $pdRealisasi - $sk->anggaran_murni_pd);
            $pdSisaPerubahan = max(0, $sk->anggaran_perubahan_pd - $pdPerubahanTerpakai);

            $mmPagu = $sk->anggaran_murni_mm + $sk->anggaran_perubahan_mm;
            $mmRealisasi = $mmTransactions->where('sub_kegiatan_id', $sk->id)->sum('grand_total');
            $mmSisa = max(0, $mmPagu - $mmRealisasi);
            $mmPercent = min(100, $mmPagu > 0 ? ($mmRealisasi / $mmPagu) * 100 : 0);

            $mmMurniTerpakai = min($mmRealisasi, $sk->anggaran_murni_mm);
            $mmSisaMurni = $sk->anggaran_murni_mm - $mmMurniTerpakai;
            $mmPerubahanTerpakai = max(0, $mmRealisasi - $sk->anggaran_murni_mm);
            $mmSisaPerubahan = max(0, $sk->anggaran_perubahan_mm - $mmPerubahanTerpakai);

            return [
                'id' => $sk->id,
                'nama' => $sk->nama,
                'pdMurni' => $pdSisaMurni,
                'pdPerubahan' => $pdSisaPerubahan,
                'pdPagu' => $pdPagu,
                'pdRealisasi' => $pdRealisasi,
                'pdSisa' => $pdSisa,
                'pdPercent' => $pdPercent,
                'mmMurni' => $mmSisaMurni,
                'mmPerubahan' => $mmSisaPerubahan,
                'mmPagu' => $mmPagu,
                'mmRealisasi' => $mmRealisasi,
                'mmSisa' => $mmSisa,
                'mmPercent' => $mmPercent,
            ];
        })->values();

        return Inertia::render('Dashboard', [
            'selectedYear' => (int) $year,
            'globalStats' => [
                'pdPagu' => $globalPdPagu,
                'pdRealisasi' => $globalPdRealisasi,
                'pdSisa' => $globalPdSisa,
                'pdPercent' => min(100, $globalPdPagu > 0 ? ($globalPdRealisasi / $globalPdPagu) * 100 : 0),
                'mmPagu' => $globalMmPagu,
                'mmRealisasi' => $globalMmRealisasi,
                'mmSisa' => $globalMmSisa,
                'mmPercent' => min(100, $globalMmPagu > 0 ? ($globalMmRealisasi / $globalMmPagu) * 100 : 0),
            ],
            'subKegiatanStats' => $subKegiatanStats,
        ]);
    }
}
