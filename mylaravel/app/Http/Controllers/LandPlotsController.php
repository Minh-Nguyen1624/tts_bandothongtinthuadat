<?php

namespace App\Http\Controllers;

use App\Models\land_plots;
use App\Exports\LandPlotsExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Maatwebsite\Excel\Facades\Excel;

class LandPlotsController extends Controller
{

    public function index()
    {
        try {
            // JOIN theo kiểu PostgreSQL (ép kiểu text để tránh lỗi operator)
            $landPlots = DB::table('land_plots as lp')
                ->leftJoin('plot_lists as pl', function ($join) {
                    $join->on(DB::raw('lp.so_to::text'), '=', DB::raw('pl.so_to::text'))
                         ->on(DB::raw('lp.so_thua::text'), '=', DB::raw('pl.so_thua::text'));
                })
                ->select(
                    'lp.*',
                    'pl.dien_tich',
                    'pl.organization_name',
                    'pl.dia_chi_thua_dat',
                    DB::raw('ST_X(ST_Centroid(geom)) AS lng'),
                    DB::raw('ST_Y(ST_Centroid(geom)) AS lat')
                )
                ->orderBy('lp.id', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $landPlots
            ], 200);

        } catch (\Exception $e) {
            Log::error('LandPlots index error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
            // ✅ Bước 1: Validate dữ liệu đầu vào
            $validator = Validator::make($request->all(), [
                'ten_chu'      => 'nullable|string|max:100',
                'so_to'        => 'required|integer',
                'so_thua'      => 'required|integer',
                'ky_hieu_mdsd' => 'required|string',
                'phuong_xa'    => 'required|string|max:100',
                'status'       => 'in:available,owned,suspended',
                'plot_list_id' => 'nullable|exists:plot_lists,id',
                'geom'         => 'nullable|array' // geometry dạng GeoJSON
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            try {
                DB::beginTransaction();

                $data = $validator->validated();
                $geojson = null;

                // ✅ Bước 2: Chuyển geometry thành GeoJSON nếu có
                if ($request->has('geom') && !empty($request->input('geom'))) {
                    $geojson = json_encode($request->input('geom'));
                    if ($geojson === false || $geojson === 'null') {
                        throw new \Exception('Invalid GeoJSON data');
                    }
                    Log::info('📍 GeoJSON received: ' . $geojson);
                }

                // ✅ Bước 3: Tạo bản ghi cơ bản (chưa có geom)
                $landPlotId = DB::table('land_plots')->insertGetId([
                    'ten_chu'      => $data['ten_chu'] ?? null,
                    'so_to'        => $data['so_to'],
                    'so_thua'      => $data['so_thua'],
                    'ky_hieu_mdsd' => $data['ky_hieu_mdsd'],
                    'phuong_xa'    => $data['phuong_xa'],
                    'status'       => $data['status'] ?? 'available',
                    'plot_list_id' => $data['plot_list_id'] ?? null,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);

                // ✅ Bước 4: Cập nhật geometry (nếu có)
                if ($geojson) {
                    DB::statement('
                        UPDATE land_plots
                        SET geom = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)
                        WHERE id = ?
                    ', [$geojson, $landPlotId]);
                }

                // ✅ Bước 5: Lấy lại bản ghi vừa tạo
                $landPlot = land_plots::find($landPlotId);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Land plot created successfully',
                    'data'    => $landPlot
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('❌ Land plot creation error: ' . $e->getMessage());

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create land plot: ' . $e->getMessage()
                ], 500);
            }
    }

    public function show($id)
    {
        $landPlot = DB::table('land_plots')
            ->select(
                'id',
                'ten_chu',
                'so_to',
                'so_thua',
                'ky_hieu_mdsd',
                'phuong_xa',
                'status',
                'created_at',
                'updated_at',
                DB::raw('ST_X(ST_Centroid(geom)) AS lng'),
                DB::raw('ST_Y(ST_Centroid(geom)) AS lat')
            )
            ->where('id', $id)
            ->first();

        if (!$landPlot) {
            return response()->json(['success' => false, 'message' => 'Không tìm thấy thửa đất'], 404);
        }

        return response()->json(['success' => true, 'data' => $landPlot], 200);
    }


    // public function update(Request $request, $id)
    // {
    //     $id = (int) $id;
    //     $landPlot = land_plots::findOrFail($id);

    //     $validator = Validator::make($request->all(), [
    //         'ten_chu'      => 'nullable|string|max:100',
    //         'so_to'        => 'nullable|integer',
    //         'so_thua'      => 'nullable|integer',
    //         'ky_hieu_mdsd' => 'nullable|string|max:50',
    //         'phuong_xa'    => 'nullable|string|max:100',
    //         'status'       => 'in:available,owned,suspended',
    //         'geom'         => 'nullable|array',
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
    //     }

    //     try {
    //         DB::beginTransaction();

    //         $data = $validator->validated();

    //         // ✅ Xử lý trạng thái tự động theo "ten_chu"
    //         if (array_key_exists('ten_chu', $data)) {
    //             $data['status'] = !empty(trim($data['ten_chu'] ?? '')) ? 'owned' : 'available';
    //         }

    //         // ✅ Tìm plot_list_id tương ứng (nếu có so_to và so_thua)
    //         $plotList = \App\Models\PlotList::where('so_to', $data['so_to'] ?? $landPlot->so_to)
    //             ->where('so_thua', $data['so_thua'] ?? $landPlot->so_thua)
    //             ->first();

    //         $data['plot_list_id'] = $plotList ? $plotList->id : null;

    //         // ✅ Xử lý GeoJSON nếu có
    //         $geojson = null;
    //         if (!empty($data['geom'])) {
    //             $geojsonData = $data['geom'];
    //             if (isset($geojsonData['type']) && $geojsonData['type'] === 'Polygon') {
    //                 $geojson = json_encode($geojsonData, JSON_UNESCAPED_UNICODE);
    //             } else if (isset($geojsonData[0][0]) && is_array($geojsonData[0][0])) {
    //                 $geojson = json_encode([
    //                     'type' => 'Polygon',
    //                     'coordinates' => $geojsonData
    //                 ], JSON_UNESCAPED_UNICODE);
    //             } else if (isset($geojsonData[0]) && is_array($geojsonData[0])) {
    //                 $geojson = json_encode([
    //                     'type' => 'Polygon',
    //                     'coordinates' => [$geojsonData]
    //                 ], JSON_UNESCAPED_UNICODE);
    //             } else {
    //                 throw new \Exception('Invalid geometry format');
    //             }
    //         }

    //         // ✅ Cập nhật dữ liệu
    //         // if ($geojson) {
    //         //     DB::update("
    //         //         UPDATE land_plots 
    //         //         SET ten_chu = ?, so_to = ?, so_thua = ?, ky_hieu_mdsd = ?, phuong_xa = ?, 
    //         //             status = ?, plot_list_id = ?, updated_at = ?, 
    //         //             geom = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)
    //         //         WHERE id = ?
    //         //     ", [
    //         //         $data['ten_chu'] ?? $landPlot->ten_chu,
    //         //         $data['so_to'] ?? $landPlot->so_to,
    //         //         $data['so_thua'] ?? $landPlot->so_thua,
    //         //         $data['ky_hieu_mdsd'] ?? $landPlot->ky_hieu_mdsd,
    //         //         $data['phuong_xa'] ?? $landPlot->phuong_xa,
    //         //         $data['status'] ?? $landPlot->status,
    //         //         $data['plot_list_id'],
    //         //         now(),
    //         //         $geojson,
    //         //         $id
    //         //     ]);
    //         // } else {
    //         //     $landPlot->update($data);
    //         // }
    //         $landPlot->update($data);
            
    //         DB::commit();

    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Land plot updated successfully',
    //             'data'    => $landPlot->fresh('plotList')
    //         ]);

    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         Log::error('Land plot update error: ' . $e->getMessage() . ' with id: ' . $id);
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Failed to update land plot: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }

    public function update(Request $request, $id)
{
    $id = (int) $id;
    $landPlot = land_plots::findOrFail($id);

    $validator = Validator::make($request->all(), [
        // 'ten_chu'      => 'nullable|string|max:100',
        // 'so_to'        => 'nullable|integer',
        // 'so_thua'      => 'nullable|integer',
        // 'ky_hieu_mdsd' => 'nullable|string|max:50',
        // 'phuong_xa'    => 'nullable|string|max:100',
        // 'status'       => 'in:available,owned,suspended',
        // 'geom'         => 'nullable|array',
         'ten_chu'      => 'nullable|string|max:100',
        'so_to'        => 'nullable|integer',
        'so_thua'      => 'nullable|integer',
        'ky_hieu_mdsd' => 'nullable|string|max:50',
        'dien_tich'    => 'nullable|numeric|min:0', // ✅ THÊM TRƯỜNG NÀY
        'phuong_xa'    => 'nullable|string|max:100',
        'ghi_chu'      => 'nullable|string|max:500', // ✅ THÊM TRƯỜNG NÀY
        'status'       => 'in:available,owned,suspended',
        'geom'         => 'nullable|array',
        'plot_list_id' => 'nullable|integer|exists:plot_lists,id',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
    }

    try {
        DB::beginTransaction();

        $data = $validator->validated();

        // ✅ Xử lý trạng thái tự động theo "ten_chu"
        if (array_key_exists('ten_chu', $data)) {
            $data['status'] = !empty(trim($data['ten_chu'] ?? '')) ? 'owned' : 'available';
        }

        // ✅ Tìm plot_list_id tương ứng
        $plotList = \App\Models\PlotList::where('so_to', $data['so_to'] ?? $landPlot->so_to)
            ->where('so_thua', $data['so_thua'] ?? $landPlot->so_thua)
            ->first();

        $data['plot_list_id'] = $plotList ? $plotList->id : null;

        // ✅ Xử lý GeoJSON nếu có - FIXED
        if (!empty($data['geom'])) {
            $geojsonData = $data['geom'];
            
            // Đảm bảo là GeoJSON hợp lệ
            if (is_array($geojsonData) && isset($geojsonData['type'])) {
                $geojson = json_encode($geojsonData, JSON_UNESCAPED_UNICODE);
                
                // Cập nhật geometry bằng raw query
                DB::update("
                    UPDATE land_plots 
                    SET geom = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)
                    WHERE id = ?
                ", [$geojson, $id]);
                
                // Loại bỏ geom khỏi data để không update 2 lần
                unset($data['geom']);
            }
        }

        // ✅ Cập nhật các trường khác
        $landPlot->update($data);
        
        DB::commit();

        return response()->json([
            'success' => true,
            'message' => 'Land plot updated successfully',
            'data'    => $landPlot->fresh('plotList')
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Land plot update error: ' . $e->getMessage() . ' with id: ' . $id);
        return response()->json([
            'success' => false,
            'message' => 'Failed to update land plot: ' . $e->getMessage()
        ], 500);
    }
}

    public function destroy($id)
    {
        $landPlot = land_plots::findOrFail($id);
        $landPlot->delete();

        return response()->json([
            'success' => true,
            'message' => 'Land plot deleted successfully'
        ], 200);
    }

    // public function search(Request $request)
    // {
    //     try {
    //         $query = land_plots::query();

    //         // Kiểm tra điều kiện tìm kiếm
    //         $hasPhuongXa = $request->has('phuong_xa') && !empty($request->input('phuong_xa'));
    //         $hasSoTo = $request->has('so_to') && !empty($request->input('so_to'));
    //         $hasSoThua = $request->has('so_thua') && !empty($request->input('so_thua'));

    //         // Áp dụng điều kiện tìm kiếm (linh hoạt)
    //         if ($hasPhuongXa) {
    //             $query->where('phuong_xa', 'ILIKE', "%{$request->input('phuong_xa')}%");
    //         }

    //         if ($hasSoTo) {
    //             $query->where('so_to', $request->input('so_to'));
    //         }

    //         if ($hasSoThua) {
    //             $query->where('so_thua', $request->input('so_thua'));
    //         }

    //         // Kiểm tra nếu không có điều kiện nào
    //         if (!$hasPhuongXa && !$hasSoTo && !$hasSoThua) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Vui lòng nhập ít nhất một thông tin: Phường/Xã, Số tờ hoặc Số thửa'
    //             ], 400);
    //         }

    //         // Tìm kiếm chung (nếu có)
    //         if ($request->has('query') && !empty($request->input('query'))) {
    //             $searchTerm = $request->input('query');
    //             $query->where(function ($q) use ($searchTerm) {
    //                 $q->where('ten_chu', 'ILIKE', "%{$searchTerm}%")
    //                 ->orWhere('ky_hieu_mdsd', 'ILIKE', "%{$searchTerm}%");
    //             });
    //         }

    //         $plots = $query->orderBy('id', 'desc')->get();

    //         // Thêm thông tin về loại tìm kiếm
    //         $searchType = ($hasPhuongXa && $hasSoTo && $hasSoThua) ? 'exact' : 'suggest';

    //         return response()->json([
    //             'success' => true,
    //             'data' => $plots,
    //             'total' => $plots->count(),
    //             'search_type' => $searchType,
    //             'message' => $searchType === 'exact' 
    //                 ? 'Tìm kiếm chính xác' 
    //                 : 'Tìm kiếm gợi ý    - Vui lòng chọn kết quả phù hợp'
    //         ]);
    //     } catch (\Exception $e) {
    //         Log::error('Search error: ' . $e->getMessage());
    //         return response()->json([
    //             'success' => false, 
    //             'message' => 'Có lỗi xảy ra khi tìm kiếm'
    //         ], 500);
    //     }
    // }
    public function search(Request $request)
    {
        try {
            $query = land_plots::query();

            // Kiểm tra điều kiện tìm kiếm
            $hasPhuongXa = $request->has('phuong_xa') && !empty($request->input('phuong_xa'));
            $hasSoTo = $request->has('so_to') && !empty($request->input('so_to'));
            $hasSoThua = $request->has('so_thua') && !empty($request->input('so_thua'));

            // Áp dụng điều kiện tìm kiếm (linh hoạt)
            if ($hasPhuongXa) {
                $query->where('phuong_xa', 'ILIKE', "%{$request->input('phuong_xa')}%");
            }

            if ($hasSoTo) {
                $query->where('so_to', $request->input('so_to'));
            }

            if ($hasSoThua) {
                $query->where('so_thua', $request->input('so_thua'));
            }

            // Kiểm tra nếu không có điều kiện nào
            if (!$hasPhuongXa && !$hasSoTo && !$hasSoThua) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vui lòng nhập ít nhất một thông tin: Phường/Xã, Số tờ hoặc Số thửa'
                ], 400);
            }

            // Tìm kiếm chung (nếu có)
            if ($request->has('query') && !empty($request->input('query'))) {
                $searchTerm = $request->input('query');
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('ten_chu', 'ILIKE', "%{$searchTerm}%")
                    ->orWhere('ky_hieu_mdsd', 'ILIKE', "%{$searchTerm}%");
                });
            }

            // Lấy dữ liệu với geom đã được chuyển đổi sang GeoJSON
            $plots = $query->select(
                '*',
                \DB::raw('ST_AsGeoJSON(geom) as geom_geojson')
            )->orderBy('id', 'desc')->get();

            // Chuyển đổi geom sang JSON object
            $plots->transform(function ($plot) {
                if ($plot->geom_geojson) {
                    $plot->geom = json_decode($plot->geom_geojson);
                } else {
                    $plot->geom = null;
                }
                // Xóa trường geom_geojson tạm thời
                unset($plot->geom_geojson);
                return $plot;
            });

            // Thêm thông tin về loại tìm kiếm
            $searchType = ($hasPhuongXa && $hasSoTo && $hasSoThua) ? 'exact' : 'suggest';

            return response()->json([
                'success' => true,
                'data' => $plots,
                'total' => $plots->count(),
                'search_type' => $searchType,
                'message' => $searchType === 'exact' 
                    ? 'Tìm kiếm chính xác' 
                    : 'Tìm kiếm gợi ý - Vui lòng chọn kết quả phù hợp'
            ]);
        } catch (\Exception $e) {
            Log::error('Search error: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Có lỗi xảy ra khi tìm kiếm'
            ], 500);
        }
    }
    
    // Trong LandPlotsController, tạo method test mới
    public function getGeometry(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'so_to' => 'required|integer',
            'so_thua' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $soTo = $request->input('so_to');
            $soThua = $request->input('so_thua');

            $result = DB::selectOne("
                SELECT 
                    id,
                    so_to, 
                    so_thua,
                    ST_AsGeoJSON(geom) as geojson_data
                FROM land_plots 
                WHERE so_to = ? AND so_thua = ? AND geom IS NOT NULL
                LIMIT 1
            ", [$soTo, $soThua]);

            if (!$result) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy dữ liệu toạ độ'
                ], 404);
            }

            $geometryData = json_decode($result->geojson_data ?? '', true) ?: [];
            $coordinates = isset($geometryData['coordinates'][0]) ? $geometryData['coordinates'][0] : [];
            $centerPoint = empty($coordinates) ? null : $this->calculateCenter($coordinates);

            return response()->json([
                'success' => true,
                'geometry' => $geometryData, // Toàn bộ GeoJSON
                'coordinates' => $coordinates, // Chỉ mảng tọa độ
                'center_point' => $centerPoint, // Điểm trung tâm
                'land_plot_info' => [
                    'id' => $result->id,
                    'so_to' => $result->so_to,
                    'so_thua' => $result->so_thua
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get geometry error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy dữ liệu toạ độ'
            ], 500);
        }
    }

    // Hàm tính điểm trung tâm
    private function calculateCenter($coordinates)
    {
        if (empty($coordinates)) {
            return null;
        }

        $sumLng = 0;
        $sumLat = 0;
        $count = count($coordinates);

        foreach ($coordinates as $point) {
            $sumLng += $point[0]; // longitude
            $sumLat += $point[1]; // latitude
        }

        return [
            'lng' => $sumLng / $count,
            'lat' => $sumLat / $count
        ];
    }

    public function getGeoJson()
    {
        try {
            $plots = DB::table('land_plots as lp')
                ->leftJoin('plot_lists as pl', function ($join) {
                    $join->on(DB::raw('lp.so_to::text'), '=', DB::raw('pl.so_to::text'))
                        ->on(DB::raw('lp.so_thua::text'), '=', DB::raw('pl.so_thua::text'));
                })
                ->select(
                    'lp.id',
                    'lp.plot_list_id',
                    'lp.ten_chu',
                    'lp.so_to',
                    'lp.so_thua',
                    'lp.ky_hieu_mdsd',
                    'lp.phuong_xa',
                    'lp.status',
                    'lp.created_at',
                    'lp.updated_at',
                    DB::raw('ST_AsGeoJSON(lp.geom) as geometry')
                )
                ->whereNotNull('lp.geom')
                ->get();

            $features = [];

            foreach ($plots as $plot) {
                $geometry = json_decode($plot->geometry ?? '', true) ?: null;
                if ($geometry === null) {
                    continue; // Bỏ qua nếu geometry không hợp lệ
                }

                $properties = [
                    'id' => $plot->id ?? null,
                    'plot_list_id' => $plot->plot_list_id ?? null,
                    'ten_chu' => $plot->ten_chu ?? null,
                    'so_to' => $plot->so_to ?? null,
                    'so_thua' => $plot->so_thua ?? null,
                    'ky_hieu_mdsd' => $plot->ky_hieu_mdsd ?? null,
                    'phuong_xa' => $plot->phuong_xa ?? null,
                    'status' => $plot->status ?? null,
                    'created_at' => $plot->created_at ?? null,
                    'updated_at' => $plot->updated_at ?? null,
                ];

                $features[] = [
                    'type' => 'Feature',
                    'geometry' => $geometry,
                    'properties' => $properties,
                ];
            }

            return response()->json([
                'type' => 'FeatureCollection',
                'features' => $features,
            ]);

        } catch (\Exception $e) {
            Log::error('GeoJSON export error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export GeoJSON',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        $filters = $request->only(['search', 'plot_list_id']);
        $fileName = 'land_plots_' . date('Ymd_His') . '.xlsx';
        return Excel::download(new LandPlotsExport($filters), $fileName);
    }

    
}
