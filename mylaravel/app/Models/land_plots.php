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
        'ky_hieu_mdsd', // ✅ GIỮ NGUYÊN - sẽ xử lý text[]
        'dien_tich',
        'phuong_xa',
        'status',
        'plot_list_id',
    ];

    protected $casts = [
        'dien_tich' => 'decimal:2',
        'so_to' => 'integer',
        'so_thua' => 'integer',
        // KHÔNG cast ky_hieu_mdsd vì nó là text[] - sẽ xử lý thủ công
    ];

    protected $appends = ['total_area', 'land_types_display', 'ky_hieu_mdsd_array'];

    /**
     * ✅ Accessor cho ky_hieu_mdsd - chuyển text[] thành array PHP
     */
    public function getKyHieuMdsdAttribute($value)
    {
        if (empty($value)) {
            return [];
        }

        // Nếu đã là array (từ mutator), trả về luôn
        if (is_array($value)) {
            return $value;
        }

        // Xử lý text[] format: {CAN,DGT,ODT}
        if (is_string($value) && strpos($value, '{') === 0) {
            $cleaned = trim($value, '{}');
            return $cleaned ? explode(',', $cleaned) : [];
        }

        // Fallback: xử lý như string thông thường
        return [$value];
    }

    /**
     * ✅ Mutator cho ky_hieu_mdsd - chuyển array thành text[]
     */
    public function setKyHieuMdsdAttribute($value)
    {
        if (is_array($value)) {
            // Lưu dưới dạng text[]: {CAN,DGT,ODT}
            $cleanedArray = array_filter($value); // loại bỏ giá trị rỗng
            if (empty($cleanedArray)) {
                $this->attributes['ky_hieu_mdsd'] = null;
            } else {
                $this->attributes['ky_hieu_mdsd'] = '{' . implode(',', $cleanedArray) . '}';
            }
        } else if (is_string($value) && !empty(trim($value))) {
            // Nếu là string, chuyển thành array 1 phần tử
            $this->attributes['ky_hieu_mdsd'] = '{' . $value . '}';
        } else {
            $this->attributes['ky_hieu_mdsd'] = null;
        }
    }

    /**
     * ✅ Accessor cho appends - đảm bảo luôn trả về array
     */
    public function getKyHieuMdsdArrayAttribute()
    {
        return $this->ky_hieu_mdsd;
    }

    public function plotList()
    {
        return $this->belongsTo(PlotList::class, 'plot_list_id', 'id');
    }

    public function landPlotDetails()
    {
        return $this->hasMany(LandPlotDetail::class, 'land_plot_id', 'id');
    }

    public function getTotalAreaAttribute()
    {
        if ($this->plotList && $this->plotList->dien_tich) {
            return floatval($this->plotList->dien_tich);
        }
        
        if ($this->landPlotDetails && $this->landPlotDetails->count() > 0) {
            return $this->landPlotDetails->sum('dien_tich');
        }
        
        return $this->dien_tich;
    }

    /**
     * ✅ Hiển thị dạng string: CAN+DGT+ODT
     */
    public function getLandTypesDisplayAttribute()
    {
        $types = $this->ky_hieu_mdsd;
        return empty($types) ? '' : implode('+', $types);
    }

    public function hasLandType($landType)
    {
        return in_array($landType, $this->ky_hieu_mdsd);
    }

    public function addLandType($landType)
    {
        $currentTypes = $this->ky_hieu_mdsd;
        if (!in_array($landType, $currentTypes)) {
            $currentTypes[] = $landType;
            $this->ky_hieu_mdsd = $currentTypes;
        }
        return $this;
    }

    public function removeLandType($landType)
    {
        $currentTypes = $this->ky_hieu_mdsd;
        $this->ky_hieu_mdsd = array_values(array_filter($currentTypes, function($type) use ($landType) {
            return $type !== $landType;
        }));
        return $this;
    }

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

    public function getLandTypeColors()
    {
        $colors = [];
        foreach ($this->ky_hieu_mdsd as $landType) {
            $colors[$landType] = $this->getColorByLandType($landType);
        }
        return $colors;
    }

    public function getPrimaryColorAttribute()
    {
        $landTypes = $this->ky_hieu_mdsd;
        if (empty($landTypes)) {
            return '#868e96';
        }
        return $this->getColorByLandType($landTypes[0]);
    }

    private function getColorByLandType($landType)
    {
        $colors = [
            'CAN' => '#FF0000',
            'DGT' => '#0000FF', 
            'ODT' => '#00FF00',
            'CLN' => '#FFA500',
            'LUC' => '#FFFF00',
            'BHK' => '#800080',
            'HCC' => '#FF00FF',
            'ONT' => '#DC143C',
            'NTS' => '#20B2AA',
            'SONG' => '#1E90FF',
            'DPTHH' => '#868e96'
        ];
        
        return $colors[$landType] ?? '#868e96';
    }
}