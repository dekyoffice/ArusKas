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
            $table->string('undangan_file')->nullable();
            $table->string('dokumentasi_file')->nullable();
        });

        Schema::table('mm_transactions', function (Blueprint $table) {
            $table->string('undangan_file')->nullable();
            $table->string('dokumentasi_file')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pd_transactions', function (Blueprint $table) {
            $table->dropColumn(['undangan_file', 'dokumentasi_file']);
        });

        Schema::table('mm_transactions', function (Blueprint $table) {
            $table->dropColumn(['undangan_file', 'dokumentasi_file']);
        });
    }
};
