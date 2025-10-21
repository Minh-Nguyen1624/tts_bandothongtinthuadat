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
        'geometry',
        'color'
    ];

    public function landPlot()
    {
        return $this->belongsTo(land_plots::class, 'land_plot_id', 'id');
    }

    public function scopeWithGeometry($query)
    {
        return $query->select('*')
            ->selectRaw('ST_AsGeoJSON(geometry) as geometry_geojson');
    }

    public function getGeometryAttribute()
    {
        if (isset($this->attributes['geometry_geojson']) && $this->attributes['geometry_geojson']) {
            return json_decode($this->attributes['geometry_geojson'], true);
        }

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

    public function setGeometryAttribute($value)
    {
        if ($value && is_array($value)) {
            $geojson = json_encode($value);
            if ($geojson !== false && $geojson !== 'null') {
                // Store the GeoJSON string temporarily and let the database handle the conversion
                $this->attributes['geometry'] = $geojson; // This will be converted by a trigger or raw query
            } else {
                $this->attributes['geometry'] = null;
            }
        } else {
            $this->attributes['geometry'] = null;
        }
    }
    public function getColorAttribute($value)
    {
        return $value ?: '#868e96';
    }

    public function setColorAttribute($value)
    {
        $this->attributes['color'] = $value ?: $this->getDefaultColor();
    }

    protected function getDefaultColor()
    {
        $colors = [
            'ONT' => '#ff6b6b', 'ODT' => '#ff8787',
            'CLN' => '#69db7c', 'LUC' => '#51cf66',
            'BHK' => '#40c057', 'RSX' => '#2f9e44',
            'RPH' => '#37b24d', 'NTS' => '#20c997',
            'DGT' => '#4dabf7', 'HCC' => '#748ffc',
            'DHT' => '#5c7cfa', 'TMD' => '#ffa94d',
            'SKC' => '#fab005', 'SKK' => '#f59f00',
            'SKN' => '#e67700', 'BCD' => '#adb5bd',
            'NCD' => '#868e96', 'SONG' => '#339af0',
            'KNT' => '#228be6', 'CAN' => '#9d5d1962', // Updated to match provided data
            'DGT' => '#4dabf7', 'HCC' => '#748ffc',
            'DHT' => '#5c7cfa', 'TMD' => '#ffa94d',
        ];
        
        return $colors[$this->ky_hieu_mdsd] ?? '#868e96';
    }

    public function getRawGeometry()
    {
        return $this->getOriginal('geometry');
    }

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
?>