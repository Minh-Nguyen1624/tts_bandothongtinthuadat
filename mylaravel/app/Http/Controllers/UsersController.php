<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UsersController extends Controller
{
    public function index() // index() → GET
    {
        try {
            \Log::info('Test user index route called');
            $users = User::with(['unit', 'team'])->get();
            return response()->json(['data' => $users], 200);
        } catch (\Exception $e) {
            \Log::error('Test error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            // Validate dữ liệu đầu vào (email unique, password >= 8, role/status hợp lệ...).
            $validator = Validator::make($request->all(), [
               'name' => 'required|string|max:255',
                'first_name' => 'nullable|string|max:100',
                'last_name' => 'nullable|string|max:100',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'unit_id' => 'nullable|exists:units,id',
                'team_id' => 'nullable|exists:teams,id',
                'avatar' => 'nullable|url',
                'role' => 'required|in:user,admin,manager',
                'status' => 'required|in:active,inactive,suspended',
                'date_of_birth' => 'nullable|date',
                'address' => 'nullable|string',
                'gender' => 'nullable|in:male,female,other',
                'phone' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            // Nếu hợp lệ → tạo user mới.
            // Password được hash bằng Hash::make().
            $user = User::create([
                'name' => $request->name,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'unit_id' => $request->unit_id,
                'team_id' => $request->team_id,
                'avatar' => $request->avatar,
                'role' => $request->role,
                'status' => $request->status,
                'date_of_birth' => $request->date_of_birth,
                'address' => $request->address,
                'gender' => $request->gender,
                'phone' => $request->phone,
            ]);

            // Load relationships để trả về đầy đủ thông tin. Nạp thêm dữ liệu quan hệ để trả về đầy đủ.
            $user->load(['unit', 'team']);

            return response()->json(['message' => 'User created successfully', 'data' => $user], 201);
        } catch (\Exception $e) {
            \Log::error('Test error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(string $id) // show($id) → GET /users/{id}
    {
       try {
            // Mục đích: xem chi tiết 1 user.
            $user = User::with(['unit', 'team'])->findOrFail($id);
            return response()->json(['success' => true, 'message' => 'User retrieved successfully' , 'data' => $user], 200);
       } catch (\Exception $e) {
            \Log::error('Test error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()],500);
       }
    }

    public function update(Request $request, string $id) // update($id) → PUT/PATCH /users/{id}
    {
        try {
            // Tìm user theo ID, khi mình cập nhật
            $user = User::findOrFail($id);
            // Validate dữ liệu update (email phải unique trừ chính user hiện tại).
            $validator = Validator::make($request->all(), [
                'name'        => 'nullable|string|max:255',
                'first_name'  => 'nullable|string|max:100',
                'last_name'   => 'nullable|string|max:100', 
                'email'       => 'nullable|email|unique:users,email,' . $id, // bỏ khoảng trắng + thêm $id để bỏ qua user hiện tại
                'password'    => 'nullable|string|min:8',
                'unit_id'     => 'nullable|exists:units,id',
                'team_id'     => 'nullable|exists:teams,id',
                'avatar'      => 'nullable|url',
                'role'        => 'nullable|in:user,admin,manager',
                'status'      => 'nullable|in:active,inactive,suspended', // bỏ khoảng trắng thừa
                'date_of_birth'=> 'nullable|date',
                'address'     => 'nullable|string',
                'gender'      => 'nullable|in:male,female,other',
                'phone'       => 'nullable|string',
            ]);

            if($validator->fails()){
                return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
            }

            $validatedData = $validator->validate();

            // Nếu update password → hash lại trước khi lưu.
            if (isset($validatedData['password'])) {
                $validatedData['password'] = Hash::make($validatedData['password']);
            }

            // Cập nhật thông tin và trả lại user.
            $user->update($validatedData);
            $user->load(['unit', 'team']); // Load relationships

            return response()->json(['success' => true, 'message' => 'User updated successfully', 'data' => $user], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }

        
    }

    public function destroy(string $id) // destroy($id) → DELETE /users/{id}
    {
        try{
            // Tìm user theo ID
            $user = User::findOrFail($id); 
            $user->delete(); 
            return response()->json(['success'=> true, 'message' => 'User deleted successfully'],200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}