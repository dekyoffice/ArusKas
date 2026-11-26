<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MmTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'mm_transactions';

    protected $fillable = [
        'sub_kegiatan_id',
        'judul',
        'tanggal',
        'jenis_rapat',
        'qty_snack',
        'qty_nasi',
        'base_harga',
        'pajak',
        'pph',
        'grand_total',
        'tahun',
        'user_id',
        'undangan_file',
        'dokumentasi_files',
    ];

    protected $casts = [
        'base_harga' => 'decimal:2',
        'pajak' => 'decimal:2',
        'pph' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'tanggal' => 'date',
        'dokumentasi_files' => 'array',
    ];

    public function subKegiatan(): BelongsTo
    {
        return $this->belongsTo(SubKegiatan::class, 'sub_kegiatan_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
