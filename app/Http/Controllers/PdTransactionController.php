<?php

namespace App\Http\Controllers;

use App\Models\SubKegiatan;
use App\Models\PdTransaction;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PdTransactionController extends Controller
{
    public function index(Request $request)
    {
        $year = session('selected_year', date('Y'));

        $subKegiatans = SubKegiatan::where('tahun', $year)->get();
        $pdTransactions = PdTransaction::where('tahun', $year)
                            ->with('subKegiatan')
                            ->orderBy('tanggal', 'desc')
                            ->orderBy('created_at', 'desc')
                            ->orderBy('id', 'desc')
                            ->get();

        return Inertia::render('PerjalananDinas/Index', [
            'selectedYear' => (int) $year,
            'subKegiatans' => $subKegiatans,
            'pdTransactions' => $pdTransactions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sub_kegiatan_id' => 'required|exists:sub_kegiatans,id',
            'judul' => 'required|string|max:255',
            'wilayah' => 'required|string|max:255',
            'tanggal' => 'required|date',
            'personil' => 'required|array',
            'personil.*.nama' => 'required|string',
            'personil.*.nominal' => 'required|numeric|min:0',
            'undangan_file' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        $subKegiatan = SubKegiatan::findOrFail($validated['sub_kegiatan_id']);
        
        $totalTransaksiBaru = collect($validated['personil'])->sum('nominal');

        // Hitung total pagu dan total terpakai (Bug Fix #2 & Murni -> Perubahan logic)
        $totalPagu = $subKegiatan->anggaran_murni_pd + $subKegiatan->anggaran_perubahan_pd;
        $totalTerpakai = PdTransaction::where('sub_kegiatan_id', $subKegiatan->id)->sum('total');
        
        $sisaAnggaran = $totalPagu - $totalTerpakai;

        if ($sisaAnggaran < $totalTransaksiBaru) {
            return back()->withErrors([
                'anggaran' => 'Gagal menyimpan: Anggaran Murni & Perubahan sudah tidak mencukupi. Sisa: Rp ' . number_format($sisaAnggaran, 0, ',', '.'),
            ]);
        }

        $validated['total'] = $totalTransaksiBaru;
        $validated['tahun'] = $subKegiatan->tahun;
        $validated['user_id'] = Auth::id();

        if ($request->hasFile('undangan_file')) {
            $file = $request->file('undangan_file');
            $path = $file->store('undangan/pd', 'public');
            $validated['undangan_file'] = $path;
        }

        $tx = PdTransaction::create($validated);

        ActivityLog::record(
            'tambah',
            'Perjalanan Dinas',
            "Menambahkan transaksi SPPD: {$tx->judul} ({$tx->wilayah}, " . count($tx->personil) . " orang) - Rp " . number_format($tx->total, 0, ',', '.'),
            ['sub_kegiatan' => $subKegiatan->nama, 'total' => $tx->total]
        );

        return redirect()->back()->with('success', 'Transaksi Perjalanan Dinas berhasil disimpan.');
    }

    public function uploadDokumentasi(Request $request, $id)
    {
        $request->validate([
            'dokumentasi_files.*' => 'required|file|mimes:jpg,jpeg,png|max:10240',
        ]);

        $transaction = PdTransaction::findOrFail($id);
        $existingFiles = $transaction->dokumentasi_files ?? [];

        if ($request->hasFile('dokumentasi_files')) {
            foreach ($request->file('dokumentasi_files') as $file) {
                $path = $file->store('dokumentasi/pd', 'public');
                $existingFiles[] = $path;
            }
            $transaction->update(['dokumentasi_files' => $existingFiles]);
        }

        ActivityLog::record(
            'ubah',
            'Perjalanan Dinas',
            "Mengunggah foto dokumentasi pada transaksi SPPD: {$transaction->judul}"
        );

        return redirect()->back()->with('success', 'Dokumentasi berhasil diunggah.');
    }

    public function uploadUndangan(Request $request, $id)
    {
        $request->validate([
            'undangan_file' => 'required|file|mimes:pdf|max:10240',
        ]);

        $transaction = PdTransaction::findOrFail($id);

        if ($request->hasFile('undangan_file')) {
            // Delete old file if exists
            if ($transaction->undangan_file) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($transaction->undangan_file);
            }
            
            $file = $request->file('undangan_file');
            $path = $file->store('undangan/pd', 'public');
            $transaction->update(['undangan_file' => $path]);
        }

        ActivityLog::record(
            'ubah',
            'Perjalanan Dinas',
            "Mengunggah berkas undangan PDF pada transaksi SPPD: {$transaction->judul}"
        );

        return redirect()->back()->with('success', 'Undangan berhasil diunggah.');
    }

    public function deleteFile(Request $request, $id)
    {
        $transaction = PdTransaction::findOrFail($id);
        $type = $request->input('type'); // 'undangan' or 'dokumentasi'
        
        if ($type === 'undangan') {
            if ($transaction->undangan_file) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($transaction->undangan_file);
                $transaction->update(['undangan_file' => null]);
            }
            ActivityLog::record('hapus', 'Perjalanan Dinas', "Menghapus berkas undangan pada transaksi SPPD: {$transaction->judul}");
        } elseif ($type === 'dokumentasi') {
            $pathToDelete = $request->input('path');
            $files = $transaction->dokumentasi_files ?? [];
            if (($key = array_search($pathToDelete, $files)) !== false) {
                unset($files[$key]);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($pathToDelete);
                $transaction->update(['dokumentasi_files' => array_values($files)]);
            }
            ActivityLog::record('hapus', 'Perjalanan Dinas', "Menghapus 1 foto dokumentasi pada transaksi SPPD: {$transaction->judul}");
        }

        return redirect()->back()->with('success', 'File berhasil dihapus.');
    }

    public function update(Request $request, PdTransaction $perjalanan_dina)
    {
        $validated = $request->validate([
            'sub_kegiatan_id' => 'required|exists:sub_kegiatans,id',
            'judul' => 'required|string|max:255',
            'wilayah' => 'required|string|max:255',
            'tanggal' => 'required|date',
            'personil' => 'required|array',
            'personil.*.nama' => 'required|string',
            'personil.*.nominal' => 'required|numeric|min:0',
            'undangan_file' => 'nullable|file|mimes:pdf|max:10240',
            'dokumentasi_files.*' => 'nullable|file|mimes:jpg,jpeg,png|max:10240',
        ]);

        $subKegiatan = SubKegiatan::findOrFail($validated['sub_kegiatan_id']);
        
        $totalTransaksiBaru = collect($validated['personil'])->sum('nominal');

        // Hitung total pagu dan total terpakai SELAIN transaksi ini
        $totalPagu = $subKegiatan->anggaran_murni_pd + $subKegiatan->anggaran_perubahan_pd;
        $totalTerpakaiLain = PdTransaction::where('sub_kegiatan_id', $subKegiatan->id)
                                ->where('id', '!=', $perjalanan_dina->id)
                                ->sum('total');
        
        $sisaAnggaran = $totalPagu - $totalTerpakaiLain;

        if ($sisaAnggaran < $totalTransaksiBaru) {
            return back()->withErrors([
                'anggaran' => 'Gagal mengubah: Anggaran Murni & Perubahan Perjalanan Dinas tidak mencukupi. Sisa tersedia: Rp ' . number_format($sisaAnggaran, 0, ',', '.'),
            ]);
        }

        $validated['total'] = $totalTransaksiBaru;
        $validated['tahun'] = $subKegiatan->tahun;

        if ($request->hasFile('undangan_file')) {
            if ($perjalanan_dina->undangan_file) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($perjalanan_dina->undangan_file);
            }
            $file = $request->file('undangan_file');
            $path = $file->store('undangan/pd', 'public');
            $validated['undangan_file'] = $path;
        }

        if ($request->hasFile('dokumentasi_files')) {
            $existingFiles = $perjalanan_dina->dokumentasi_files ?? [];
            foreach ($request->file('dokumentasi_files') as $file) {
                $path = $file->store('dokumentasi/pd', 'public');
                $existingFiles[] = $path;
            }
            $validated['dokumentasi_files'] = $existingFiles;
        }

        $perjalanan_dina->update($validated);

        ActivityLog::record(
            'ubah',
            'Perjalanan Dinas',
            "Memperbarui transaksi SPPD: {$perjalanan_dina->judul} ({$perjalanan_dina->wilayah}, " . count($perjalanan_dina->personil) . " orang) - Rp " . number_format($perjalanan_dina->total, 0, ',', '.'),
            ['sub_kegiatan' => $subKegiatan->nama, 'total' => $perjalanan_dina->total]
        );

        return redirect()->back()->with('success', 'Transaksi Perjalanan Dinas berhasil diperbarui.');
    }

    public function destroy(PdTransaction $perjalanan_dina)
    {
        $judul = $perjalanan_dina->judul;
        $total = $perjalanan_dina->total;

        $perjalanan_dina->delete();

        ActivityLog::record(
            'hapus',
            'Perjalanan Dinas',
            "Menghapus transaksi SPPD: {$judul} - Rp " . number_format($total, 0, ',', '.')
        );

        return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
    }
}
