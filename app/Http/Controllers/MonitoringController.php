<?php

namespace App\Http\Controllers;

use App\Models\SubKegiatan;
use App\Models\MmTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MonitoringController extends Controller
{
    public function index(Request $request)
    {
        $year = session('selected_year', date('Y'));

        $subKegiatans = SubKegiatan::where('tahun', $year)->get();
        
        $mmTransactions = MmTransaction::where('tahun', $year)
                            ->with('subKegiatan')
                            ->get();

        return Inertia::render('Monitoring/Index', [
            'selectedYear' => (int) $year,
            'subKegiatans' => $subKegiatans,
            'mmTransactions' => $mmTransactions,
        ]);
    }

    public function updateTarget(Request $request, $id)
    {
        $validated = $request->validate([
            'target_rapat' => 'required|integer|min:0',
            'target_rapat_besar' => 'required|integer|min:0',
        ]);

        $subKegiatan = SubKegiatan::findOrFail($id);
        
        $subKegiatan->update([
            'target_rapat' => $validated['target_rapat'],
            'target_rapat_besar' => $validated['target_rapat_besar'],
        ]);

        return redirect()->back()->with('success', 'Target rapat berhasil diperbarui.');
    }
}
