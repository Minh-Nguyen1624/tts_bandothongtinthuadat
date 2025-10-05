<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens; // HasApiTokens: dùng cho API token (Sanctum).
use Illuminate\Database\Eloquent\Factories\HasFactory; // HasFactory: cho phép tạo dữ liệu mẫu (factory).
use Illuminate\Foundation\Auth\User as Authenticatable; // Authenticatable: kế thừa để làm model User có thể đăng nhập.
use Illuminate\Notifications\Notifiable; // Notifiable: gửi thông báo (email, SMS...).
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject; // JWTSubject: bắt buộc nếu dùng JWT Auth.

/**
 * @mixin IdeHelperUser
 */
class User extends Authenticatable implements JWTSubject
{
    use HasApiTokens, HasFactory, Notifiable;

    // Các trường được phép gán hàng loạt (mass assignment).
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'email',
        'password',
        'unit_id',
        'team_id',
        'avatar',
        'role',
        'status',
        'date_of_birth',
        'address',
        'gender',
        'phone'
    ];

    // Khi trả JSON, ẩn password + token đi.
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Quy đổi kiểu dữ liệu:
    // email_verified_at → DateTime object.
    // password → tự động hash khi set.
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Một User thuộc về 1 Unit
    public function unit(){
        return $this->belongsTo(Unit::class);
    }

    // Một User thuộc về 1 Team
    public function team(){
        return $this->belongsTo(Teams::class);
    }

    public function landPlots(){
        return $this->hasMany(land_plots::class, 'user_id');
    }

    // JWT dùng id user làm identifier.
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }
}
