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
        Schema::table('pd_transactions', function (Blueprint $table) {
            $table->dropColumn('dokumentasi_file');
            $table->json('dokumentasi_files')->nullable();
        });

        Schema::table('mm_transactions', function (Blueprint $table) {
            $table->dropColumn('dokumentasi_file');
            $table->json('dokumentasi_files')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pd_transactions', function (Blueprint $table) {
            $table->dropColumn('dokumentasi_files');
            $table->string('dokumentasi_file')->nullable();
        });

        Schema::table('mm_transactions', function (Blueprint $table) {
            $table->dropColumn('dokumentasi_files');
            $table->string('dokumentasi_file')->nullable();
        });
    }
};
