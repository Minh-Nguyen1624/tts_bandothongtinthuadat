<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @mixin IdeHelperTeams
 */
class Teams extends Model{
    use HasFactory;
    
    protected $fillable = ['name', 'unit_id','description','status'];

    public function unit(){
        return $this->belongsTo(Unit::class);
    }

    public function users(){
        return $this->hasMany(User::class);
    }
}