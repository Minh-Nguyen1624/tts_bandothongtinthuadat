<?php

namespace App\Http\Middleware;

use Closure; // để gọi tới request
use Illuminate\Http\Request; // dữ liệu request gửi vào.
use Symfony\Component\HttpFoundation\Response; // kiểu trả về.
use Illuminate\Support\Facades\Log; // ghi log.
use Illuminate\Support\Facades\Auth; // check user đăng nhập qua guard.

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    // Middleware chạy trước khi controller xử lý request.
    {
        Log::info('🎯 AdminMiddleware bắt đầu chạy');
        Log::info('📝 URL: ' . $request->fullUrl());
        Log::info('🔧 Method: ' . $request->method());

        // Nếu chưa login (JWT không hợp lệ / không có token) → trả 401 Unauthorized.
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

        // Kiểm tra role admin Nếu role khác admin → chặn lại, trả về 403 Forbidden.
        if ($user->role !== 'admin') {
            Log::warning('🚫 User không phải admin', [
                'user_id' => $user->id,
                'role_hiện_tại' => $user->role,
                'role_yêu_cầu' => 'admin'
            ]);
            return response()->json(['message' => 'Forbidden. Admins only.'], 403);
        }

        // Nếu user là admin → cho request đi tiếp xuống Controller.
        Log::info('✅ User là admin - Cho phép truy cập');
        return $next($request);
    }
}