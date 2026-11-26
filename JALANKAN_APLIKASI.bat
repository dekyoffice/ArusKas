@echo off
cd /d "%~dp0"
title Aplikasi Monitoring Anggaran Belanja (DPA, Makan Minum, Perjalanan Dinas)
color 0A

echo ============================================================================
echo         APLIKASI MONITORING DAN REKAPITULASI REALISASI ANGGARAN
echo ============================================================================
echo.
echo Sedang memeriksa lingkungan PHP...
where php >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] PHP tidak ditemukan di sistem ini!
    echo Silakan pastikan PHP versi 8.2 atau lebih baru sudah terinstal di komputer.
    echo Jika menggunakan XAMPP, tambahkan folder C:\xampp\php ke System PATH.
    echo.
    pause
    exit /b
)

echo [OK] PHP terdeteksi.
echo.
echo Sedang mendeteksi alamat IP komputer...
set IP_LOCAL=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    if not defined IP_LOCAL set IP_LOCAL=%%a
)
if defined IP_LOCAL (
    set IP_LOCAL=%IP_LOCAL: =%
) else (
    set IP_LOCAL=127.0.0.1
)

echo Sedang menyiapkan penyimpanan dan sesi aplikasi...
call php artisan view:clear >nul 2>nul
call php artisan route:clear >nul 2>nul

echo.
echo ============================================================================
echo  ALAMAT AKSES APLIKASI:
echo   - Dari Laptop / Komputer Ini : http://127.0.0.1:8000
echo   - Dari Handphone / HP (Wi-Fi): http://%IP_LOCAL%:8000
echo.
echo  [PERHATIAN PENTING]:
echo  Jika di bawah ini muncul tulisan "Server running on [http://0.0.0.0:8000]",
echo  JANGAN KLIK link 0.0.0.0 tersebut karena browser Chrome akan error (ERR_ADDRESS_INVALID)!
echo  Gunakan alamat: http://127.0.0.1:8000 untuk membuka di laptop ini.
echo.
echo  AKUN LOGIN DEFAULT:
echo  1. Administrator : username admin, password password
echo  2. Staff          : username staff, password staff123
echo  3. Viewer         : username viewer, password viewer123
echo.
echo  JANGAN TUTUP JENDELA INI SELAMA APLIKASI SEDANG DIGUNAKAN!
echo  Untuk mematikan aplikasi, tekan tombol [CTRL + C] di jendela ini.
echo ============================================================================
echo.

echo Membuka browser default...
start http://127.0.0.1:8000
php artisan serve --host=0.0.0.0 --port=8000

echo.
echo Server telah dimatikan.
pause
