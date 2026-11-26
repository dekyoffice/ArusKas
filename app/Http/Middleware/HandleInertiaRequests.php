<?php

namespace App\Http\Middleware;

use App\Models\AppSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $availableYears = AppSetting::getAvailableYears();
        $sessionYear = (int) session('selected_year', date('Y'));
        $selectedYear = in_array($sessionYear, $availableYears) ? $sessionYear : ($availableYears[0] ?? (int)date('Y'));

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'selectedYear' => $selectedYear,
            'availableYears' => $availableYears,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
