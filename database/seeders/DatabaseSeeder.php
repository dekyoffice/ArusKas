<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::create([
            'name' => 'Administrator',
            'username' => 'admin',
            'role' => 'admin',
            'password' => bcrypt('password'),
        ]);

        // Buat akun Staff contoh
        User::create([
            'name' => 'Staff Magang',
            'username' => 'staff',
            'email' => null,
            'password' => Hash::make('staff123'),
            'role' => 'staff',
        ]);

        // Buat akun Viewer contoh
        User::create([
            'name' => 'Pimpinan',
            'username' => 'viewer',
            'email' => null,
            'password' => Hash::make('viewer123'),
            'role' => 'viewer',
        ]);
    }
}
