<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SubKegiatan;
use App\Models\PdTransaction;
use App\Models\MmTransaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Response;

class ExportController extends Controller
{
    public function excel(Request $request)
    {
        $year = session('selected_year', date('Y'));
        
        $subKegiatans = SubKegiatan::where('tahun', $year)->get();
        $pdTransactions = PdTransaction::where('tahun', $year)->get();
        $mmTransactions = MmTransaction::where('tahun', $year)->get();

        $subKegiatanStats = $subKegiatans->map(function ($sk) use ($pdTransactions, $mmTransactions) {
            $pdPagu = $sk->anggaran_murni_pd + $sk->anggaran_perubahan_pd;
            $pdRealisasi = $pdTransactions->where('sub_kegiatan_id', $sk->id)->sum('total');
            $pdSisa = max(0, $pdPagu - $pdRealisasi);

            $mmPagu = $sk->anggaran_murni_mm + $sk->anggaran_perubahan_mm;
            $mmRealisasi = $mmTransactions->where('sub_kegiatan_id', $sk->id)->sum('grand_total');
            $mmSisa = max(0, $mmPagu - $mmRealisasi);

            return [
                'nama' => $sk->nama,
                'pdPagu' => $pdPagu,
                'pdRealisasi' => $pdRealisasi,
                'pdSisa' => $pdSisa,
                'mmPagu' => $mmPagu,
                'mmRealisasi' => $mmRealisasi,
                'mmSisa' => $mmSisa,
            ];
        });

        $headers = [
            "Content-type"        => "application/vnd.ms-excel",
            "Content-Disposition" => "attachment; filename=Laporan_Anggaran_{$year}.xls",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $html = view('exports.excel', [
            'year' => $year,
            'stats' => $subKegiatanStats,
        ])->render();

        return Response::make($html, 200, $headers);
    }

    public function pdf(Request $request)
    {
        $year = session('selected_year', date('Y'));
        
        $subKegiatans = SubKegiatan::where('tahun', $year)->get();
        $pdTransactions = PdTransaction::where('tahun', $year)->get();
        $mmTransactions = MmTransaction::where('tahun', $year)->get();

        $subKegiatanStats = $subKegiatans->map(function ($sk) use ($pdTransactions, $mmTransactions) {
            $pdPagu = $sk->anggaran_murni_pd + $sk->anggaran_perubahan_pd;
            $pdRealisasi = $pdTransactions->where('sub_kegiatan_id', $sk->id)->sum('total');
            $pdSisa = max(0, $pdPagu - $pdRealisasi);

            $mmPagu = $sk->anggaran_murni_mm + $sk->anggaran_perubahan_mm;
            $mmRealisasi = $mmTransactions->where('sub_kegiatan_id', $sk->id)->sum('grand_total');
            $mmSisa = max(0, $mmPagu - $mmRealisasi);

            return [
                'nama' => $sk->nama,
                'pdPagu' => $pdPagu,
                'pdRealisasi' => $pdRealisasi,
                'pdSisa' => $pdSisa,
                'mmPagu' => $mmPagu,
                'mmRealisasi' => $mmRealisasi,
                'mmSisa' => $mmSisa,
            ];
        });

        $pdf = Pdf::loadView('exports.pdf', [
            'year' => $year,
            'stats' => $subKegiatanStats,
        ]);

        return $pdf->download("Laporan_Anggaran_{$year}.pdf");
    }
}
