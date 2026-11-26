<?php

namespace App\Http\Controllers;

use App\Models\DpaFile;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DpaFileController extends Controller
{
    public function index(Request $request)
    {
        $year = session('selected_year', date('Y'));

        $dpaFiles = DpaFile::where('tahun', $year)
                           ->orderBy('created_at', 'desc')
                           ->get()
                           ->map(function ($file) {
                               return [
                                   'id' => $file->id,
                                   'name' => $file->name,
                                   'file_path' => Storage::url($file->file_path),
                                   'size' => $file->size,
                                   'jenis' => $file->jenis,
                                   'tahun' => $file->tahun,
                                   'uploaded_at' => $file->created_at,
                               ];
                           });

        return Inertia::render('Dpa/Index', [
            'selectedYear' => (int) $year,
            'dpaFiles' => $dpaFiles,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'required|file|mimes:pdf|max:10240', // max 10MB per file
            'jenis' => 'required|in:murni,perubahan',
            'tahun' => 'required|integer',
        ]);

        $year = $request->input('tahun');
        $jenis = $request->input('jenis');

        $uploadedNames = [];
        foreach ($request->file('files') as $file) {
            $path = $file->store('dpa_files/' . $year, 'public');
            $originalName = $file->getClientOriginalName();

            DpaFile::create([
                'name' => $originalName,
                'file_path' => $path,
                'size' => $file->getSize(),
                'jenis' => $jenis,
                'tahun' => $year,
                'uploaded_by' => Auth::id(),
            ]);

            $uploadedNames[] = $originalName;
        }

        $count = count($uploadedNames);
        $jenisLabel = $jenis === 'murni' ? 'DPA Murni' : 'DPA Perubahan';
        if ($count === 1) {
            $desc = "Mengunggah dokumen {$jenisLabel} ({$year}): {$uploadedNames[0]}";
        } else {
            $desc = "Mengunggah {$count} dokumen {$jenisLabel} ({$year}): " . implode(', ', array_slice($uploadedNames, 0, 3)) . ($count > 3 ? " dan " . ($count - 3) . " lainnya" : "");
        }

        ActivityLog::record(
            'tambah',
            'DPA',
            $desc
        );

        return redirect()->back()->with('success', 'File DPA berhasil diunggah.');
    }

    public function destroy(DpaFile $dpa)
    {
        $fileName = $dpa->name;
        // Hapus dari storage
        if (Storage::disk('public')->exists($dpa->file_path)) {
            Storage::disk('public')->delete($dpa->file_path);
        }

        $dpa->delete();

        ActivityLog::record(
            'hapus',
            'DPA',
            "Menghapus dokumen DPA: {$fileName}"
        );

        return redirect()->back()->with('success', 'File DPA berhasil dihapus.');
    }

    public function destroyBulk(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|integer|exists:dpa_files,id',
        ]);

        $files = DpaFile::whereIn('id', $request->ids)->get();
        $count = $files->count();

        foreach ($files as $file) {
            if (Storage::disk('public')->exists($file->file_path)) {
                Storage::disk('public')->delete($file->file_path);
            }
            $file->delete();
        }

        ActivityLog::record(
            'hapus',
            'DPA',
            "Menghapus massal {$count} dokumen DPA"
        );

        return redirect()->back()->with('success', "{$count} file DPA berhasil dihapus.");
    }
}
