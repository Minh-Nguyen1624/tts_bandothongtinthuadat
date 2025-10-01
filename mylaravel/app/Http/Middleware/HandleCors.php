<?php

//Middleware này dùng để xử lý CORS (Cross-Origin Resource Sharing), 
// cho phép các ứng dụng frontend (React, Vue, Angular, Postman, v.v.) gọi API từ domain khác (không bị chặn bởi trình duyệt)

namespace App\Http\Middleware;

use Closure;// Closure $next đại diện cho middleware tiếp theo hoặc controller sẽ chạy tiếp.
use Illuminate\Http\Request;

class HandleCors
{
    public function handle(Request $request, Closure $next)
    {
        // Nếu là preflight OPTIONS request
        // Khi trình duyệt gửi preflight request (OPTIONS) để kiểm tra quyền CORS, middleware trả về luôn (204 No Content).
        // Thêm header CORS:
            // Access-Control-Allow-Origin: cho phép domain nào gọi API (* = tất cả).
            // Allow-Methods: danh sách phương thức API được phép.
            // Allow-Headers: các header client được phép gửi (Content-Type, Authorization,...).
            // Allow-Credentials: cho phép gửi cookie/token kèm request.
        if ($request->getMethod() === "OPTIONS") {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', $request->headers->get('Origin') ?: '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        $response = $next($request);

        // Thêm headers cho tất cả response khác
        // Nếu không phải OPTIONS, thì request tiếp tục chạy ($next($request)) đến controller.
        // Sau đó thêm các header CORS vào response trả về.
        return $response
            ->header('Access-Control-Allow-Origin', $request->headers->get('Origin') ?: '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->header('Access-Control-Allow-Credentials', 'true');
    }
}
