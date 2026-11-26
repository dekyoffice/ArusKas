<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SubKegiatanController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\PdTransactionController;
use App\Http\Controllers\MmTransactionController;
use App\Http\Controllers\DpaFileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\ActivityLogController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth'])->group(function () {
    // User Session Settings (all authenticated users can select active year)
    Route::post('/settings/year', [SettingsController::class, 'setYear'])->name('settings.year');
    
    // Read-only Pages (Dashboard, Index, Monitoring, Export) accessible by Admin, Staff, & Viewer
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/sub-kegiatan', [SubKegiatanController::class, 'index'])->name('sub-kegiatan.index');
    Route::get('/monitoring', [MonitoringController::class, 'index'])->name('monitoring.index');
    Route::get('/perjalanan-dinas', [PdTransactionController::class, 'index'])->name('perjalanan-dinas.index');
    Route::get('/makan-minum', [MmTransactionController::class, 'index'])->name('makan-minum.index');
    Route::get('/dpa', [DpaFileController::class, 'index'])->name('dpa.index');
    Route::get('/export/excel', [ExportController::class, 'excel'])->name('export.excel');
    Route::get('/export/pdf', [ExportController::class, 'pdf'])->name('export.pdf');

    // Mutating Actions (POST, PUT, PATCH, DELETE) - Protected against Viewer role (OWASP A01 Broken Access Control)
    Route::middleware([\App\Http\Middleware\EnsureNotViewer::class])->group(function () {
        Route::post('/sub-kegiatan', [SubKegiatanController::class, 'store'])->name('sub-kegiatan.store');
        Route::put('/sub-kegiatan/{subKegiatan}', [SubKegiatanController::class, 'update'])->name('sub-kegiatan.update');
        Route::delete('/sub-kegiatan/{subKegiatan}', [SubKegiatanController::class, 'destroy'])->name('sub-kegiatan.destroy');

        Route::patch('/monitoring/subkegiatan/{id}/target', [MonitoringController::class, 'updateTarget'])->name('monitoring.target.update');

        Route::post('/perjalanan-dinas', [PdTransactionController::class, 'store'])->name('perjalanan-dinas.store');
        Route::match(['put', 'patch', 'post'], '/perjalanan-dinas/{perjalanan_dina}', [PdTransactionController::class, 'update'])->name('perjalanan-dinas.update');
        Route::delete('/perjalanan-dinas/{perjalanan_dina}', [PdTransactionController::class, 'destroy'])->name('perjalanan-dinas.destroy');
        Route::post('/perjalanan-dinas/{id}/upload-dokumentasi', [PdTransactionController::class, 'uploadDokumentasi'])->name('perjalanan-dinas.upload-dokumentasi');
        Route::post('/perjalanan-dinas/{id}/upload-undangan', [PdTransactionController::class, 'uploadUndangan'])->name('perjalanan-dinas.upload-undangan');
        Route::post('/perjalanan-dinas/{id}/delete-file', [PdTransactionController::class, 'deleteFile'])->name('perjalanan-dinas.delete-file');

        Route::post('/makan-minum', [MmTransactionController::class, 'store'])->name('makan-minum.store');
        Route::match(['put', 'patch', 'post'], '/makan-minum/{makan_minum}', [MmTransactionController::class, 'update'])->name('makan-minum.update');
        Route::delete('/makan-minum/{makan_minum}', [MmTransactionController::class, 'destroy'])->name('makan-minum.destroy');
        Route::post('/makan-minum/{id}/upload-dokumentasi', [MmTransactionController::class, 'uploadDokumentasi'])->name('makan-minum.upload-dokumentasi');
        Route::post('/makan-minum/{id}/upload-undangan', [MmTransactionController::class, 'uploadUndangan'])->name('makan-minum.upload-undangan');
        Route::post('/makan-minum/{id}/delete-file', [MmTransactionController::class, 'deleteFile'])->name('makan-minum.delete-file');

        Route::post('/dpa', [DpaFileController::class, 'store'])->name('dpa.store');
        Route::delete('/dpa/bulk-delete', [DpaFileController::class, 'destroyBulk'])->name('dpa.destroy-bulk');
        Route::delete('/dpa/{dpa}', [DpaFileController::class, 'destroy'])->name('dpa.destroy');

        Route::post('/settings/pricing', [SettingsController::class, 'updateHargaMakanMinum'])->name('settings.pricing.update');
    });
});

// Admin Only Routes (User Management & Year Configuration & Audit Trail)
Route::middleware(['auth', \App\Http\Middleware\AdminMiddleware::class])->group(function () {
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
    Route::post('/settings/year/add', [SettingsController::class, 'addYear'])->name('settings.year.add');
    Route::post('/settings/year/delete', [SettingsController::class, 'deleteYear'])->name('settings.year.delete');
    Route::resource('users', UserController::class)->except(['create', 'show', 'edit']);
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
