<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotViewer
{
    /**
     * Handle an incoming request.
     * Enforce OWASP A01: Broken Access Control mitigation.
     * Blocks users with 'viewer' role from executing mutating actions (POST, PUT, PATCH, DELETE).
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->role === 'viewer') {
            abort(403, 'Akses ditolak: Akun Viewer hanya memiliki hak baca (read-only) dan tidak diizinkan mengubah data.');
        }

        return $next($request);
    }
}
