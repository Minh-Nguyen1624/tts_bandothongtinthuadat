<?php

namespace App\Http\Controllers; //Xác định lớp AuthController nằm trong App/Http/Controllers để Laravel biết vị trí.

use Illuminate\Http\Request; // Import lớp Request để nhận dữ liệu từ client (POST/GET/...).
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth; //Import JWTAuth – thư viện dùng để tạo và xử lý JSON Web Token (JWT) trong Laravel.
use Illuminate\Support\Facades\Validator; // Import Validator để kiểm tra dữ liệu đầu vào.


class AuthController extends Controller //AuthController kế thừa từ Controller (class cha của Laravel).
{ 
    public function login(Request $request) // Nhận request từ client khi gọi API POST /login.
    {
        // kiểm tra dữ liệu request:
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:8',
        ]);

        // Trả về lỗi dạng JSON với mã HTTP 422 (Unprocessable Entity).
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Lấy đúng 2 trường email và password từ request.
        $credentials = $request->only('email', 'password');

        // Sử dụng guard 'api' thống nhất
        if (! $token = JWTAuth::attempt($credentials)) { // JWTAuth::attempt($credentials) kiểm tra email + password có đúng trong DB không.
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Nếu đăng nhập thành công, gọi hàm respondWithToken() để trả JWT token kèm thông tin user
        return $this->respondWithToken($token);
    }

    public function logout()
    {
        try {
           JWTAuth::invalidate(JWTAuth::getToken()); //JWTAuth::invalidate() vô hiệu hóa token đó (ngăn tái sử dụng)
            return response()->json(['message' => 'Successfully logged out']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to logout'], 500);
        }
    }

    public function me()
    {
        // Sử dụng guard 'api' thống nhất
        return response()->json(auth('api')->user());
    }

    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token, // token JWT được tạo.
            'token_type' => 'bearer', // luôn là "bearer" (chuẩn xác thực).
            'expires_in' => JWTAuth::factory()->getTTL() * 60, 
            'user' => auth('api')->user() //thông tin user hiện tại.
        ]);
    }
}