# Plot Boundary Validation API

## Overview

API endpoint để kiểm tra xem các lô đất trong bảng `land_plots` có nằm đúng trong ranh giới phường/xã của bảng `phuong_xa_boundary` hay không.

## Endpoint

```
GET /api/land_plots/validate-boundaries
```

## Authentication

Requires: `auth:api` middleware

## Query Parameters

| Parameter   | Type    | Required | Description                                  |
| ----------- | ------- | -------- | -------------------------------------------- |
| `plot_id`   | integer | No       | ID của lô đất cụ thể cần kiểm tra            |
| `phuong_xa` | string  | No       | Tên phường/xã để lọc các lô đất cần kiểm tra |

### Examples

#### Validate all plots

```
GET /api/land_plots/validate-boundaries
```

#### Validate specific plot

```
GET /api/land_plots/validate-boundaries?plot_id=123
```

#### Validate all plots in a ward

```
GET /api/land_plots/validate-boundaries?phuong_xa=Trung An
```

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "summary": {
    "total_checked": 10,
    "valid_count": 8,
    "invalid_count": 2,
    "validation_rate": 80.0
  },
  "results": [
    {
      "plot_id": 123,
      "so_to": 1,
      "so_thua": 1,
      "phuong_xa": "Trung An",
      "boundary_matched": "Phuong Trung An",
      "valid": true,
      "details": {
        "is_contained": true,
        "intersects": true,
        "overlap_percentage": 100.0,
        "plot_area": 1500.5,
        "intersection_area": 1500.5
      },
      "reason": "Plot is fully contained within ward boundary"
    },
    {
      "plot_id": 124,
      "so_to": 1,
      "so_thua": 2,
      "phuong_xa": "Trung An",
      "boundary_matched": "Phuong Trung An",
      "valid": false,
      "details": {
        "is_contained": false,
        "intersects": true,
        "overlap_percentage": 45.2,
        "plot_area": 2000.0,
        "intersection_area": 904.0
      },
      "reason": "Plot partially overlaps (only 45.2% within boundary)"
    }
  ]
}
```

### Error Response (500)

```json
{
  "success": false,
  "message": "Lỗi khi kiểm tra ranh giới: [error message]"
}
```

## How It Works

### Spatial Validation Process

1. **Name Normalization**:

   - Chuẩn hóa tên phường/xã từ `land_plots.phuong_xa` để match với `phuong_xa_boundary.ten_phuong_xa`
   - Loại bỏ dấu tiếng Việt và prefix "Phường"/"Xã"
   - Case-insensitive matching

2. **Spatial Analysis**:
   Sử dụng PostGIS functions:

   - `ST_Contains(p.geom, lp.geom)`: Kiểm tra xem lô đất có hoàn toàn nằm trong ranh giới hay không
   - `ST_Intersects(p.geom, lp.geom)`: Kiểm tra xem lô đất có giao cắt với ranh giới hay không
   - `ST_Area(ST_Intersection(p.geom, lp.geom))`: Tính diện tích phần giao nhau
   - `ST_Area(lp.geom)`: Tính diện tích lô đất

3. **Validation Result**:
   - **Valid**: `is_contained = true` (lô đất hoàn toàn nằm trong ranh giới)
   - **Invalid**: `is_contained = false` (có 2 trường hợp)
     - Có overlap: `intersects = true` nhưng không hoàn toàn nằm trong ranh giới
     - Không có overlap: `intersects = false` (lô đất nằm ngoài ranh giới hoàn toàn)

## Use Cases

### 1. Data Quality Check

Kiểm tra tính toàn vẹn của dữ liệu địa lý sau khi import hoặc cập nhật

### 2. Pre-upload Validation

Validate dữ liệu trước khi upload để đảm bảo accuracy

### 3. Data Migration Verification

Verify dữ liệu sau khi migrate từ hệ thống khác

### 4. Regular Audit

Chạy định kỳ để phát hiện các inconsistencies

## Integration Example

### Frontend (React)

```javascript
// Validate all plots
const validateAllPlots = async () => {
  try {
    const response = await axios.get("/api/land_plots/validate-boundaries", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // console.log('Validation Summary:', response.data.summary);

    // Show invalid plots
    const invalidPlots = response.data.results.filter((r) => !r.valid);
    // console.log('Invalid Plots:', invalidPlots);
  } catch (error) {
    console.error("Validation error:", error);
  }
};

// Validate specific ward
const validateWard = async (wardName) => {
  const response = await axios.get("/api/land_plots/validate-boundaries", {
    params: { phuong_xa: wardName },
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};
```

### Backend (Script)

```php
// Run validation from tinker or artisan command
Route::get('/validate-data', function() {
    $controller = new LandPlotsController();
    $request = Request::create('/api/land_plots/validate-boundaries', 'GET');

    $response = $controller->validatePlotBoundaries($request);
    $data = json_decode($response->getContent());

    // Log results
    Log::info('Validation completed', [
        'total' => $data->summary->total_checked,
        'valid' => $data->summary->valid_count,
        'invalid' => $data->summary->invalid_count
    ]);

    return $response;
});
```

## Database Requirements

- Both tables must have PostGIS enabled
- `land_plots.geom` - polygon geometry (SRID: 4326)
- `phuong_xa_boundary.geom` - polygon/multipolygon geometry (SRID: 4326)

## Performance Considerations

- Queries can be slow with large datasets
- Consider adding spatial indexes:
  ```sql
  CREATE INDEX idx_land_plots_geom ON land_plots USING GIST(geom);
  CREATE INDEX idx_boundary_geom ON phuong_xa_boundary USING GIST(geom);
  ```

## Related Endpoints

- `GET /api/land_plots/phuong-boundary` - Get ward boundary
- `GET /api/land_plots/phuong-list` - List all wards
- `GET /api/land_plots` - List all plots
