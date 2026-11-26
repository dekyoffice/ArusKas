<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Security headers middleware to address OWASP ZAP findings.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // [ZAP] Content Security Policy (CSP) Header Not Set
        $csp = $this->buildCsp();
        if (!empty($csp)) {
            $response->headers->set('Content-Security-Policy', $csp);
        }

        // [ZAP] Missing Anti-clickjacking Header
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // [ZAP] X-Content-Type-Options Header Missing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // [ZAP] Server Leaks Information via "X-Powered-By" HTTP Response
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('server');

        // Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // X-XSS-Protection
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Strict Transport Security (untuk HTTPS di production)
        if (!app()->environment('local')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }

    private function buildCsp(): string
    {
        // Di development (local), matikan CSP sementara karena sering memblokir port Vite HMR (terutama jika port berubah otomatis).
        if (app()->environment('local')) {
            return '';
        }

        // Di production, gunakan CSP yang aman namun mendukung React & Inertia (Ziggy @routes)
        $directives = [
            "default-src"     => "'self'",
            "script-src"      => "'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src"       => "'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.bunny.net",
            "font-src"        => "'self' https://fonts.gstatic.com https://fonts.bunny.net data:",
            "img-src"         => "'self' data: blob:",
            "connect-src"     => "'self' http: ws: https:",
            "frame-src"       => "'self' blob: data:",
            "frame-ancestors" => "'self'",
            "object-src"      => "'self' blob: data:",
            "base-uri"        => "'self'",
            "form-action"     => "'self'",
        ];

        $parts = [];
        foreach ($directives as $directive => $value) {
            $parts[] = "{$directive} {$value}";
        }

        return implode('; ', $parts);
    }
}
