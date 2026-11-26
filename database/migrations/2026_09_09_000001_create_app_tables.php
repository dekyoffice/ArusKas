<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sub_kegiatans', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->decimal('anggaran_murni_pd', 15, 2)->default(0);
            $table->decimal('anggaran_perubahan_pd', 15, 2)->default(0);
            $table->decimal('anggaran_murni_mm', 15, 2)->default(0);
            $table->decimal('anggaran_perubahan_mm', 15, 2)->default(0);
            $table->integer('tahun')->default(2026);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('pd_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_kegiatan_id')->constrained('sub_kegiatans')->cascadeOnDelete();
            $table->string('judul');
            $table->string('wilayah')->nullable();
            $table->date('tanggal');
            $table->json('personil')->nullable();
            $table->decimal('total', 15, 2)->default(0);
            $table->integer('tahun')->default(2026);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('mm_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_kegiatan_id')->constrained('sub_kegiatans')->cascadeOnDelete();
            $table->string('judul');
            $table->date('tanggal');
            $table->integer('qty_snack')->default(0);
            $table->integer('qty_nasi')->default(0);
            $table->decimal('base_harga', 15, 2)->default(0);
            $table->decimal('pajak', 15, 2)->default(0);
            $table->decimal('pph', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->integer('tahun')->default(2026);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('dpa_files', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('file_path');
            $table->integer('size')->default(0);
            $table->enum('jenis', ['murni', 'perubahan'])->default('murni');
            $table->integer('tahun')->default(2026);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dpa_files');
        Schema::dropIfExists('mm_transactions');
        Schema::dropIfExists('pd_transactions');
        Schema::dropIfExists('sub_kegiatans');
    }
};
