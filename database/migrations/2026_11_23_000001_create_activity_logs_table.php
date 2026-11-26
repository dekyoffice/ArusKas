<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name')->nullable();
            $table->string('user_role')->nullable();
            $table->string('action'); // tambah, ubah, hapus, kurangi_pagu, login, logout
            $table->string('module'); // Sub Kegiatan, Makan Minum, Perjalanan Dinas, DPA, Manajemen Pengguna, Pengaturan
            $table->text('description'); // Penjelasan ringkas aktivitas
            $table->json('details')->nullable(); // Metadata perubahan (sebelum & sesudah bila ada)
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
