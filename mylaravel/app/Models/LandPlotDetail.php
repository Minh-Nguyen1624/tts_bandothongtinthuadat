<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandPlotDetail extends Model
{
    protected $table = 'land_plot_details';

    protected $fillable = [
        'land_plot_id',
        'ky_hieu_mdsd',
        'dien_tich',
    ];

    public function landPlot()
    {
        return $this->belongsTo(land_plots::class, 'land_plot_id', 'id');
    }
}
