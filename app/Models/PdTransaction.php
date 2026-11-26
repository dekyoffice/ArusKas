<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PdTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'pd_transactions';

    protected $fillable = [
        'sub_kegiatan_id',
        'judul',
        'wilayah',
        'tanggal',
        'personil',
        'total',
        'tahun',
        'user_id',
        'undangan_file',
        'dokumentasi_files',
    ];

    protected $casts = [
        'personil' => 'array',
        'total' => 'decimal:2',
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
