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
        // Thêm diện tích
        'dien_tich',
        'phuong_xa',
        'status',
        'plot_list_id',
        // KHÔNG thêm 'geom' vào fillable vì nó là spatial type
    ];

    protected $casts = [
        // Thêm diện tích
        'dien_tich' => 'decimal:2',
        'so_to' => 'integer',
        'so_thua' => 'integer',
    ];

    protected $appends = ['total_area'];

    public function plotList()
    {
        return $this->belongsTo(PlotList::class, 'plot_list_id', 'id');
    }

    // ✅ Mối quan hệ tới chi tiết thửa đất
    public function landPlotDetails()
    {
        return $this->hasMany(LandPlotDetail::class, 'land_plot_id', 'id');
    }

     // Accessor: Tổng diện tích (ưu tiên PlotList)
    public function getTotalAreaAttribute()
    {
        // ✅ Ưu tiên 1: Diện tích từ PlotList
        if ($this->plotList && $this->plotList->dien_tich) {
            return floatval($this->plotList->dien_tich);
        }
        
        // ✅ Ưu tiên 2: Tổng từ chi tiết
        if ($this->landPlotDetails && $this->landPlotDetails->count() > 0) {
            return $this->landPlotDetails->sum('dien_tich');
        }
        
        // ✅ Ưu tiên 3: Diện tích trong land_plots
        return $this->dien_tich;
    }

    // Accessor: Chi tiết diện tích theo loại
    public function getLandUseBreakdownAttribute()
    {
        if ($this->landPlotDetails && $this->landPlotDetails->count() > 0) {
            return $this->landPlotDetails->map(function ($detail) {
                return [
                    'type' => $detail->ky_hieu_mdsd,
                    'area' => floatval($detail->dien_tich),
                    'percentage' => $this->total_area > 0 
                        ? round(($detail->dien_tich / $this->total_area) * 100, 2) 
                        : 0
                ];
            });
        }
        return [];
    }
}