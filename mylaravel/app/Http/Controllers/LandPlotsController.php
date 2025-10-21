<?php

namespace App\Http\Controllers;

use App\Models\land_plots;
use App\Models\LandPlotDetail;
use App\Exports\LandPlotsExport;
use App\Models\PlotList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Maatwebsite\Excel\Facades\Excel;

class LandPlotsController extends Controller
{

    // public function index()
    // {
    //     try {
    //         // JOIN theo kiểu PostgreSQL (ép kiểu text để tránh lỗi operator)
    //         $landPlots = DB::table('land_plots as lp')
    //             ->leftJoin('plot_lists as pl', function ($join) {
    //                 $join->on(DB::raw('lp.so_to::text'), '=', DB::raw('pl.so_to::text'))
    //                      ->on(DB::raw('lp.so_thua::text'), '=', DB::raw('pl.so_thua::text'));
    //             })
    //             ->select(
    //                 'lp.*',
    //                 'pl.dien_tich',
    //                 'pl.organization_name',
    //                 'pl.dia_chi_thua_dat',
    //                 DB::raw('ST_X(ST_Centroid(geom)) AS lng'),
    //                 DB::raw('ST_Y(ST_Centroid(geom)) AS lat')
    //             )
    //             ->orderBy('lp.id', 'desc')
    //             ->get();

    //         return response()->json([
    //             'success' => true,
    //             'data' => $landPlots
    //         ], 200);

