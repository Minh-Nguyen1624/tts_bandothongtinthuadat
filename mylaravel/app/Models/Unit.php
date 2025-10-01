<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @mixin IdeHelperUnit
 */
class Unit extends Model
{
    use HasFactory;

    // Các trường được phép gán hàng loạt (mass assignment).
    protected $fillable = ['name', 'type', 'code'];

    // Một Unit có nhiều Team
    public function teams(){
        return $this->hasMany(Teams::class);
    }

    // Một Unit có nhiều User
    public function users(){
        return $this->hasMany(User::class);   
    }
}