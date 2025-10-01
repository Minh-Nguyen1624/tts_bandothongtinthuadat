<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        Log::info('🎯 AdminMiddleware bắt đầu chạy');
        Log::info('📝 URL: ' . $request->fullUrl());
        Log::info('🔧 Method: ' . $request->method());

        // Kiểm tra authentication
        if (!Auth::guard('api')->check()) {
            Log::warning('❌ Không có user đã xác thực');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user = Auth::guard('api')->user();

        Log::info('👤 Thông tin user:', [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role
        ]);

        // Kiểm tra role admin
        if ($user->role !== 'admin') {
            Log::warning('🚫 User không phải admin', [
                'user_id' => $user->id,
                'role_hiện_tại' => $user->role,
                'role_yêu_cầu' => 'admin'
            ]);
            return response()->json(['message' => 'Forbidden. Admins only.'], 403);
        }

        Log::info('✅ User là admin - Cho phép truy cập');
        return $next($request);
    }
}