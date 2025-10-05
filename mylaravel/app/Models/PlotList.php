<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class PlotList extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'organization_name',
        'so_to',
        'so_thua',
        'dia_chi_thua_dat',
        'xa',
        'dien_tich',
    ];

    //  // Một plot_list có thể liên kết với nhiều land_plots
    // public function landPlots()
    // {
    //     return $this->hasMany(land_plots::class, 'so_to', 'so_to')
    //                 ->whereColumn('land_plots.so_thua', 'plot_lists.so_thua');
    // }
    // Một PlotList có thể có nhiều LandPlots
    public function landPlots()
    {
        return $this->hasMany(land_plots::class, 'plot_list_id', 'id');
    }
}