    //     } catch (\Exception $e) {
    //         Log::error('LandPlots index error: ' . $e->getMessage());
    //         return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    //     }
    // }
public function index()
{
    try {
        $landPlots = DB::table('land_plots as lp')
            ->leftJoin('plot_lists as pl', 'lp.plot_list_id', '=', 'pl.id')
            ->select(
                'lp.*',
                'pl.dien_tich as plot_list_dien_tich',
                'pl.organization_name',
                'pl.dia_chi_thua_dat',
                'pl.xa',
                DB::raw('ST_X(ST_Centroid(lp.geom)) AS lng'),
                DB::raw('ST_Y(ST_Centroid(lp.geom)) AS lat')
            )
            ->orderBy('lp.id', 'desc')
            ->get();

        foreach ($landPlots as $plot) {
            // ✅ Parse PostgreSQL array literal
            $plot->ky_hieu_mdsd = $plot->ky_hieu_mdsd 
                ? explode(',', trim($plot->ky_hieu_mdsd, '{}'))
                : [];

            $plot->land_use_details = DB::table('land_plot_details')
                ->where('land_plot_id', $plot->id)
                ->select('ky_hieu_mdsd', 'dien_tich', 'color')
                ->orderBy('id', 'desc')
                ->get();
            
            // ✅ Tính diện tích tổng
            if ($plot->plot_list_dien_tich) {
                $plot->dien_tich_total = floatval($plot->plot_list_dien_tich);
            } elseif ($plot->land_use_details->count() > 0) {
                $plot->dien_tich_total = $plot->land_use_details->sum('dien_tich');
            } else {
                $plot->dien_tich_total = $plot->dien_tich;
            }
        }

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
        $validator = Validator::make($request->all(), [
            'ten_chu' => 'nullable|string|max:100',
            'so_to' => 'required|integer',
            'so_thua' => 'required|integer',
            'ky_hieu_mdsd' => 'required|array',
            'ky_hieu_mdsd.*' => 'string|max:20',
            'phuong_xa' => 'required|string|max:100',
            'status' => 'in:available,owned,suspended',
            'geom' => 'nullable|array',
            'land_use_details' => 'nullable|array',
            'land_use_details.*.ky_hieu_mdsd' => 'required|string|max:50',
            'land_use_details.*.dien_tich' => 'required|numeric|min:0',
            'land_use_details.*.geometry' => 'nullable|array'
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
            
            // Tìm PlotList
            $plotList = PlotList::where('so_to', $data['so_to'])
                ->where('so_thua', $data['so_thua'])
                ->first();

            if (!$plotList) {
                throw new \Exception("Không tìm thấy thửa đất với số tờ {$data['so_to']} và số thửa {$data['so_thua']} trong PlotList");
            }

            if (isset($data['land_use_details']) && count($data['land_use_details']) > 0) {
                $detailTypes = array_column($data['land_use_details'], 'ky_hieu_mdsd');
                $mainTypes = $data['ky_hieu_mdsd'];
                
                $missingTypes = array_diff($detailTypes, $mainTypes);
                if (!empty($missingTypes)) {
                    throw new \Exception(
                        "Loại đất trong chi tiết (" . implode(', ', $missingTypes) . ") không có trong loại đất chính"
                    );
                }
                
                $totalDetailArea = array_sum(array_column($data['land_use_details'], 'dien_tich'));
                $plotListArea = floatval($plotList->dien_tich);
                
                if (abs($totalDetailArea - $plotListArea) > 0.01) {
                    throw new \Exception(
                        "Tổng diện tích chi tiết ({$totalDetailArea} m²) không khớp với diện tích PlotList ({$plotListArea} m²)"
                    );
                }
            }

            // Xử lý GeoJSON chính
            $geojson = null;
            if ($request->has('geom') && !empty($request->input('geom'))) {
                $geojson = json_encode($request->input('geom'));
                if ($geojson === false || $geojson === 'null') {
                    throw new \Exception('Invalid GeoJSON data');
                }
            }

            $landPlot = new land_plots();
            $landPlot->ten_chu = $data['ten_chu'] ?? null;
            $landPlot->so_to = $data['so_to'];
            $landPlot->so_thua = $data['so_thua'];
            $landPlot->ky_hieu_mdsd = $data['ky_hieu_mdsd'];
            $landPlot->phuong_xa = $data['phuong_xa'];
            $landPlot->status = $data['status'] ?? 'available';
            $landPlot->plot_list_id = $plotList->id;
            $landPlot->dien_tich = $plotList->dien_tich;
            $landPlot->save();

            if ($geojson) {
                DB::update(
                    'UPDATE land_plots SET geom = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) WHERE id = ?',
                    [$geojson, $landPlot->id]
                );
            }

            if (isset($data['land_use_details']) && is_array($data['land_use_details'])) {
                foreach ($data['land_use_details'] as $detail) {
                    $landPlotDetail = new LandPlotDetail();
                    $landPlotDetail->land_plot_id = $landPlot->id;
                    $landPlotDetail->ky_hieu_mdsd = $detail['ky_hieu_mdsd'];
                    $landPlotDetail->dien_tich = $detail['dien_tich'];
                    
                    if (isset($detail['geometry']) && !empty($detail['geometry'])) {
                        $geometryJson = json_encode($detail['geometry']);
                        if ($geometryJson !== false && $geometryJson !== 'null') {
                            $landPlotDetail->geometry = $geometryJson; // Set as GeoJSON string
                            $landPlotDetail->save();
                            // Update geometry with PostGIS conversion
                            DB::update(
                                'UPDATE land_plot_details SET geometry = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) WHERE id = ?',
                                [$geometryJson, $landPlotDetail->id]
                            );
                        }
                    }
                    
                    $landPlotDetail->color = $detail['color'] ?? $this->getColorByLandType($detail['ky_hieu_mdsd']);
                    $landPlotDetail->save();
                }
            }

            $landPlot->load(['plotList', 'landPlotDetails']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Land plot created successfully',
                'data' => $landPlot
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Land plot creation error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // public function show($id)
    // {
    //     $landPlot = DB::table('land_plots')
    //         ->select(
    //             'id',
    //             'ten_chu',
    //             'so_to',
    //             'so_thua',
    //             'ky_hieu_mdsd',
    //             'phuong_xa',
    //             'status',
    //             'created_at',
    //             'updated_at',
    //             DB::raw('ST_X(ST_Centroid(geom)) AS lng'),
    //             DB::raw('ST_Y(ST_Centroid(geom)) AS lat')
    //         )
    //         ->where('id', $id)
    //         ->first();

    //     if (!$landPlot) {
    //         return response()->json(['success' => false, 'message' => 'Không tìm thấy thửa đất'], 404);
    //     }

    //     return response()->json(['success' => true, 'data' => $landPlot], 200);
    // }

    public function show($id)
    {
        try {
            $landPlot = land_plots::with(['plotList', 'landPlotDetails'])->find($id);

            if (!$landPlot) {
                return response()->json(['success' => false, 'message' => 'Không tìm thấy thửa đất'], 404);
            }

            // Thêm thông tin geometry
            $landPlot->lng = DB::table('land_plots')
                ->where('id', $id)
                ->value(DB::raw('ST_X(ST_Centroid(geom))'));
                
            $landPlot->lat = DB::table('land_plots')
                ->where('id', $id)
                ->value(DB::raw('ST_Y(ST_Centroid(geom))'));

            return response()->json(['success' => true, 'data' => $landPlot], 200);

        } catch (\Exception $e) {
            Log::error('Land plot show error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Lỗi khi lấy thông tin thửa đất'], 500);
        }
    }

    // public function update(Request $request, $id)
    // {
    //     $id = (int) $id;
    //     $landPlot = land_plots::with('plotList')->findOrFail($id);

    //     $validator = Validator::make($request->all(), [
    //         'ten_chu'      => 'nullable|string|max:100',
    //         'so_to'        => 'nullable|integer',
    //         'so_thua'      => 'nullable|integer',
    //         // 'ky_hieu_mdsd' => 'nullable|string|max:255',
    //         'ky_hieu_mdsd' => 'nullable|array',
    //         'ky_hieu_mdsd.*' => 'string|max:20',
    //         'phuong_xa'    => 'nullable|string|max:100',
    //         'ghi_chu'      => 'nullable|string|max:500',
    //         'status'       => 'in:available,owned,suspended',
    //         'geom'         => 'nullable|array',
    //         'land_use_details' => 'nullable|array',
    //         'land_use_details.*.ky_hieu_mdsd' => 'required|string|max:50',
    //         'land_use_details.*.dien_tich' => 'required|numeric|min:0'
    //     ]);

    //     if ($validator->fails()) {
    //         return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
    //     }

    //     try {
    //         DB::beginTransaction();

    //         $data = $validator->validated();

    //         // Xử lý trạng thái
    //         if (array_key_exists('ten_chu', $data)) {
    //             $data['status'] = !empty(trim($data['ten_chu'] ?? '')) ? 'owned' : 'available';
    //         }

    //         // ✅ Nếu thay đổi so_to hoặc so_thua -> tìm PlotList mới
    //         if (isset($data['so_to']) || isset($data['so_thua'])) {
    //             $plotList = PlotList::where('so_to', $data['so_to'] ?? $landPlot->so_to)
    //                 ->where('so_thua', $data['so_thua'] ?? $landPlot->so_thua)
    //                 ->first();

    //             if (!$plotList) {
    //                 throw new \Exception("Không tìm thấy PlotList tương ứng");
    //             }

    //             $data['plot_list_id'] = $plotList->id;
    //             $data['dien_tich'] = $plotList->dien_tich;
    //         }

    //         // ✅ Validate: Tổng diện tích details phải = plot_list.dien_tich
    //         if (isset($data['land_use_details']) && count($data['land_use_details']) > 0) {
                
    //             $detailTypes = array_column($data['land_use_details'], 'ky_hieu_mdsd');
    //             $mainTypes = $data['ky_hieu_mdsd'] ?? $landPlot->ky_hieu_mdsd;
                
    //             $missingTypes = array_diff($detailTypes, $mainTypes);
    //             if (!empty($missingTypes)) {
    //                 throw new \Exception(
    //                     "Loại đất trong chi tiết (" . implode(', ', $missingTypes) . ") không có trong loại đất chính"
    //                 );
    //             }

    //             // Validate tổng diện tích
    //             $totalDetailArea = array_sum(array_column($data['land_use_details'], 'dien_tich'));
    //             $plotListArea = floatval($landPlot->plotList->dien_tich ?? $data['dien_tich'] ?? 0);
                
    //             if (abs($totalDetailArea - $plotListArea) > 0.01) {
    //                 throw new \Exception(
    //                     "Tổng diện tích chi tiết ({$totalDetailArea} m²) không khớp với diện tích PlotList ({$plotListArea} m²)"
    //                 );
    //             }
    //         }

    //         // ✅ Xử lý ky_hieu_mdsd - convert thành JSON nếu là array
    //         if (isset($data['ky_hieu_mdsd']) && is_array($data['ky_hieu_mdsd'])) {
    //             $data['ky_hieu_mdsd'] = json_encode($data['ky_hieu_mdsd']);
    //         }

    //         // Xử lý GeoJSON
    //         // if (!empty($data['geom'])) {
    //         //     $geojsonData = $data['geom'];
                
    //         //     if (is_array($geojsonData) && isset($geojsonData['type'])) {
    //         //         $geojson = json_encode($geojsonData, JSON_UNESCAPED_UNICODE);
                    
    //         //         DB::update("
    //         //             UPDATE land_plots 
    //         //             SET geom = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326)
    //         //             WHERE id = ?
    //         //         ", [$geojson, $id]);
    //         //     }
                
    //         //     unset($data['geom']);
    //         // }
            
    //         $geojson = null;
    //         if($request->has('geom') && !empty($request->input('geom'))){
    //             $geojson = json_encode($request->input('geom'));
    //             if($geojson === false || $geojson === 'null'){
    //                 throw new \Exception('Invalid GeoJSON data');
    //             }
    //         }

    //         $landPlot = new land_plots();
    //         $landPlot->update($data);

    //         if($geojson){
    //             DB::update('UPDATE land_plots SET geom = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) WHERE id = ?');
    //         }

    //         // ✅ Cập nhật chi tiết diện tích
    //         if (isset($data['land_use_details']) && is_array($data['land_use_details'])) {
    //             foreach($data['land_use_details'] as $detail){
    //                 $landPlotDetail = new LandPlotDetail();
    //                 $landPlotDetail->land_plot_id = $landPlot->id;
    //                 $landPlotDetail->ky_hieu_mdsd = $detail['ky_hieu_mdsd'];
    //                 $
    //             }
    //             // Xóa chi tiết cũ
    //             DB::table('land_plot_details')->where('land_plot_id', $id)->delete();

    //             // Thêm chi tiết mới
    //             foreach ($data['land_use_details'] as $detail) {
    //                 DB::table('land_plot_details')->insert([
    //                     'land_plot_id' => $id,
    //                     'ky_hieu_mdsd' => $detail['ky_hieu_mdsd'],
    //                     'dien_tich' => $detail['dien_tich'],
    //                     'color' => $this->getColorByLandType($detail['ky_hieu_mdsd']),
    //                     'created_at' => now(),
    //                     'updated_at' => now()
    //                 ]);
    //             }

    //             unset($data['land_use_details']);
    //         }

    //         // Cập nhật land_plot
    //         $landPlot->update($data);
            
    //         DB::commit();

    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Land plot updated successfully',
    //             'data'    => $landPlot->fresh(['plotList', 'landPlotDetails'])
    //         ]);

    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         Log::error('Land plot update error: ' . $e->getMessage());
    //         return response()->json([
    //             'success' => false,
    //             'message' => $e->getMessage()
    //         ], 500);
    //     }
    // }
    
    public function update(Request $request, $id)
    {
        $id = (int) $id;
        $landPlot = land_plots::with('plotList')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'ten_chu'      => 'nullable|string|max:100',
            'so_to'        => 'nullable|integer',
            'so_thua'      => 'nullable|integer',
            'ky_hieu_mdsd' => 'nullable|array',
            'ky_hieu_mdsd.*' => 'string|max:20',
            'phuong_xa'    => 'nullable|string|max:100',
            'ghi_chu'      => 'nullable|string|max:500',
            'status'       => 'in:available,owned,suspended',
            'geom'         => 'nullable|array',
            'land_use_details' => 'nullable|array',
            'land_use_details.*.ky_hieu_mdsd' => 'required|string|max:50',
            'land_use_details.*.dien_tich' => 'required|numeric|min:0',
            'land_use_details.*.geometry' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $data = $validator->validated();

            // Xử lý trạng thái
            if (array_key_exists('ten_chu', $data)) {
                $data['status'] = !empty(trim($data['ten_chu'] ?? '')) ? 'owned' : 'available';
            }

            // ✅ Nếu thay đổi so_to hoặc so_thua -> tìm PlotList mới
            if (isset($data['so_to']) || isset($data['so_thua'])) {
                $plotList = PlotList::where('so_to', $data['so_to'] ?? $landPlot->so_to)
                    ->where('so_thua', $data['so_thua'] ?? $landPlot->so_thua)
                    ->first();

                if (!$plotList) {
                    throw new \Exception("Không tìm thấy PlotList tương ứng");
                }

                $data['plot_list_id'] = $plotList->id;
                $data['dien_tich'] = $plotList->dien_tich;
            }

            // ✅ Validate: Tổng diện tích details phải = plot_list.dien_tich
            if (isset($data['land_use_details']) && count($data['land_use_details']) > 0) {
                
                $detailTypes = array_column($data['land_use_details'], 'ky_hieu_mdsd');
                $mainTypes = $data['ky_hieu_mdsd'] ?? $landPlot->ky_hieu_mdsd;
                
                $missingTypes = array_diff($detailTypes, $mainTypes);
                if (!empty($missingTypes)) {
                    throw new \Exception(
                        "Loại đất trong chi tiết (" . implode(', ', $missingTypes) . ") không có trong loại đất chính"
                    );
                }

                // Validate tổng diện tích
                $totalDetailArea = array_sum(array_column($data['land_use_details'], 'dien_tich'));
                $plotListArea = floatval($landPlot->plotList->dien_tich ?? $data['dien_tich'] ?? $landPlot->dien_tich);
                
                if (abs($totalDetailArea - $plotListArea) > 0.01) {
                    throw new \Exception(
                        "Tổng diện tích chi tiết ({$totalDetailArea} m²) không khớp với diện tích PlotList ({$plotListArea} m²)"
                    );
                }
            }

            // ✅ Xử lý ky_hieu_mdsd - sử dụng mutator của model
            if (isset($data['ky_hieu_mdsd']) && is_array($data['ky_hieu_mdsd'])) {
                $landPlot->ky_hieu_mdsd = $data['ky_hieu_mdsd'];
                unset($data['ky_hieu_mdsd']);
            }

            // ✅ Xử lý GeoJSON cho land_plot chính
            if ($request->has('geom') && !empty($request->input('geom'))) {
                $geojson = json_encode($request->input('geom'));
                if ($geojson === false || $geojson === 'null') {
                    throw new \Exception('Invalid GeoJSON data');
                }
                
                // Cập nhật geometry trực tiếp
                DB::update('
                    UPDATE land_plots 
                    SET geom = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) 
                    WHERE id = ?
                ', [$geojson, $id]);
                
                unset($data['geom']);
            }

            // ✅ Cập nhật chi tiết diện tích - SỬA LỖI GEOMETRY
            if (isset($data['land_use_details']) && is_array($data['land_use_details'])) {
                // Xóa chi tiết cũ
                LandPlotDetail::where('land_plot_id', $id)->delete();

                // Thêm chi tiết mới
                foreach ($data['land_use_details'] as $detail) {
                    // ✅ Tạo land_plot_detail mới
                    $landPlotDetail = new LandPlotDetail();
                    $landPlotDetail->land_plot_id = $id;
                    $landPlotDetail->ky_hieu_mdsd = $detail['ky_hieu_mdsd'];
                    $landPlotDetail->dien_tich = $detail['dien_tich'];
                    $landPlotDetail->color = $this->getColorByLandType($detail['ky_hieu_mdsd']);
                    
                    // ✅ LƯU TRƯỚC để có ID
                    $landPlotDetail->save();

                    // ✅ Xử lý geometry cho từng detail - SỬ DỤNG DB QUERY TRỰC TIẾP
                    if (isset($detail['geometry']) && !empty($detail['geometry'])) {
                        $geometryJson = json_encode($detail['geometry']);
                        if ($geometryJson !== false && $geometryJson !== 'null') {
                            // Sử dụng DB query trực tiếp để cập nhật geometry
                            DB::update('
                                UPDATE land_plot_details 
                                SET geometry = ST_SetSRID(ST_GeomFromGeoJSON(?), 4326) 
                                WHERE id = ?
                            ', [$geometryJson, $landPlotDetail->id]);
                        }
                    }
                }

                unset($data['land_use_details']);
            }

            // ✅ Cập nhật land_plot
            $landPlot->update($data);
            
            DB::commit();

            // ✅ Load lại relationships với geometry
            $updatedLandPlot = land_plots::with(['plotList', 'landPlotDetails' => function($query) {
                $query->select('*', DB::raw('ST_AsGeoJSON(geometry) as geometry_json'));
            }])->find($id);

            // ✅ Xử lý geometry_json thành object
            if ($updatedLandPlot->landPlotDetails) {
                $updatedLandPlot->landPlotDetails->each(function($detail) {
                    if ($detail->geometry_json) {
                        $detail->geometry = json_decode($detail->geometry_json, true);
                    }
                    unset($detail->geometry_json);
                });
            }

            return response()->json([
                'success' => true,
                'message' => 'Land plot updated successfully',
                'data'    => $updatedLandPlot
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Land plot update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // public function destroy($id)
    // {
    //     $landPlot = land_plots::findOrFail($id);
    //     $landPlot->delete();

    //     return response()->json([
    //         'success' => true,
    //         'message' => 'Land plot deleted successfully'
    //     ], 200);
    // }

    public function destroy($id)
    {
        try {
            $landPlot = land_plots::findOrFail($id);
            
            DB::beginTransaction();
            
            // Xóa chi tiết trước
            DB::table('land_plot_details')->where('land_plot_id', $id)->delete();
            
            // Xóa land plot
            $landPlot->delete();
            
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Land plot deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Land plot delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa thửa đất'
            ], 500);
        }
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

    //         // Lấy dữ liệu với geom đã được chuyển đổi sang GeoJSON
    //         $plots = $query->select(
    //             '*',
    //             \DB::raw('ST_AsGeoJSON(geom) as geom_geojson')
    //         )->orderBy('id', 'desc')->get();

    //         // Chuyển đổi geom sang JSON object
    //         // $plots->transform(function ($plot) {
    //         //     if ($plot->geom_geojson) {
    //         //         $plot->geom = json_decode($plot->geom_geojson);
    //         //     } else {
    //         //         $plot->geom = null;
    //         //     }
    //         //     // Xóa trường geom_geojson tạm thời
    //         //     unset($plot->geom_geojson);
    //         //     return $plot;
    //         // });
    //         $plots->transform(function ($plot) {
    //             if ($plot->geom_geojson) {
    //                 $plot->geom = json_decode($plot->geom_geojson);
    //             } else {
    //                 $plot->geom = null;
    //             }
                
    //             // Chuyển đổi ky_hieu_mdsd từ JSON string sang array
    //             if (is_string($plot->ky_hieu_mdsd)) {
    //                 $plot->ky_hieu_mdsd = json_decode($plot->ky_hieu_mdsd, true) ?? [];
    //             }
                
    //             unset($plot->geom_geojson);
    //             return $plot;
    //         });

    //         // Thêm thông tin về loại tìm kiếm
    //         $searchType = ($hasPhuongXa && $hasSoTo && $hasSoThua) ? 'exact' : 'suggest';

    //         return response()->json([
    //             'success' => true,
    //             'data' => $plots,
    //             'total' => $plots->count(),
    //             'search_type' => $searchType,
    //             'message' => $searchType === 'exact' 
    //                 ? 'Tìm kiếm chính xác' 
    //                 : 'Tìm kiếm gợi ý - Vui lòng chọn kết quả phù hợp'
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

        // Tìm kiếm chính (không bắt buộc tất cả)
        $searchConditions = false;

        if ($request->filled('phuong_xa')) {
            $query->where('phuong_xa', 'ILIKE', "%{$request->input('phuong_xa')}%");
            $searchConditions = true;
        }

        if ($request->filled('so_to')) {
            $query->where('so_to', $request->input('so_to'));
            $searchConditions = true;
        }

        if ($request->filled('so_thua')) {
            $query->where('so_thua', $request->input('so_thua'));
            $searchConditions = true;
        }

        // Tìm kiếm chung (có thể dùng độc lập)
        if ($request->filled('query')) {
            $searchTerm = $request->input('query');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('ten_chu', 'ILIKE', "%{$searchTerm}%")
                  ->orWhere('so_thua', 'ILIKE', "%{$searchTerm}%")
                  ->orWhere('so_to', 'ILIKE', "%{$searchTerm}%")
                  ->orWhere('phuong_xa', 'ILIKE', "%{$searchTerm}%")
                  ->orWhere('ky_hieu_mdsd', 'ILIKE', "%{$searchTerm}%");
                // Xóa organization_name và dia_chi_thua_dat vì không có trong bảng land_plots
            });
            $searchConditions = true;
        }

        // Kiểm tra nếu không có điều kiện tìm kiếm nào
        if (!$searchConditions) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng nhập ít nhất một thông tin tìm kiếm'
            ], 400);
        }

        // Lấy dữ liệu với geom đã được chuyển đổi sang GeoJSON
        $plots = $query->select(
            'id',
            'plot_list_id', 
            'ten_chu',
            'so_to',
            'so_thua',
            'ky_hieu_mdsd',
            'phuong_xa',
            'status',
            'created_at',
            'updated_at',
            'dien_tich',
            \DB::raw('ST_AsGeoJSON(geom) as geom_geojson')
        )->orderBy('id', 'desc')->get();

        // Parse dữ liệu
        $plots->transform(function ($plot) {
            // Xử lý geom
            if ($plot->geom_geojson) {
                try {
                    $plot->geom = json_decode($plot->geom_geojson);
                } catch (\Exception $e) {
                    $plot->geom = null;
                }
            } else {
                $plot->geom = null;
            }
            
            // Chuyển đổi ky_hieu_mdsd từ PostgreSQL array literal sang array
            if (is_string($plot->ky_hieu_mdsd)) {
                try {
                    $cleaned = trim($plot->ky_hieu_mdsd, '{}');
                    $plot->ky_hieu_mdsd = !empty($cleaned) ? explode(',', $cleaned) : [];
                } catch (\Exception $e) {
                    $plot->ky_hieu_mdsd = [];
                }
            } elseif ($plot->ky_hieu_mdsd === null) {
                $plot->ky_hieu_mdsd = [];
            }
            
            unset($plot->geom_geojson);
            return $plot;
        });

        return response()->json([
            'success' => true,
            'data' => $plots,
            'total' => $plots->count(),
            'message' => 'Tìm kiếm thành công'
        ]);
    } catch (\Exception $e) {
        \Log::error('Search error: ' . $e->getMessage());
        \Log::error('Search trace: ' . $e->getTraceAsString());
        \Log::error('Search request: ' . json_encode($request->all()));
        
        return response()->json([
            'success' => false, 
            'message' => 'Có lỗi xảy ra khi tìm kiếm: ' . $e->getMessage()
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

    public function checkOverlap(Request $request)
    {
        try {
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

            $soTo = $request->input('so_to');
            $soThua = $request->input('so_thua');

            // Lấy tất cả các thửa có cùng số tờ, số thửa
            $overlappingPlots = DB::table('land_plots as lp')
                ->leftJoin('plot_lists as pl', function ($join) {
                    $join->on(DB::raw('lp.so_to::text'), '=', DB::raw('pl.so_to::text'))
                         ->on(DB::raw('lp.so_thua::text'), '=', DB::raw('pl.so_thua::text'));
                })
                ->select(
                    'lp.id',
                    'lp.ten_chu',
                    'lp.so_to',
                    'lp.so_thua',
                    'lp.ky_hieu_mdsd',
                    'lp.phuong_xa',
                    'lp.status',
                    'pl.dien_tich',
                    'pl.dien_tich as plot_list_dien_tich',
                    'pl.organization_name',
                    DB::raw('ST_AsGeoJSON(lp.geom) as geometry'),
                    DB::raw('ROW_NUMBER() OVER (ORDER BY lp.id) as display_order')
                )
                ->where('lp.so_to', $soTo)
                ->where('lp.so_thua', $soThua)
                ->whereNotNull('lp.geom')
                ->get();

            // Phân tích chồng lấn spatial
            $spatialOverlaps = [];
            $overlapGroups = [];

            if ($overlappingPlots->count() > 1) {
                foreach ($overlappingPlots as $i => $plot1) {
                    for ($j = $i + 1; $j < $overlappingPlots->count(); $j++) {
                        $plot2 = $overlappingPlots[$j];
                        
                        // Kiểm tra chồng lấn spatial
                        $overlapResult = DB::selectOne("
                            SELECT ST_Overlaps(
                                ST_GeomFromGeoJSON(?), 
                                ST_GeomFromGeoJSON(?)
                            ) as is_overlap
                        ", [$plot1->geometry, $plot2->geometry]);
                        
                        if ($overlapResult->is_overlap) {
                            $spatialOverlaps[] = [
                                'plot1_id' => $plot1->id,
                                'plot2_id' => $plot2->id,
                                'plot1_type' => $plot1->ky_hieu_mdsd,
                                'plot2_type' => $plot2->ky_hieu_mdsd
                            ];
                        }
                    }
                }

                // Nhóm các thửa chồng lấn
                $overlapGroups = $this->groupOverlappingPlots($overlappingPlots);
            }

            return response()->json([
                'success' => true,
                'overlapping_plots' => $overlappingPlots,
                'spatial_overlaps' => $spatialOverlaps,
                'overlap_groups' => $overlapGroups,
                'total_found' => $overlappingPlots->count(),
                'has_overlap' => count($spatialOverlaps) > 0 || $overlappingPlots->count() > 1,
                'suggested_display' => $overlappingPlots->count() > 1 ? 'alternating' : 'single'
            ]);

        } catch (\Exception $e) {
            Log::error('Overlap check error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi kiểm tra chồng lấn: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getOverlapGroup(Request $request)
    {
        try {
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

            $soTo = $request->input('so_to');
            $soThua = $request->input('so_thua');

            Log::info("Getting overlap group for so_to: {$soTo}, so_thua: {$soThua}");

            // Lấy PlotList
            $plotList = PlotList::where('so_to', $soTo)
                ->where('so_thua', $soThua)
                ->first();

            $plots = DB::table('land_plots as lp')
                ->leftJoin('plot_lists as pl', 'lp.plot_list_id', '=', 'pl.id')
                ->select(
                    'lp.id',
                    'lp.ten_chu',
                    'lp.so_to',
                    'lp.so_thua',
                    'lp.ky_hieu_mdsd',
                    'lp.phuong_xa',
                    'lp.status',
                    'pl.dien_tich as plot_list_dien_tich',
                    'pl.organization_name',
                    DB::raw('ST_AsGeoJSON(lp.geom) as geometry'),
                    DB::raw('ROW_NUMBER() OVER (ORDER BY lp.id) as display_order')
                )
                ->where('lp.so_to', $soTo)
                ->where('lp.so_thua', $soThua)
                ->whereNotNull('lp.geom')
                ->get();

            $features = [];
            foreach ($plots as $plot) {
                $geometry = json_decode($plot->geometry, true);
                if (!$geometry) continue;

                // Chuyển đổi ky_hieu_mdsd từ JSON string sang array
                $landTypes = is_string($plot->ky_hieu_mdsd) 
                    ? json_decode($plot->ky_hieu_mdsd, true) ?? []
                    : $plot->ky_hieu_mdsd;

                // Lấy chi tiết diện tích
                $landUseDetails = DB::table('land_plot_details')
                    ->where('land_plot_id', $plot->id)
                    ->get();

                $areas = [];
                $colors = [];
                $subGeometries = [];

                if ($landUseDetails->count() > 0) {
                    // Có chi tiết phân chia
                    foreach ($landUseDetails as $detail) {
                        $areas[] = floatval($detail->dien_tich);
                        $colors[] = $detail->color ?? $this->getColorByLandType($detail->ky_hieu_mdsd);
                        
                        // Lấy geometry từ detail nếu có
                        if ($detail->geometry) {
                            $detailGeometry = DB::table('land_plot_details')
                                ->where('id', $detail->id)
                                ->value(DB::raw('ST_AsGeoJSON(geometry)'));
                            
                            if ($detailGeometry) {
                                $subGeometries[] = [
                                    'geometry' => json_decode($detailGeometry, true),
                                    'ky_hieu_mdsd' => $detail->ky_hieu_mdsd,
                                    'dien_tich' => floatval($detail->dien_tich),
                                    'color' => $detail->color ?? $this->getColorByLandType($detail->ky_hieu_mdsd)
                                ];
                            }
                        }
                    }
                    $totalArea = array_sum($areas);
                } else {
                    // Không có chi tiết -> chia đều
                    $totalArea = floatval($plot->plot_list_dien_tich ?? 0);
                    $count = count($landTypes);
                    $areas = $count > 0 ? array_fill(0, $count, $totalArea / $count) : [];
                    $colors = array_map([$this, 'getColorByLandType'], $landTypes);

                    // Tạo sub geometries từ geometry chính
                    foreach ($landTypes as $index => $landType) {
                        $subGeometries[] = [
                            'geometry' => $geometry,
                            'ky_hieu_mdsd' => $landType,
                            'dien_tich' => $areas[$index] ?? 0,
                            'color' => $colors[$index] ?? '#868e96'
                        ];
                    }
                }

                // Đảm bảo sub_geometries không rỗng
                if (empty($subGeometries)) {
                    $subGeometries[] = [
                        'geometry' => $geometry,
                        'ky_hieu_mdsd' => implode('+', $landTypes),
                        'dien_tich' => $totalArea ?? 0,
                        'color' => $this->getColorByLandType($landTypes[0] ?? '')
                    ];
                }

                $features[] = [
                    'type' => 'Feature',
                    'properties' => [
                        'id' => $plot->id,
                        'land_type' => implode('+', $landTypes),
                        'land_types' => $landTypes,
                        'areas' => $areas,
                        'total_area' => $totalArea ?? 0,
                        'owner' => $plot->ten_chu,
                        'status' => $plot->status,
                        'display_order' => $plot->display_order,
                        'colors' => $colors,
                        'primary_color' => $colors[0] ?? '#868e96',
                        'organization_name' => $plot->organization_name,
                        'phuong_xa' => $plot->phuong_xa,
                        'area_percentages' => array_map(function($area) use ($totalArea) {
                            return $totalArea > 0 ? round(($area / $totalArea) * 100, 2) : 0;
                        }, $areas)
                    ],
                    'sub_geometries' => $subGeometries
                ];
            }

            return response()->json([
                'success' => true,
                'type' => 'FeatureCollection',
                'features' => $features,
                'overlap_group' => [
                    'so_to' => $soTo,
                    'so_thua' => $soThua,
                    'total_plots' => count($features),
                    'plot_list_total_area' => $plotList ? floatval($plotList->dien_tich) : null,
                    'land_types' => $plots->pluck('ky_hieu_mdsd')->unique()->values(),
                    'has_overlap' => count($features) > 1
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get overlap group error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi lấy nhóm chồng lấn: ' . $e->getMessage()
            ], 500);
        }
    }

    // ✅ Hàm mới để chia geometry (thêm vào class)
    private function splitGeometry($geometry, $areaRatios)
    {
        $count = count($areaRatios);
        if ($count < 1 || !$geometry) return [];

        try {
            // ✅ SỬA: Ép kiểu rõ ràng cho geometry
            $sridResult = DB::selectOne("SELECT ST_SRID(?::geometry) as srid", [$geometry]);
            $srid = $sridResult->srid ?? 4326;

            // Lấy bounding box
            $bbox = DB::selectOne("
                SELECT 
                    ST_XMin(ST_Envelope(?::geometry)) as xmin, 
                    ST_YMin(ST_Envelope(?::geometry)) as ymin, 
                    ST_XMax(ST_Envelope(?::geometry)) as xmax, 
                    ST_YMax(ST_Envelope(?::geometry)) as ymax
            ", [$geometry]);
            
            if (!$bbox) {
                Log::error('Failed to get bounding box');
                return $this->createMockSubGeometries($geometry, $areaRatios);
            }

            // Tạo LineString với cùng SRID
            $x1 = $bbox->xmin + ($bbox->xmax - $bbox->xmin) * ($areaRatios[0] ?? 0.5);
            
            $splitLine = DB::selectOne("
                SELECT ST_SetSRID(ST_MakeLine(ST_Point(?, ?), ST_Point(?, ?)), ?)::geometry as line
            ", [$x1, $bbox->ymin, $x1, $bbox->ymax, $srid])->line;

            if (!$splitLine) {
                Log::error('Failed to create split line');
                return $this->createMockSubGeometries($geometry, $areaRatios);
            }

            // Chia geometry
            $parts = DB::select("
                SELECT ST_AsGeoJSON(geom) as geojson 
                FROM ST_Dump(ST_Split(?::geometry, ?::geometry))
            ", [$geometry, $splitLine]);
            
            $subGeoms = [];
            foreach ($parts as $part) {
                if ($part->geojson) {
                    $decodedGeom = json_decode($part->geojson, true);
                    if ($decodedGeom) {
                        $subGeoms[] = $decodedGeom;
                    }
                }
            }

            // ✅ QUAN TRỌNG: Đảm bảo số lượng sub-geometries khớp với số lượng areaRatios
            if (count($subGeoms) !== $count) {
                Log::warning("Number of sub-geometries (" . count($subGeoms) . ") doesn't match areaRatios count ($count), using fallback");
                return $this->createMockSubGeometries($geometry, $areaRatios);
            }

            Log::info("Successfully split geometry into " . count($subGeoms) . " parts");
            return $subGeoms;

        } catch (\Exception $e) {
            Log::error('Error splitting geometry: ' . $e->getMessage());
            return $this->createMockSubGeometries($geometry, $areaRatios);
        }
    }

    private function createMockSubGeometries($geometry, $areaRatios)
    {
        try {
            $subGeoms = [];
            $count = count($areaRatios);
            
            if ($count <= 0) {
                return [];
            }
            
            // Lấy geometry gốc
            $originalGeom = DB::selectOne("SELECT ST_AsGeoJSON(?::geometry) as geojson", [$geometry]);
            if (!$originalGeom || !$originalGeom->geojson) {
                return [];
            }

            $baseGeometry = json_decode($originalGeom->geojson, true);
            if (!$baseGeometry) {
                return [];
            }
            
            // Tạo số lượng sub-geometries chính xác theo areaRatios
            for ($i = 0; $i < $count; $i++) {
                $subGeoms[] = $baseGeometry;
            }

            Log::info("Created {$count} mock sub-geometries as fallback");
            return $subGeoms;

        } catch (\Exception $e) {
            Log::error('Error creating mock geometries: ' . $e->getMessage());
            return [];
        }
    }

    private function groupOverlappingPlots($plots)
    {
        $groups = [];
        
        foreach ($plots as $plot) {
            $key = $plot->so_to . '-' . $plot->so_thua;
            if (!isset($groups[$key])) {
                $groups[$key] = [];
            }
            
            $groups[$key][] = [
                'id' => $plot->id,
                'land_type' => $plot->ky_hieu_mdsd,
                'color' => $this->getColorByLandType($plot->ky_hieu_mdsd),
                'area' => $plot->dien_tich ?: $plot->plot_list_dien_tich,
                'owner' => $plot->ten_chu,
                'display_order' => $plot->display_order
            ];
        }
        
        return $groups;
    }

    private function getColorByLandType($landType)
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
            'KNT' => '#228be6', 'CAN' => '#9d5d1962'
        ];
        
        return $colors[trim($landType)] ?? '#868e96';
    }

    // public function search(Request $request)
    // {
    //     try {
    //         $query = land_plots::query();

    //         // Kiểm tra điều kiện tìm kiếm
    //         $hasPhuongXa = $request->has('phuong_xa') && !empty($request->input('phuong_xa'));
    //         $hasSoTo = $request->has('so_to') && !empty($request->input('so_to'));
    //         $hasSoThua = $request->has('so_thua') && !empty($request->input('so_thua'));

    //         // Áp dụng điều kiện tìm kiếm
    //         if ($hasPhuongXa) {
    //             $query->where('phuong_xa', 'ILIKE', "%{$request->input('phuong_xa')}%");
    //         }

    //         if ($hasSoTo) {
    //             $query->where('so_to', $request->input('so_to'));
    //         }

    //         if ($hasSoThua) {
    //             $query->where('so_thua', $request->input('so_thua'));
    //         }

    //         if (!$hasPhuongXa && !$hasSoTo && !$hasSoThua) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Vui lòng nhập ít nhất một thông tin: Phường/Xã, Số tờ hoặc Số thửa'
    //             ], 400);
    //         }

    //         if ($request->has('query') && !empty($request->input('query'))) {
    //             $searchTerm = $request->input('query');
    //             $query->where(function ($q) use ($searchTerm) {
    //                 $q->where('ten_chu', 'ILIKE', "%{$searchTerm}%")
    //                 ->orWhere('ky_hieu_mdsd', 'ILIKE', "%{$searchTerm}%");
    //             });
    //         }

    //         // Lấy dữ liệu với geom
    //         $plots = $query->select(
    //             '*',
    //             \DB::raw('ST_AsGeoJSON(geom) as geom_geojson')
    //         )->orderBy('id', 'desc')->get();

    //         // Chuyển đổi geom
    //         $plots->transform(function ($plot) {
    //             if ($plot->geom_geojson) {
    //                 $plot->geom = json_decode($plot->geom_geojson);
    //             } else {
    //                 $plot->geom = null;
    //             }
    //             unset($plot->geom_geojson);
    //             return $plot;
    //         });

    //         $searchType = ($hasPhuongXa && $hasSoTo && $hasSoThua) ? 'exact' : 'suggest';

    //         // Kiểm tra chồng lấn nếu có kết quả
    //         $overlapInfo = [];
    //         if ($plots->count() > 0 && $hasSoTo && $hasSoThua) {
    //             $overlapCheck = $this->checkOverlap($request);
    //             $overlapData = json_decode($overlapCheck->getContent(), true);
    //             $overlapInfo = $overlapData['success'] ? $overlapData : [];
    //         }

    //         return response()->json([
    //             'success' => true,
    //             'data' => $plots,
    //             'total' => $plots->count(),
    //             'search_type' => $searchType,
    //             'overlap_info' => $overlapInfo,
    //             'message' => $searchType === 'exact' 
    //                 ? 'Tìm kiếm chính xác' 
    //                 : 'Tìm kiếm gợi ý - Vui lòng chọn kết quả phù hợp'
    //         ]);

    //     } catch (\Exception $e) {
    //         Log::error('Search error: ' . $e->getMessage());
    //         return response()->json([
    //             'success' => false, 
    //             'message' => 'Có lỗi xảy ra khi tìm kiếm'
    //         ], 500);
    //     }
    // }
}
