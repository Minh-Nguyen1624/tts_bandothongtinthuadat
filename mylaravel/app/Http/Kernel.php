<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack.
     *
     * @var array<int, class-string|string>
     */
    /**
     * The application's route middleware groups.
     *
     * @var array<string, array<int, class-string|string>>
     */
    protected $middlewareGroups = [
        // dùng cho các route web, có session, cookie, CSRF protection.
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],

        // dùng cho route API, thường stateless (không session)
        'api' => [
            \App\Http\Middleware\HandleCors::class, // xử lý CORS (cho phép request từ domain khác)
            // 
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, // hỗ trợ frontend với Sanctum (nếu có).
            'throttle:api', // hạn chế số request (rate limit).
            \Illuminate\Routing\Middleware\SubstituteBindings::class, // xử lý route model binding.
        ],
    ];

    /**
     * The application's middleware aliases.
     *
     * @var array<string, class-string|string>
     */
    protected $middlewareAliases = [
        'auth' => \App\Http\Middleware\Authenticate::class,
        'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
        'auth.session' => \Illuminate\Session\Middleware\AuthenticateSession::class,
        'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
        'can' => \Illuminate\Auth\Middleware\Authorize::class,
        'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
        'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
        'signed' => \App\Http\Middleware\ValidateSignature::class,
        'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,

        // Custom middlewares - SỬ DỤNG TÊN ĐƠN GIẢN
        'jwt.auth' => \PHPOpenSourceSaver\JWTAuth\Http\Middleware\Authenticate::class,
        'admin.middleware' => \App\Http\Middleware\AdminMiddleware::class,
    ];
}