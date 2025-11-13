<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @mixin IdeHelperTeams
 */
class Teams extends Model{
    use HasFactory;
    
    // Các trường được phép gán hàng loạt (mass assignment).
    protected $fillable = ['name', 'code', 'unit_id','description','status'];

    // Một Team thuộc về 1 Unit
    public function unit(){
        return $this->belongsTo(Unit::class);
    }

    // Một Team có nhiều User
    public function users(){
        return $this->hasMany(User::class);
    }
}