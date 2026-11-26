<?php

namespace App\Http\Controllers;

use App\Models\SubKegiatan;
use App\Models\MmTransaction;
use App\Models\AppSetting;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MmTransactionController extends Controller
{
    public function index(Request $request)
    {
        $year = session('selected_year', date('Y'));

        $subKegiatans = SubKegiatan::where('tahun', $year)->get();
        $mmTransactions = MmTransaction::where('tahun', $year)
                            ->with('subKegiatan')
                            ->orderBy('tanggal', 'desc')
                            ->orderBy('created_at', 'desc')
                            ->orderBy('id', 'desc')
                            ->get();

        $pricing = AppSetting::getHargaMakanMinum();

        return Inertia::render('MakanMinum/Index', [
            'selectedYear' => (int) $year,
            'subKegiatans' => $subKegiatans,
            'mmTransactions' => $mmTransactions,
            'pricing' => $pricing,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sub_kegiatan_id' => 'required|exists:sub_kegiatans,id',
            'judul' => 'required|string|max:255',
            'tanggal' => 'required|date',
            'jenis_rapat' => 'required|in:biasa,besar',
            'qty_snack' => 'required|integer|min:0',
            'qty_nasi' => 'required|integer|min:0',
            'snack_price' => 'nullable|numeric|min:0',
            'nasi_price' => 'nullable|numeric|min:0',
            'undangan_file' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        $subKegiatan = SubKegiatan::findOrFail($validated['sub_kegiatan_id']);
        
        $defaultPricing = AppSetting::getHargaMakanMinum();
        $SNACK_PRICE = isset($validated['snack_price']) && is_numeric($validated['snack_price']) && $validated['snack_price'] > 0 
            ? (float)$validated['snack_price'] 
            : $defaultPricing['snack_price'];
        $NASI_PRICE = isset($validated['nasi_price']) && is_numeric($validated['nasi_price']) && $validated['nasi_price'] > 0 
            ? (float)$validated['nasi_price'] 
            : $defaultPricing['nasi_price'];
        
        $baseHarga = ($validated['qty_snack'] * $SNACK_PRICE) + ($validated['qty_nasi'] * $NASI_PRICE);
        $pajak = $baseHarga * 0.10;
        $pph = $baseHarga * 0.005;
        $grandTotal = $baseHarga + $pajak;

        // Hitung total pagu dan total terpakai
        $totalPagu = $subKegiatan->anggaran_murni_mm + $subKegiatan->anggaran_perubahan_mm;
        $totalTerpakai = MmTransaction::where('sub_kegiatan_id', $subKegiatan->id)->sum('grand_total');
        
        $sisaAnggaran = $totalPagu - $totalTerpakai;

        if ($sisaAnggaran < $grandTotal) {
            return back()->withErrors([
                'anggaran' => 'Gagal menyimpan: Anggaran Murni & Perubahan Makan Minum tidak mencukupi. Sisa: Rp ' . number_format($sisaAnggaran, 0, ',', '.'),
            ]);
        }

        $validated['base_harga'] = $baseHarga;
        $validated['pajak'] = $pajak;
        $validated['pph'] = $pph;
        $validated['grand_total'] = $grandTotal;
        $validated['tahun'] = $subKegiatan->tahun;
        $validated['user_id'] = Auth::id();

        if ($request->hasFile('undangan_file')) {
            $file = $request->file('undangan_file');
            $path = $file->store('undangan/mm', 'public');
            $validated['undangan_file'] = $path;
        }

        unset($validated['snack_price'], $validated['nasi_price']);

        $tx = MmTransaction::create($validated);

        ActivityLog::record(
            'tambah',
            'Makan Minum',
            "Menambahkan transaksi konsumsi: {$tx->judul} ({$tx->qty_snack} Snack, {$tx->qty_nasi} Nasi) - Rp " . number_format($tx->grand_total, 0, ',', '.'),
            ['sub_kegiatan' => $subKegiatan->nama, 'grand_total' => $tx->grand_total]
        );

        return redirect()->back()->with('success', 'Transaksi Makan & Minum berhasil disimpan.');
    }

    public function uploadDokumentasi(Request $request, $id)
    {
        $request->validate([
            'dokumentasi_files.*' => 'required|file|mimes:jpg,jpeg,png|max:10240',
        ]);

        $transaction = MmTransaction::findOrFail($id);
        $existingFiles = $transaction->dokumentasi_files ?? [];

        if ($request->hasFile('dokumentasi_files')) {
            foreach ($request->file('dokumentasi_files') as $file) {
                $path = $file->store('dokumentasi/mm', 'public');
                $existingFiles[] = $path;
            }
            $transaction->update(['dokumentasi_files' => $existingFiles]);
        }

        ActivityLog::record(
            'ubah',
            'Makan Minum',
            "Mengunggah foto dokumentasi pada transaksi: {$transaction->judul}"
        );

        return redirect()->back()->with('success', 'Dokumentasi berhasil diunggah.');
    }

    public function uploadUndangan(Request $request, $id)
    {
        $request->validate([
            'undangan_file' => 'required|file|mimes:pdf|max:10240',
        ]);

        $transaction = MmTransaction::findOrFail($id);

        if ($request->hasFile('undangan_file')) {
            if ($transaction->undangan_file) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($transaction->undangan_file);
            }
            
            $file = $request->file('undangan_file');
            $path = $file->store('undangan/mm', 'public');
            $transaction->update(['undangan_file' => $path]);
        }

        ActivityLog::record(
            'ubah',
            'Makan Minum',
            "Mengunggah berkas undangan PDF pada transaksi: {$transaction->judul}"
        );

        return redirect()->back()->with('success', 'Undangan berhasil diunggah.');
    }

    public function deleteFile(Request $request, $id)
    {
        $transaction = MmTransaction::findOrFail($id);
        $type = $request->input('type');
        
        if ($type === 'undangan') {
            if ($transaction->undangan_file) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($transaction->undangan_file);
                $transaction->update(['undangan_file' => null]);
            }
            ActivityLog::record('hapus', 'Makan Minum', "Menghapus berkas undangan pada transaksi: {$transaction->judul}");
        } elseif ($type === 'dokumentasi') {
            $pathToDelete = $request->input('path');
            $files = $transaction->dokumentasi_files ?? [];
            if (($key = array_search($pathToDelete, $files)) !== false) {
                unset($files[$key]);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($pathToDelete);
                $transaction->update(['dokumentasi_files' => array_values($files)]);
            }
            ActivityLog::record('hapus', 'Makan Minum', "Menghapus 1 foto dokumentasi pada transaksi: {$transaction->judul}");
        }

        return redirect()->back()->with('success', 'File berhasil dihapus.');
    }

    public function update(Request $request, MmTransaction $makan_minum)
    {
        $validated = $request->validate([
            'sub_kegiatan_id' => 'required|exists:sub_kegiatans,id',
            'judul' => 'required|string|max:255',
            'tanggal' => 'required|date',
            'jenis_rapat' => 'required|in:biasa,besar',
            'qty_snack' => 'required|integer|min:0',
            'qty_nasi' => 'required|integer|min:0',
            'snack_price' => 'nullable|numeric|min:0',
            'nasi_price' => 'nullable|numeric|min:0',
            'undangan_file' => 'nullable|file|mimes:pdf|max:10240',
            'dokumentasi_files.*' => 'nullable|file|mimes:jpg,jpeg,png|max:10240',
        ]);

        $subKegiatan = SubKegiatan::findOrFail($validated['sub_kegiatan_id']);

        $defaultPricing = AppSetting::getHargaMakanMinum();
        $SNACK_PRICE = isset($validated['snack_price']) && is_numeric($validated['snack_price']) && $validated['snack_price'] > 0 
            ? (float)$validated['snack_price'] 
            : $defaultPricing['snack_price'];
        $NASI_PRICE = isset($validated['nasi_price']) && is_numeric($validated['nasi_price']) && $validated['nasi_price'] > 0 
            ? (float)$validated['nasi_price'] 
            : $defaultPricing['nasi_price'];

        $baseHarga = ($validated['qty_snack'] * $SNACK_PRICE) + ($validated['qty_nasi'] * $NASI_PRICE);
        $pajak = $baseHarga * 0.10;
        $pph = $baseHarga * 0.005;
        $grandTotal = $baseHarga + $pajak;

        // Hitung total pagu dan total terpakai SELAIN transaksi ini
        $totalPagu = $subKegiatan->anggaran_murni_mm + $subKegiatan->anggaran_perubahan_mm;
        $totalTerpakaiLain = MmTransaction::where('sub_kegiatan_id', $subKegiatan->id)
                                ->where('id', '!=', $makan_minum->id)
                                ->sum('grand_total');

        $sisaAnggaran = $totalPagu - $totalTerpakaiLain;

        if ($sisaAnggaran < $grandTotal) {
            return back()->withErrors([
                'anggaran' => 'Gagal mengubah: Anggaran Murni & Perubahan Makan Minum tidak mencukupi. Sisa tersedia: Rp ' . number_format($sisaAnggaran, 0, ',', '.'),
            ]);
        }

        $validated['base_harga'] = $baseHarga;
        $validated['pajak'] = $pajak;
        $validated['pph'] = $pph;
        $validated['grand_total'] = $grandTotal;
        $validated['tahun'] = $subKegiatan->tahun;

        if ($request->hasFile('undangan_file')) {
            if ($makan_minum->undangan_file) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($makan_minum->undangan_file);
            }
            $file = $request->file('undangan_file');
            $path = $file->store('undangan/mm', 'public');
            $validated['undangan_file'] = $path;
        }

        if ($request->hasFile('dokumentasi_files')) {
            $existingFiles = $makan_minum->dokumentasi_files ?? [];
            foreach ($request->file('dokumentasi_files') as $file) {
                $path = $file->store('dokumentasi/mm', 'public');
                $existingFiles[] = $path;
            }
            $validated['dokumentasi_files'] = $existingFiles;
        }

        unset($validated['snack_price'], $validated['nasi_price']);

        $makan_minum->update($validated);

        ActivityLog::record(
            'ubah',
            'Makan Minum',
            "Memperbarui transaksi konsumsi: {$makan_minum->judul} ({$makan_minum->qty_snack} Snack, {$makan_minum->qty_nasi} Nasi) - Rp " . number_format($makan_minum->grand_total, 0, ',', '.'),
            ['sub_kegiatan' => $subKegiatan->nama, 'grand_total' => $makan_minum->grand_total]
        );

        return redirect()->back()->with('success', 'Transaksi Makan & Minum berhasil diperbarui.');
    }

    public function destroy(MmTransaction $makan_minum)
    {
        $judul = $makan_minum->judul;
        $total = $makan_minum->grand_total;
        
        $makan_minum->delete();

        ActivityLog::record(
            'hapus',
            'Makan Minum',
            "Menghapus transaksi konsumsi: {$judul} - Rp " . number_format($total, 0, ',', '.')
        );

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }
}
