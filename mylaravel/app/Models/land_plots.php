<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class land_plots extends Model
{
    protected $table = 'land_plots';
    
    protected $fillable = [
        'ten_chu',
        'so_to',
        'so_thua',
        'ky_hieu_mdsd',
        'phuong_xa',
        'status',
        'plot_list_id',
        // KHÔNG thêm 'geom' vào fillable vì nó là spatial type
    ];

    protected $casts = [
        'so_to' => 'integer',
        'so_thua' => 'integer',
    ];

    public function plotList()
    {
        return $this->belongsTo(PlotList::class, 'plot_list_id', 'id');
    }
}