<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class land_plots extends Model
{
    protected $fillable = [
        'ten_chu',
        'so_to',
        'so_thua',
        'ky_hieu_mdsd',
        'phuong_xa',
        'status',
        'plot_list_id'
    ];

    // // Liên kết với plot_lists theo số tờ và số thửa
    // public function plotList()
    // {
    //     return $this->hasOne(PlotList::class, 'so_to', 'so_to')
    //                 ->whereColumn('plot_lists.so_thua', 'land_plots.so_thua');
    // }
    // Mỗi LandPlot thuộc về một PlotList
    public function plotList()
    {
        return $this->belongsTo(PlotList::class, 'plot_list_id', 'id');
    }
}
