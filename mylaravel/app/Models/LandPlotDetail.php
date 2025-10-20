<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class LandPlotDetail extends Model
{
    protected $table = 'land_plot_details';

    protected $fillable = [
        'land_plot_id',
        'ky_hieu_mdsd',
        'dien_tich',
        'geometry' // ✅ Thêm geometry vào fillable
    ];

    /**
     * Get the land plot that owns the detail.
     */
    public function landPlot()
    {
        return $this->belongsTo(land_plots::class, 'land_plot_id', 'id');
    }

    /**
     * Scope to include geometry as GeoJSON
     */
    public function scopeWithGeometry($query)
    {
        return $query->select('*')
            ->selectRaw('ST_AsGeoJSON(geometry) as geometry_geojson');
    }

    /**
     * Accessor for geometry as GeoJSON
     */
    public function getGeometryAttribute()
    {
        // Nếu đã có geometry_geojson từ scope
        if (isset($this->attributes['geometry_geojson']) && $this->attributes['geometry_geojson']) {
            return json_decode($this->attributes['geometry_geojson'], true);
        }

        // Nếu có geometry trong database
        if (isset($this->attributes['geometry']) && $this->attributes['geometry']) {
            try {
                $result = DB::selectOne(
                    "SELECT ST_AsGeoJSON(?) as geojson",
                    [$this->attributes['geometry']]
                );
                return $result ? json_decode($result->geojson, true) : null;
            } catch (\Exception $e) {
                return null;
            }
        }

        return null;
    }

    /**
     * Mutator for geometry - convert GeoJSON to geometry
     */
    public function setGeometryAttribute($value)
    {
        if ($value && is_array($value)) {
            $geojson = json_encode($value);
            $this->attributes['geometry'] = DB::raw("ST_GeomFromGeoJSON('{$geojson}')");
        } else {
            $this->attributes['geometry'] = null;
        }
    }

    /**
     * Get the raw geometry value from database
     */
    public function getRawGeometry()
    {
        return $this->getOriginal('geometry');
    }

    /**
     * Calculate area from geometry (in square meters)
     */
    public function calculateAreaFromGeometry()
    {
        $rawGeometry = $this->getRawGeometry();
        if (!$rawGeometry) {
            return null;
        }

        try {
            $result = DB::selectOne(
                "SELECT ST_Area(?::geometry) as area",
                [$rawGeometry]
            );
            return $result ? floatval($result->area) : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Check if geometry is valid
     */
    public function isGeometryValid()
    {
        $rawGeometry = $this->getRawGeometry();
        if (!$rawGeometry) {
            return false;
        }

        try {
            $result = DB::selectOne(
                "SELECT ST_IsValid(?) as is_valid",
                [$rawGeometry]
            );
            return $result ? boolval($result->is_valid) : false;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get geometry bounds (bounding box)
     */
    public function getGeometryBounds()
    {
        $rawGeometry = $this->getRawGeometry();
        if (!$rawGeometry) {
            return null;
        }

        try {
            $result = DB::selectOne("
                SELECT 
                    ST_XMin(ST_Envelope(?)) as xmin,
                    ST_YMin(ST_Envelope(?)) as ymin,
                    ST_XMax(ST_Envelope(?)) as xmax,
                    ST_YMax(ST_Envelope(?)) as ymax
            ", [$rawGeometry, $rawGeometry, $rawGeometry, $rawGeometry]);

            return $result ? [
                'xmin' => floatval($result->xmin),
                'ymin' => floatval($result->ymin),
                'xmax' => floatval($result->xmax),
                'ymax' => floatval($result->ymax)
            ] : null;
        } catch (\Exception $e) {
            return null;
        }
    }
}