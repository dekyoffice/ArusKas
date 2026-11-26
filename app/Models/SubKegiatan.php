<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubKegiatan extends Model
{
    protected $table = 'sub_kegiatans';

    protected $fillable = [
        'nama',
        'anggaran_murni_pd',
        'anggaran_perubahan_pd',
        'anggaran_murni_mm',
        'anggaran_perubahan_mm',
        'target_rapat',
        'target_rapat_besar',
        'tahun',
        'created_by',
    ];

    protected $casts = [
        'anggaran_murni_pd' => 'decimal:2',
        'anggaran_perubahan_pd' => 'decimal:2',
        'anggaran_murni_mm' => 'decimal:2',
        'anggaran_perubahan_mm' => 'decimal:2',
        'target_rapat' => 'integer',
        'target_rapat_besar' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function pdTransactions(): HasMany
    {
        return $this->hasMany(PdTransaction::class, 'sub_kegiatan_id');
    }

    public function mmTransactions(): HasMany
    {
        return $this->hasMany(MmTransaction::class, 'sub_kegiatan_id');
    }
}
