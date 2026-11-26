<?php

namespace App\Http\Controllers;

use App\Models\SubKegiatan;
use App\Models\PdTransaction;
use App\Models\MmTransaction;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class SubKegiatanController extends Controller
{
    public function index(Request $request)
    {
        $year = session('selected_year', date('Y'));

        $subKegiatans = SubKegiatan::where('tahun', $year)
                            ->with('creator')
                            ->orderBy('id', 'desc')
                            ->get();

        $pdTransactions = PdTransaction::where('tahun', $year)->get();
        $mmTransactions = MmTransaction::where('tahun', $year)->get();

        $tableData = $subKegiatans->map(function ($sk) use ($pdTransactions, $mmTransactions) {
            $paguPD = $sk->anggaran_murni_pd + $sk->anggaran_perubahan_pd;
            $paguMM = $sk->anggaran_murni_mm + $sk->anggaran_perubahan_mm;
            
            $realisasiPD = $pdTransactions->where('sub_kegiatan_id', $sk->id)->sum('total');
            $realisasiMM = $mmTransactions->where('sub_kegiatan_id', $sk->id)->sum('grand_total');
            
            $totalPagu = $paguPD + $paguMM;
            $totalRealisasi = $realisasiPD + $realisasiMM;
            $sisa = max(0, $totalPagu - $totalRealisasi);
            $persentase = min(100, $totalPagu > 0 ? ($totalRealisasi / $totalPagu) * 100 : 0);

            return [
                'id' => $sk->id,
                'nama' => $sk->nama,
                'tahun' => $sk->tahun,
                'anggaran_murni_pd' => $sk->anggaran_murni_pd,
                'anggaran_perubahan_pd' => $sk->anggaran_perubahan_pd,
                'anggaran_murni_mm' => $sk->anggaran_murni_mm,
                'anggaran_perubahan_mm' => $sk->anggaran_perubahan_mm,
                'paguPD' => $paguPD,
                'paguMM' => $paguMM,
                'realisasiPD' => $realisasiPD,
                'realisasiMM' => $realisasiMM,
                'totalPagu' => $totalPagu,
                'totalRealisasi' => $totalRealisasi,
                'sisa' => $sisa,
                'persentase' => round($persentase, 1),
                'creator' => $sk->creator ? $sk->creator->name : '-',
            ];
        });

        return Inertia::render('SubKegiatan/Index', [
            'subKegiatans' => $tableData,
            'selectedYear' => (int) $year,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tahun' => 'required|integer',
            'anggaran_murni_pd' => 'required|numeric|min:0',
            'anggaran_perubahan_pd' => 'nullable|numeric|min:0',
            'anggaran_murni_mm' => 'required|numeric|min:0',
            'anggaran_perubahan_mm' => 'nullable|numeric|min:0',
        ]);

        $validated['anggaran_perubahan_pd'] = $validated['anggaran_perubahan_pd'] ?? 0;
        $validated['anggaran_perubahan_mm'] = $validated['anggaran_perubahan_mm'] ?? 0;
        $validated['created_by'] = Auth::id();

        $sk = SubKegiatan::create($validated);

        ActivityLog::record(
            'tambah',
            'Sub Kegiatan',
            "Menambahkan sub kegiatan baru: {$sk->nama} (Pagu PD: Rp " . number_format($sk->anggaran_murni_pd + $sk->anggaran_perubahan_pd, 0, ',', '.') . ", Pagu MM: Rp " . number_format($sk->anggaran_murni_mm + $sk->anggaran_perubahan_mm, 0, ',', '.') . ")"
        );

        return redirect()->back()->with('success', 'Sub Kegiatan berhasil ditambahkan.');
    }

    public function update(Request $request, SubKegiatan $subKegiatan)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'tahun' => 'required|integer',
            'anggaran_murni_pd' => 'required|numeric|min:0',
            'anggaran_perubahan_pd' => 'required|numeric|min:0',
            'anggaran_murni_mm' => 'required|numeric|min:0',
            'anggaran_perubahan_mm' => 'required|numeric|min:0',
        ]);

        // Cek apakah pagu baru cukup untuk menutup realisasi yang sudah berjalan
        $realisasiPD = PdTransaction::where('sub_kegiatan_id', $subKegiatan->id)->sum('total');
        $realisasiMM = MmTransaction::where('sub_kegiatan_id', $subKegiatan->id)->sum('grand_total');

        $paguPDBulan = (float)$validated['anggaran_murni_pd'] + (float)$validated['anggaran_perubahan_pd'];
        $paguMMBulan = (float)$validated['anggaran_murni_mm'] + (float)$validated['anggaran_perubahan_mm'];

        if ($paguPDBulan < $realisasiPD) {
            return back()->withErrors([
                'anggaran' => 'Pengurangan pagu Perjalanan Dinas ditolak: Pagu baru (Rp ' . number_format($paguPDBulan, 0, ',', '.') . ') lebih kecil dari realisasi yang sudah terpakai (Rp ' . number_format($realisasiPD, 0, ',', '.') . ').',
            ]);
        }

        if ($paguMMBulan < $realisasiMM) {
            return back()->withErrors([
                'anggaran' => 'Pengurangan pagu Makan Minum ditolak: Pagu baru (Rp ' . number_format($paguMMBulan, 0, ',', '.') . ') lebih kecil dari realisasi yang sudah terpakai (Rp ' . number_format($realisasiMM, 0, ',', '.') . ').',
            ]);
        }

        $oldPaguPD = $subKegiatan->anggaran_murni_pd + $subKegiatan->anggaran_perubahan_pd;
        $oldPaguMM = $subKegiatan->anggaran_murni_mm + $subKegiatan->anggaran_perubahan_mm;

        $subKegiatan->update($validated);

        $actionType = ($paguPDBulan < $oldPaguPD || $paguMMBulan < $oldPaguMM) ? 'kurangi_pagu' : 'ubah';

        ActivityLog::record(
            $actionType,
            'Sub Kegiatan',
            "Memperbarui pagu sub kegiatan {$subKegiatan->nama} (Pagu PD: Rp " . number_format($paguPDBulan, 0, ',', '.') . ", Pagu MM: Rp " . number_format($paguMMBulan, 0, ',', '.') . ")",
            [
                'pagu_pd_lama' => $oldPaguPD,
                'pagu_pd_baru' => $paguPDBulan,
                'pagu_mm_lama' => $oldPaguMM,
                'pagu_mm_baru' => $paguMMBulan,
            ]
        );

        return redirect()->back()->with('success', 'Sub Kegiatan berhasil diperbarui.');
    }

    public function destroy(SubKegiatan $subKegiatan)
    {
        $nama = $subKegiatan->nama;
        $subKegiatan->delete();

        ActivityLog::record(
            'hapus',
            'Sub Kegiatan',
            "Menghapus sub kegiatan: {$nama}"
        );

        return redirect()->back()->with('success', 'Sub Kegiatan berhasil dihapus.');
    }
}
