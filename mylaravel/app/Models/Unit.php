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

    protected $fillable = ['name', 'type', 'code'];

    public function teams(){
        return $this->hasMany(Teams::class);
    }

    public function users(){
        return $this->hasMany(User::class);   
    }
}