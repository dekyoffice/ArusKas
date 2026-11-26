<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sub_kegiatans', function (Blueprint $table) {
            $table->integer('target_rapat')->default(0)->after('anggaran_perubahan_mm');
            $table->integer('target_rapat_besar')->default(0)->after('target_rapat');
        });

        Schema::table('mm_transactions', function (Blueprint $table) {
            $table->enum('jenis_rapat', ['biasa', 'besar'])->default('biasa')->after('tanggal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sub_kegiatans', function (Blueprint $table) {
            $table->dropColumn(['target_rapat', 'target_rapat_besar']);
        });

        Schema::table('mm_transactions', function (Blueprint $table) {
            $table->dropColumn('jenis_rapat');
        });
    }
};
