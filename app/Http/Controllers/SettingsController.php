<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AppSetting;
use App\Models\SubKegiatan;
use App\Models\PdTransaction;
use App\Models\MmTransaction;
use App\Models\DpaFile;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function setYear(Request $request)
    {
        $request->validate([
            'year' => 'required|integer|min:2000|max:2100'
        ]);

        session(['selected_year' => (int) $request->year]);

        return redirect()->back();
    }

    public function addYear(Request $request)
    {
        $nextYear = AppSetting::addNextYear();
        session(['selected_year' => $nextYear]);

        ActivityLog::record(
            'tambah',
            'Pengaturan',
            "Menambahkan periode tahun anggaran baru: {$nextYear}"
        );

        return redirect()->back()->with('success', "Periode tahun {$nextYear} berhasil ditambahkan.");
    }

    public function deleteYear(Request $request)
    {
        $request->validate([
            'year' => 'required|integer|min:2000|max:2100'
        ]);

        $yearToDelete = (int) $request->year;

        DB::transaction(function () use ($yearToDelete) {
            PdTransaction::where('tahun', $yearToDelete)->delete();
            MmTransaction::where('tahun', $yearToDelete)->delete();
            SubKegiatan::where('tahun', $yearToDelete)->delete();
            DpaFile::where('tahun', $yearToDelete)->delete();

            $remainingYears = AppSetting::removeYear($yearToDelete);
            
            $newSelectedYear = $remainingYears[0] ?? (int)date('Y');
            session(['selected_year' => $newSelectedYear]);
        });

        ActivityLog::record(
            'hapus',
            'Pengaturan',
            "Menghapus periode tahun anggaran {$yearToDelete} beserta data terkait"
        );

        return redirect()->back()->with('success', "Periode tahun {$yearToDelete} berhasil dihapus.");
    }

    /**
     * Memperbarui tarif harga satuan snack box dan nasi kotak
     */
    public function updateHargaMakanMinum(Request $request)
    {
        $validated = $request->validate([
            'snack_price' => 'required|numeric|min:0',
            'nasi_price' => 'required|numeric|min:0',
        ]);

        AppSetting::setHargaMakanMinum((float)$validated['snack_price'], (float)$validated['nasi_price']);

        ActivityLog::record(
            'ubah',
            'Makan Minum',
            "Memperbarui tarif acuan harga satuan konsumsi: Snack Box Rp " . number_format($validated['snack_price'], 0, ',', '.') . ", Nasi Kotak Rp " . number_format($validated['nasi_price'], 0, ',', '.')
        );

        return redirect()->back()->with('success', 'Pengaturan harga satuan konsumsi berhasil diperbarui.');
    }
}
