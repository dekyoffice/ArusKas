<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $table = 'app_settings';

    protected $fillable = ['key', 'value'];

    public static function getAvailableYears(): array
    {
        $setting = self::where('key', 'available_years')->first();
        if ($setting && $setting->value) {
            $years = json_decode($setting->value, true);
            if (is_array($years) && count($years) > 0) {
                $years = array_values(array_map('intval', $years));
                sort($years);
                return $years;
            }
        }
        return [2025, 2026, 2027];
    }

    public static function setAvailableYears(array $years): void
    {
        $years = array_values(array_unique(array_map('intval', $years)));
        sort($years);
        self::updateOrCreate(
            ['key' => 'available_years'],
            ['value' => json_encode($years)]
        );
    }

    public static function addNextYear(): int
    {
        $years = self::getAvailableYears();
        $nextYear = count($years) > 0 ? max($years) + 1 : (int)date('Y');
        $years[] = $nextYear;
        self::setAvailableYears($years);
        return $nextYear;
    }

    public static function removeYear(int $year): array
    {
        $years = self::getAvailableYears();
        $years = array_values(array_filter($years, fn($y) => (int)$y !== (int)$year));
        if (empty($years)) {
            $years = [(int)date('Y')];
        }
        self::setAvailableYears($years);
        return $years;
    }

    /**
     * Mendapatkan tarif harga satuan Makan Minum default
     */
    public static function getHargaMakanMinum(): array
    {
        $snackSetting = self::where('key', 'harga_snack_box')->first();
        $nasiSetting = self::where('key', 'harga_nasi_kotak')->first();

        $snackPrice = $snackSetting && is_numeric($snackSetting->value) ? (float)$snackSetting->value : 15400.0;
        $nasiPrice = $nasiSetting && is_numeric($nasiSetting->value) ? (float)$nasiSetting->value : 46300.0;

        return [
            'snack_price' => $snackPrice,
            'nasi_price' => $nasiPrice,
        ];
    }

    /**
     * Menyimpan perubahan tarif harga satuan Makan Minum
     */
    public static function setHargaMakanMinum(float $snackPrice, float $nasiPrice): void
    {
        self::updateOrCreate(
            ['key' => 'harga_snack_box'],
            ['value' => (string)$snackPrice]
        );
        self::updateOrCreate(
            ['key' => 'harga_nasi_kotak'],
            ['value' => (string)$nasiPrice]
        );
    }
}
