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
    /**
     * Xây dựng query chung cho index & search
     */
    private function buildLandPlotQuery(Request $request)
    {
        $query = DB::table('land_plots as lp')
            ->leftJoin('plot_lists as pl', 'lp.plot_list_id', '=', 'pl.id')
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
                'lp.dien_tich',
                'pl.dien_tich as plot_list_dien_tich',
                'pl.organization_name',
                'pl.dia_chi_thua_dat',
                'pl.xa',
                DB::raw('CASE 
                    WHEN lp.geom IS NOT NULL THEN ST_AsGeoJSON(lp.geom) 
                    ELSE NULL 
                END as geom'),
                DB::raw('ST_X(ST_Centroid(lp.geom)) AS lng'),
                DB::raw('ST_Y(ST_Centroid(lp.geom)) AS lat')
            );

        // === FILTER: PHƯỜNG/XÃ (chuẩn hóa, không phân biệt hoa/thường/dấu) ===
        if ($request->filled('phuong_xa')) {
            $phuong = $request->input('phuong_xa');
            $query->whereRaw("
                LOWER(REGEXP_REPLACE(lp.phuong_xa, '^(Phường|phường|Phuong|phuong|Xã|xã|Xa|xa)\\s*', '')) 
                ILIKE LOWER(?)
            ", ['%' . preg_replace('/^(Phường|phường|Phuong|phuong|Xã|xã|Xa|xa)\\s*/i', '', $phuong) . '%']);
        }

        // === FILTER: SỐ TỜ & SỐ THỬA ===
        if ($request->filled('so_to')) {
            $query->where('lp.so_to', $request->input('so_to'));
        }

        if ($request->filled('so_thua')) {
            $query->where('lp.so_thua', $request->input('so_thua'));
        }

        return $query;
    }

    /**
     * Xử lý land_use_details với eager loading (tránh N+1 query)
     */
    private function processPlotsWithDetails($landPlots)
    {
        if ($landPlots->isEmpty()) {
            return $landPlots;
        }

        // === EAGER LOAD land_plot_details (1 query thay vì N query) ===
        $plotIds = $landPlots->pluck('id')->toArray();
        
        $allDetails = DB::table('land_plot_details')
            ->whereIn('land_plot_id', $plotIds)
            ->select(
                'id', 
                'land_plot_id', 
                'ky_hieu_mdsd', 
                'dien_tich', 
                'color',
                DB::raw('CASE 
                    WHEN geometry IS NOT NULL THEN ST_AsGeoJSON(geometry) 
                    ELSE NULL 
                END as geometry_geojson')
            )
            ->orderBy('id', 'asc')
            ->get()
            ->groupBy('land_plot_id');

        // === XỬ LÝ DỮ LIỆU ===
        return $landPlots->map(function ($plot) use ($allDetails) {
            // 1. Xử lý geom
            if ($plot->geom && is_string($plot->geom)) {
                try {
                    $plot->geom = json_decode($plot->geom, true);
                } catch (\Exception $e) {
                    Log::warning("Failed to parse geom JSON for plot {$plot->id}: " . $e->getMessage());
                    $plot->geom = null;
                }
            } else {
                $plot->geom = null;
            }

            // 2. Xử lý ky_hieu_mdsd
            if (is_string($plot->ky_hieu_mdsd) && str_starts_with($plot->ky_hieu_mdsd, '{')) {
                $cleaned = trim($plot->ky_hieu_mdsd, '{}"');
                $plot->ky_hieu_mdsd = $cleaned ? explode(',', $cleaned) : [];
            } else {
                $plot->ky_hieu_mdsd = $plot->ky_hieu_mdsd ?? [];
            }

            // 3. land_use_details từ eager loaded data
            $details = $allDetails->get($plot->id, collect());
            $plot->land_use_details = $details->map(function ($d) {
                $detail = (object) [
                    'id' => $d->id,
                    'ky_hieu_mdsd' => $d->ky_hieu_mdsd,
                    'dien_tich' => $d->dien_tich,
                    'color' => $d->color,
                    'geometry' => null
                ];

                if ($d->geometry_geojson && is_string($d->geometry_geojson)) {
                    try {
                        $detail->geometry = json_decode($d->geometry_geojson, true);
                    } catch (\Exception $e) {
                        Log::warning("Failed to parse detail geometry JSON: " . $e->getMessage());
                        $detail->geometry = null;
                    }
                }

                return $detail;
            })->values()->toArray();

            // 4. dien_tich_total
            $plot->dien_tich_total = $plot->plot_list_dien_tich > 0
                ? floatval($plot->plot_list_dien_tich)
                : (collect($plot->land_use_details)->sum('dien_tich') ?: ($plot->dien_tich ?: 0));
            
            $plot->dien_tich_total = max(0, round($plot->dien_tich_total, 2));

            return $plot;
        });
    }
    // public function index()
    // {
    //     try {
    //         $landPlots = DB::table('land_plots as lp')
    //             ->leftJoin('plot_lists as pl', 'lp.plot_list_id', '=', 'pl.id')
    //             ->select(
    //                 'lp.*',
    //                 'pl.dien_tich as plot_list_dien_tich',
    //                 'pl.organization_name',
    //                 'pl.dia_chi_thua_dat',
    //                 'pl.xa',
    //                 DB::raw('ST_X(ST_Centroid(lp.geom)) AS lng'),
    //                 DB::raw('ST_Y(ST_Centroid(lp.geom)) AS lat')
    //             )
    //             ->orderBy('lp.id', 'desc')
    //             ->get();

    //         foreach ($landPlots as $plot) {
    //             // ✅ Parse PostgreSQL array literal
    //             $kyHieuMdsd = $plot->ky_hieu_mdsd;
    //             if ($kyHieuMdsd && is_string($kyHieuMdsd)) {
    //                 $cleaned = trim($kyHieuMdsd, '{}"');
    //                 $plot->ky_hieu_mdsd = $cleaned ? explode(',', $cleaned) : [];
    //             } else {
    //                 $plot->ky_hieu_mdsd = [];
    //             }

    //             // ✅ Lấy land_use_details
    //             $landUseDetails = DB::table('land_plot_details')
    //                 ->where('land_plot_id', $plot->id)
    //                 ->select('id', 
    //                 'ky_hieu_mdsd', 
    //                 'dien_tich', 
    //                 'color', 
    //                 // 'geometry'
    //                 // DB::raw(('ST_AsGeoJSON(geometry) as geometry'))
    //                 DB::raw('CASE
    //                     WHEN geometry IS NULL THEN NULL
    //                     ELSE ST_AsGeoJSON(geometry)
    //                 END AS geometry')
    //                 )
    //                 ->orderBy('id', 'asc')
    //                 ->get()
    //                 ->map(function ($detail) {
    //                 // Chuyển đổi geometry từ GeoJSON string sang object
    //                     if ($detail->geometry && is_string($detail->geometry)) {
    //                         try {
    //                             $parsedGeometry = json_decode($detail->geometry);
    //                             if (json_last_error() === JSON_ERROR_NONE) {
    //                                 $detail->geometry = $parsedGeometry;
    //                             } else {
    //                                 $detail->geometry = null;
    //                             }
    //                         } catch (\Exception $e) {
    //                             Log::warning("Failed to parse geometry JSON for detail {$detail->id}: " . $e->getMessage());
    //                             $detail->geometry = null;
    //                         }
    //                     } else {
    //                         $detail->geometry = null;
    //                     }
    //                     return $detail;
    //                 })
    //                 ->toArray();

    //             $plot->land_use_details = $landUseDetails;
                
    //             if(!empty($landUseDetails)){
    //                 Log::info("Plot {$plot->id} land_use_details geometry:", [
    //                     'count' => count($landUseDetails),
    //                     'geometries' => array_map(function($detail) {
    //                         return [
    //                             'id' => $detail->id,
    //                             'has_geometry' => !empty($detail->geometry),
    //                             'geometry_type' => $detail->geometry ? gettype($detail->geometry) : 'null'
    //                         ];
    //                     }, $landUseDetails)
    //                 ]);
    //             }

    //             // ✅ LOGIC TÍNH DIỆN TÍCH TỔNG THEO THỨ TỰ ƯU TIÊN:
    //             // 1. Nếu có plot_list_dien_tich -> dùng cái này
    //             // 2. Nếu có land_use_details và có diện tích -> tính tổng chi tiết
    //             // 3. Nếu không có cả hai -> dùng dien_tich chung
    //             // 4. Mặc định: 0
                
    //             if ($plot->plot_list_dien_tich && $plot->plot_list_dien_tich > 0) {
    //                 // Ưu tiên 1: Diện tích từ plot_list
    //                 $plot->dien_tich_total = floatval($plot->plot_list_dien_tich);
    //             } elseif (!empty($plot->land_use_details)) {
    //                 // Ưu tiên 2: Tính tổng diện tích từ chi tiết
    //                 $totalDetailArea = array_sum(array_column($plot->land_use_details, 'dien_tich'));
    //                 if ($totalDetailArea > 0) {
    //                     $plot->dien_tich_total = $totalDetailArea;
    //                 } else {
    //                     // Nếu chi tiết có nhưng diện tích = 0, dùng dien_tich chung
    //                     $plot->dien_tich_total = $plot->dien_tich ? floatval($plot->dien_tich) : 0;
    //                 }
    //             } else {
    //                 // Ưu tiên 3: Dùng dien_tich chung
    //                 $plot->dien_tich_total = $plot->dien_tich ? floatval($plot->dien_tich) : 0;
    //             }

    //             // Đảm bảo diện tích tổng không âm
    //             $plot->dien_tich_total = max(0, $plot->dien_tich_total);

    //             // Debug log
    //             Log::info("Plot {$plot->id}: " . 
    //                     "plot_list_dien_tich = {$plot->plot_list_dien_tich}, " .
    //                     "land_use_details_count = " . count($plot->land_use_details) . ", " .
    //                     "dien_tich = {$plot->dien_tich}, " .
    //                     "dien_tich_total = {$plot->dien_tich_total}");
    //         }

    //         return response()->json([
    //             'success' => true,
    //             'data' => $landPlots
    //         ], 200);

    //     } catch (\Exception $e) {
    //         Log::error('LandPlots index error: ' . $e->getMessage());
    //         return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    //     }
    // }
    public function index(Request $request)
    {
        try {
            Log::info("=== START LAND PLOTS INDEX ===", $request->all());

            $query = $this->buildLandPlotQuery($request);
            
            // Pagination chỉ khi có request per_page (cho admin/management pages)
            // Frontend map không dùng pagination nên sẽ get tất cả
            $usePagination = $request->has('per_page') && $request->get('per_page') > 0;
            $paginator = null;
            
            if ($usePagination) {
                $perPage = $request->get('per_page', 20);
                $paginator = $query->orderBy('lp.id', 'desc')->paginate($perPage);
                $landPlots = collect($paginator->items());
            } else {
                $landPlots = $query->orderBy('lp.id', 'desc')->get();
            }

            // Xử lý với eager loading (tránh N+1 query)
            $processedPlots = $this->processPlotsWithDetails($landPlots);

            Log::info("=== END LAND PLOTS INDEX ===", [
                'total_processed' => $processedPlots->count()
            ]);

            // Xác định loại tìm kiếm
            $hasFilter = $request->filled('phuong_xa') || $request->filled('so_to') || $request->filled('so_thua');
            $searchType = $hasFilter
                ? ($request->filled('so_to') && $request->filled('so_thua') ? 'exact' : 'filtered')
                : 'all';

            $response = [
                'success' => true,
                'data' => $processedPlots->values(),
                'search_type' => $searchType,
                'total' => $usePagination && $paginator ? $paginator->total() : $processedPlots->count()
            ];

            // Thêm pagination info nếu có
            if ($usePagination && $paginator) {
                $response['pagination'] = [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total()
                ];
            }

            return response()->json($response, 200);

        } catch (\Exception $e) {
            Log::error('LandPlots index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống. Vui lòng thử lại sau.'
            ], 500);
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
            'land_use_details.*.color' => 'nullable|string|max:50',
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

            // Đồng bộ ky_hieu_mdsd với land_use_details
            if (isset($data['land_use_details']) && count($data['land_use_details']) > 0) {
                $detailTypes = array_column($data['land_use_details'], 'ky_hieu_mdsd');
                $mainTypes = $data['ky_hieu_mdsd'];
                $allLandTypes = array_unique(array_merge($mainTypes, $detailTypes));
                $data['ky_hieu_mdsd'] = $allLandTypes; // Cập nhật ky_hieu_mdsd trước khi kiểm tra

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
                    // Log::info("🔄 Processing land_use_detail {$index}:", [
                    //     'ky_hieu_mdsd' => $detail['ky_hieu_mdsd'],
                    //     'color_from_request' => $detail['color'] ?? 'NOT_PROVIDED'
                    // ]);

                    $landPlotDetail = new LandPlotDetail();
                    $landPlotDetail->land_plot_id = $landPlot->id;
                    $landPlotDetail->ky_hieu_mdsd = $detail['ky_hieu_mdsd'];
                    $landPlotDetail->dien_tich = $detail['dien_tich'];
                    // $landPlotDetail->color = $detail['color'] ?? $this->getColorByLandType($detail['ky_hieu_mdsd']);
                     // ✅ CHUẨN HÓA MÀU: hỗ trợ cả hex và rgba
                    $landPlotDetail->color = $this->normalizeColor($detail['color'] ?? null);

                    $landPlotDetail->save();
                    
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
                              
                            Log::info("✅ Saved geometry for detail ID: " . $landPlotDetail->id, [
                                'geometry_json' => $geometryJson
                            ]);
                        }

                    }else {
                        Log::info("❌ No geometry provided for detail ID: " . $landPlotDetail->id);
                    }     
                    
                    // $landPlotDetail->color = $detail['color'] ?? $this->getColorByLandType($detail['ky_hieu_mdsd']);
                    // $landPlotDetail->save();
                }
            }

            DB::commit();

            // $landPlot->load(['plotList', 'landPlotDetails']);

             // ✅ Load lại với geometry
            $landPlot->load(['plotList', 'landPlotDetails' => function($query) {
                $query->select('*', DB::raw('ST_AsGeoJSON(geometry) as geometry_json'));
            }]);

            // DB::commit();

             // ✅ Xử lý geometry_json thành object
            if ($landPlot->landPlotDetails) {
                $landPlot->landPlotDetails->each(function($detail) {
                    if ($detail->geometry_json) {
                        $detail->geometry = json_decode($detail->geometry_json, true);
                    }
                    unset($detail->geometry_json);
                });
            }

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
            'land_use_details.*.color' => 'nullable|string|max:50',
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

            // Đồng bộ ky_hieu_mdsd với land_use_details
            if (isset($data['land_use_details']) && count($data['land_use_details']) > 0) {
                $detailTypes = array_column($data['land_use_details'], 'ky_hieu_mdsd');
                $mainTypes = $data['ky_hieu_mdsd'] ?? $landPlot->ky_hieu_mdsd;
                $allLandTypes = array_unique(array_merge($mainTypes, $detailTypes));
                $data['ky_hieu_mdsd'] = $allLandTypes; // Cập nhật ky_hieu_mdsd trước khi kiểm tra

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
                    // $landPlotDetail->color = $this->getColorByLandType($detail['ky_hieu_mdsd']);
                    // / ✅ CHUẨN HÓA MÀU: hỗ trợ cả hex và rgba
                    $landPlotDetail->color = $this->normalizeColor($detail['color'] ?? null);

                    // ✅ LƯU TRƯỚC để có ID
                    $landPlotDetail->save();

                    Log::info("✅ Saved land_use_detail:", [
                        'id' => $landPlotDetail->id,
                        'ky_hieu_mdsd' => $detail['ky_hieu_mdsd'],
                        'color' => $landPlotDetail->color,
                        'color_type' => $this->getColorType($landPlotDetail->color)
                    ]);

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
                            Log::info("✅ Updated geometry for detail ID: " . $landPlotDetail->id, [
                                'geometry_json' => $geometryJson
                            ]);
                        }
                    }else {
                        Log::info("❌ No geometry provided for detail ID: " . $landPlotDetail->id);
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

    //         // Tìm kiếm chính (không bắt buộc tất cả)
    //         $searchConditions = false;

    //         if ($request->filled('phuong_xa')) {
    //             $query->where('phuong_xa', 'ILIKE', "%{$request->input('phuong_xa')}%");
    //             $searchConditions = true;
    //         }

    //         if ($request->filled('so_to')) {
    //             $query->where('so_to', $request->input('so_to'));
    //             $searchConditions = true;
    //         }

    //         if ($request->filled('so_thua')) {
    //             $query->where('so_thua', $request->input('so_thua'));
    //             $searchConditions = true;
    //         }

    //         // Tìm kiếm chung (có thể dùng độc lập)
    //         if ($request->filled('query')) {
    //             $searchTerm = $request->input('query');
    //             $query->where(function ($q) use ($searchTerm) {
    //                 $q->where('ten_chu', 'ILIKE', "%{$searchTerm}%")
    //                 ->orWhere('so_thua', 'ILIKE', "%{$searchTerm}%")
    //                 ->orWhere('so_to', 'ILIKE', "%{$searchTerm}%")
    //                 ->orWhere('phuong_xa', 'ILIKE', "%{$searchTerm}%")
    //                 ->orWhere('ky_hieu_mdsd', 'ILIKE', "%{$searchTerm}%");
    //                 // Xóa organization_name và dia_chi_thua_dat vì không có trong bảng land_plots
    //             });
    //             $searchConditions = true;
    //         }

    //         // Kiểm tra nếu không có điều kiện tìm kiếm nào
    //         if (!$searchConditions) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Vui lòng nhập ít nhất một thông tin tìm kiếm'
    //             ], 400);
    //         }

    //         // Lấy dữ liệu với geom đã được chuyển đổi sang GeoJSON
    //         $plots = $query->select(
    //             'id',
    //             'plot_list_id', 
    //             'ten_chu',
    //             'so_to',
    //             'so_thua',
    //             'ky_hieu_mdsd',
    //             'phuong_xa',
    //             'status',
    //             'created_at',
    //             'updated_at',
    //             'dien_tich',
    //             \DB::raw('ST_AsGeoJSON(geom) as geom_geojson')
    //         )->orderBy('id', 'desc')->get();

    //         // Parse dữ liệu
    //         $plots->transform(function ($plot) {
    //             // Xử lý geom
    //             if ($plot->geom_geojson) {
    //                 try {
    //                     $plot->geom = json_decode($plot->geom_geojson);
    //                 } catch (\Exception $e) {
    //                     $plot->geom = null;
    //                 }
    //             } else {
    //                 $plot->geom = null;
    //             }
                
    //             // Chuyển đổi ky_hieu_mdsd từ PostgreSQL array literal sang array
    //             if (is_string($plot->ky_hieu_mdsd)) {
    //                 try {
    //                     $cleaned = trim($plot->ky_hieu_mdsd, '{}');
    //                     $plot->ky_hieu_mdsd = !empty($cleaned) ? explode(',', $cleaned) : [];
    //                 } catch (\Exception $e) {
    //                     $plot->ky_hieu_mdsd = [];
    //                 }
    //             } elseif ($plot->ky_hieu_mdsd === null) {
    //                 $plot->ky_hieu_mdsd = [];
    //             }
                
    //             unset($plot->geom_geojson);
    //             return $plot;
    //         });

    //         return response()->json([
    //             'success' => true,
    //             'data' => $plots,
    //             'total' => $plots->count(),
    //             'message' => 'Tìm kiếm thành công'
    //         ]);
    //     } catch (\Exception $e) {
    //         \Log::error('Search error: ' . $e->getMessage());
    //         \Log::error('Search trace: ' . $e->getTraceAsString());
    //         \Log::error('Search request: ' . json_encode($request->all()));
            
    //         return response()->json([
    //             'success' => false, 
    //             'message' => 'Có lỗi xảy ra khi tìm kiếm: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }
    
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

     private function normalizeColor($color)
    {
        if (empty($color)) {
            return '#868e96'; // Màu mặc định
        }

        $color = trim($color);
        
        // Kiểm tra hex color (#RRGGBB hoặc #RGB)
        if (preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $color)) {
            return $color;
        }
        
        // Kiểm tra rgba color
        if (preg_match('/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*(?:\.\d+)?))?\)$/', $color, $matches)) {
            $r = intval($matches[1]);
            $g = intval($matches[2]);
            $b = intval($matches[3]);
            $a = isset($matches[4]) ? floatval($matches[4]) : 1;
            
            // Đảm bảo giá trị trong khoảng hợp lệ
            $r = max(0, min(255, $r));
            $g = max(0, min(255, $g));
            $b = max(0, min(255, $b));
            $a = max(0, min(1, $a));
            
            if ($a == 1) {
                return sprintf("#%02x%02x%02x", $r, $g, $b); // Chuyển thành hex nếu không có alpha
            } else {
                return sprintf("rgba(%d, %d, %d, %.2f)", $r, $g, $b, $a);
            }
        }
        
        // Kiểm tra rgb color
        if (preg_match('/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/', $color, $matches)) {
            $r = max(0, min(255, intval($matches[1])));
            $g = max(0, min(255, intval($matches[2])));
            $b = max(0, min(255, intval($matches[3])));
            return sprintf("#%02x%02x%02x", $r, $g, $b); // Chuyển thành hex
        }
        
        // Màu mặc định nếu không nhận dạng được
        return '#868e96';
    }

    /**
     * Xác định loại màu
     */
    private function getColorType($color)
    {
        if (str_starts_with($color, '#')) {
            return 'hex';
        } elseif (str_starts_with($color, 'rgb') && !str_starts_with($color, 'rgba')) {
            return 'rgb';
        } elseif (str_starts_with($color, 'rgba')) {
            return 'rgba';
        } else {
            return 'unknown';
        }
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
            'KNT' => '#228be6', 'CAN' => '#9d5d1962', 
            "DPTHH" => '#868e96'
        ];
        
        return $colors[trim($landType)] ?? '#868e96';
    }

        // Helper function để kiểm tra giá trị tìm kiếm (nếu cần xử lý số 0)
    public function search(Request $request)
    {
        try {
            // Kiểm tra điều kiện bắt buộc
            if (!$request->filled('phuong_xa') && !$request->filled('so_to') && !$request->filled('so_thua')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vui lòng nhập ít nhất một thông tin: Phường/Xã, Số tờ hoặc Số thửa'
                ], 400);
            }

            $query = $this->buildLandPlotQuery($request);
            $plots = $query->orderBy('lp.id', 'desc')->get();

            if ($plots->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'total' => 0,
                    'message' => 'Không tìm thấy thửa đất phù hợp'
                ]);
            }

            // Xử lý với eager loading
            $processedPlots = $this->processPlotsWithDetails($plots);

            return response()->json([
                'success' => true,
                'data' => $processedPlots->values(),
                'total' => $processedPlots->count(),
                'message' => 'Tìm thấy ' . $processedPlots->count() . ' thửa đất'
            ]);

        } catch (\Exception $e) {
            Log::error('Search error: ' . $e->getMessage(), [
                'request' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false, 
                'message' => 'Có lỗi xảy ra khi tra cứu'
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

    // public function getPhuongBoundary(Request $request)
    // {
    //     try {
    //         $tenPhuong = $request->query('ten_phuong_xa');

    //         if (!$tenPhuong || trim($tenPhuong) === '') {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Thiếu tên phường/xã'
    //             ], 400);
    //         }

    //         Log::info('getPhuongBoundary request', ['ten_phuong_xa' => $tenPhuong]);

    //         // Chuẩn hóa tên: loại bỏ "Phường", "Xã", khoảng trắng thừa
    //         $cleanName = trim(preg_replace('/^(Phường|Xã)\s+/i', '', $tenPhuong));

    //         $boundary = DB::table('phuong_xa_boundary')
    //             ->whereRaw("TRIM(BOTH ' ' FROM REPLACE(ten_phuong_xa, 'Phường', '')) ILIKE ?", ["%$cleanName%"])
    //             ->selectRaw("
    //                 id,
    //                 ten_phuong_xa,
    //                 ma_hanh_chinh,
    //                 ST_AsGeoJSON(ST_Multi(ST_MakeValid(geom))) AS geom,
    //                 ST_GeometryType(geom) AS original_type
    //             ")
    //             ->first();

    //         if (!$boundary) {
    //             Log::warning('Không tìm thấy phường', ['query' => $cleanName]);
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Không tìm thấy ranh giới phường/xã: ' . $tenPhuong
    //             ], 404);
    //         }

    //         $geojson = json_decode($boundary->geom, true);

    //         if (json_last_error() !== JSON_ERROR_NONE) {
    //             Log::error('GeoJSON lỗi', ['error' => json_last_error_msg()]);
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Dữ liệu ranh giới không hợp lệ'
    //             ], 500);
    //         }

    //         return response()->json([
    //             'success' => true,
    //             'boundary' => $geojson,
    //             'phuong_xa' => $boundary->ten_phuong_xa,
    //             'ma_hanh_chinh' => $boundary->ma_hanh_chinh,
    //             'geometry_type' => $boundary->original_type
    //         ]);

    //     } catch (\Exception $e) {
    //         Log::error('getPhuongBoundary ERROR', [
    //             'message' => $e->getMessage(),
    //             'trace' => $e->getTraceAsString(),
    //             'request' => $request->all()
    //         ]);

    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Lỗi server: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }
    /**
     * Helper function to remove Vietnamese diacritics
     */
    private function removeVietnameseDiacritics($str)
    {
        $unicode = [
            'a' => ['á','à','ả','ã','ạ','ă','ắ','ằ','ẳ','ẵ','ặ','â','ấ','ầ','ẩ','ẫ','ậ'],
            'A' => ['Á','À','Ả','Ã','Ạ','Ă','Ắ','Ằ','Ẳ','Ẵ','Ặ','Â','Ấ','Ầ','Ẩ','Ẫ','Ậ'],
            'd' => ['đ'],
            'D' => ['Đ'],
            'e' => ['é','è','ẻ','ẽ','ẹ','ê','ế','ề','ể','ễ','ệ'],
            'E' => ['É','È','Ẻ','Ẽ','Ẹ','Ê','Ế','Ề','Ể','Ễ','Ệ'],
            'i' => ['í','ì','ỉ','ĩ','ị'],
            'I' => ['Í','Ì','Ỉ','Ĩ','Ị'],
            'o' => ['ó','ò','ỏ','õ','ọ','ô','ố','ồ','ổ','ỗ','ộ','ơ','ớ','ờ','ở','ỡ','ợ'],
            'O' => ['Ó','Ò','Ỏ','Õ','Ọ','Ô','Ố','Ồ','Ổ','Ỗ','Ộ','Ơ','Ớ','Ờ','Ở','Ỡ','Ợ'],
            'u' => ['ú','ù','ủ','ũ','ụ','ư','ứ','ừ','ử','ữ','ự'],
            'U' => ['Ú','Ù','Ủ','Ũ','Ụ','Ư','Ứ','Ừ','Ử','Ữ','Ự'],
            'y' => ['ý','ỳ','ỷ','ỹ','ỵ'],
            'Y' => ['Ý','Ỳ','Ỷ','Ỹ','Ỵ']
        ];

        foreach ($unicode as $nonUnicode => $uni) {
            $str = str_replace($uni, $nonUnicode, $str);
        }
        return $str;
    }

    public function getPhuongBoundary(Request $request)
    {
        try {
            $tenPhuong = $request->query('ten_phuong_xa');

            if (!$tenPhuong || trim($tenPhuong) === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Thiếu tên phường/xã'
                ], 400);
            }

            Log::info('getPhuongBoundary request', ['ten_phuong_xa' => $tenPhuong]);

            // Chuẩn hóa tên phường: loại bỏ dấu và prefix
            $tenPhuongNormalized = $this->removeVietnameseDiacritics($tenPhuong);
            $tenPhuongNormalized = trim(preg_replace('/^(Phuong|Phường|Xa|Xã)\s+/i', '', $tenPhuongNormalized));
            $tenPhuongLower = mb_strtolower($tenPhuongNormalized);
            
            // Cũng thử tìm với prefix
            $tenPhuongWithPrefix = mb_strtolower($this->removeVietnameseDiacritics($tenPhuong));
            
            // Tên gốc lowercase (giữ nguyên dấu để match với DB nếu DB có dấu)
            $tenPhuongOriginalLower = mb_strtolower($tenPhuong);
            
            Log::info('Normalized search terms', [
                'original' => $tenPhuong,
                'original_lower' => $tenPhuongOriginalLower,
                'normalized_no_prefix' => $tenPhuongNormalized,
                'normalized_lower' => $tenPhuongLower,
                'with_prefix_lower' => $tenPhuongWithPrefix
            ]);

            // === TÌM KIẾM LINH HOẠT: nhiều cách (bao gồm chuẩn hóa dấu) ===
            // Thử tìm trực tiếp trước (có thể database đã có đúng tên với dấu)
            $boundary = DB::table('phuong_xa_boundary')
                ->where(function ($q) use ($tenPhuong, $tenPhuongOriginalLower, $tenPhuongLower, $tenPhuongWithPrefix) {
                    // 1. Tìm trực tiếp với tên gốc (giữ nguyên dấu, case-insensitive)
                    $q->whereRaw('LOWER(ten_phuong_xa) = ?', [$tenPhuongOriginalLower]);
                    $q->orWhereRaw('LOWER(ten_phuong_xa) ILIKE ?', ["%$tenPhuong%"]);
                    
                    // 2. Tìm theo tên đã CHUẨN HÓA (không dấu, không prefix)
                    $q->orWhereRaw('LOWER(ten_phuong_xa) ILIKE ?', ["%$tenPhuongLower%"]);
                    
                    // 3. Tìm với prefix đã chuẩn hóa (không dấu)
                    $q->orWhereRaw('LOWER(ten_phuong_xa) ILIKE ?', ["%$tenPhuongWithPrefix%"]);
                    
                    // 4. Tìm với prefix gốc (giữ nguyên dấu nếu có)
                    $q->orWhereRaw('LOWER(ten_phuong_xa) ILIKE ?', ["%$tenPhuongOriginalLower%"]);
                })
                ->orWhere(function ($q) use ($tenPhuongLower) {
                    // 4. Tìm theo tên sau khi loại bỏ prefix trong DB
                    $q->whereRaw("
                        LOWER(TRIM(REGEXP_REPLACE(ten_phuong_xa, '^\\s*(Phuong|Phường|Xa|Xã)\\s+', '', 'i'))) ILIKE ?
                    ", ["%$tenPhuongLower%"]);
                })
                ->orWhere(function ($q) use ($tenPhuongNormalized, $tenPhuongLower) {
                    // 5. Tìm theo TỪ KHÓA RIÊNG LẺ đã chuẩn hóa
                    $keywords = preg_split('/\s+/', trim($tenPhuongNormalized));
                    foreach ($keywords as $kw) {
                        if (mb_strlen($kw) < 2) continue;
                        $kwLower = mb_strtolower($kw);
                        // Tìm từng từ trong tên (có thể có dấu hoặc không)
                        $q->where(function($subQ) use ($kwLower) {
                            $subQ->whereRaw('LOWER(ten_phuong_xa) ILIKE ?', ["%$kwLower%"]);
                            // Thử tìm với dấu: Đạo → Dao, Thạnh → Thanh
                            $daoPattern = str_replace(['dao', 'daọ', 'đạo'], ['dao', 'đạo', 'dao'], $kwLower);
                            if ($daoPattern !== $kwLower) {
                                $subQ->orWhereRaw('LOWER(ten_phuong_xa) ILIKE ?', ["%$daoPattern%"]);
                            }
                        });
                    }
                })
                ->selectRaw("
                    id,
                    ten_phuong_xa,
                    ma_hanh_chinh,
                    ST_AsGeoJSON(ST_Multi(ST_MakeValid(geom))) AS geom
                ")
                ->orderByRaw("
                    CASE 
                        WHEN LOWER(ten_phuong_xa) = ? THEN 1
                        WHEN LOWER(ten_phuong_xa) ILIKE ? THEN 2
                        WHEN LOWER(ten_phuong_xa) ILIKE ? THEN 3
                        WHEN LOWER(TRIM(REGEXP_REPLACE(ten_phuong_xa, '^\\s*(Phuong|Phường|Xa|Xã)\\s+', '', 'i'))) = ? THEN 4
                        ELSE 5
                    END
                ", [
                    $tenPhuongOriginalLower, 
                    "%$tenPhuong%", 
                    "%$tenPhuongLower%", 
                    $tenPhuongLower
                ])
                ->first();

            if (!$boundary) {
                // === TRẢ VỀ GỢI Ý KHI KHÔNG TÌM THẤY ===
                $available = DB::table('phuong_xa_boundary')
                    ->orderBy('ten_phuong_xa')
                    ->limit(10)
                    ->pluck('ten_phuong_xa')
                    ->toArray();

                Log::warning('Không tìm thấy phường', [
                    'query' => $tenPhuong,
                    'available_sample' => $available
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy: ' . $tenPhuong,
                    'available_phuong' => $available,
                    'tip' => 'Kiểm tra chính tả hoặc chọn từ danh sách'
                ], 404);
            }

            $geojson = json_decode($boundary->geom, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('GeoJSON lỗi', ['error' => json_last_error_msg()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu ranh giới không hợp lệ'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'boundary' => $geojson,
                'phuong_xa' => $boundary->ten_phuong_xa,
                'ma_hanh_chinh' => $boundary->ma_hanh_chinh,
            ]);

        } catch (\Exception $e) {
            Log::error('getPhuongBoundary ERROR', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Lỗi server'
            ], 500);
        }
    }

    public function getPhuongList(Request $request)
    {
        try {
            $tenPhuong = $request->query('ten_phuong_xa');
            $phuongList = DB::table('phuong_xa_boundary')
                ->select('ten_phuong_xa')
                ->distinct()
                ->get();
            return response()->json([
                'success' => true,
                'data' => $phuongList
            ], 200);
        }
        catch (\Exception $e) {
            Log::error('getPhuongList ERROR', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi server'
            ], 500);
        }

    }

    /**
     * Validate that land plots are contained within their ward boundaries
     * This checks if plots in land_plots table are actually inside the boundaries
     * defined in phuong_xa_boundary table
     */
    public function validatePlotBoundaries(Request $request)
    {
        try {
            $plotId = $request->query('plot_id');
            $phuongXa = $request->query('phuong_xa');
            
            // Build query
            $query = DB::table('land_plots as lp')
                ->select(
                    'lp.id',
                    'lp.so_to',
                    'lp.so_thua',
                    'lp.phuong_xa'
                );
            
            if ($plotId) {
                $query->where('lp.id', $plotId);
            }
            
            if ($phuongXa) {
                $query->where('lp.phuong_xa', 'ILIKE', "%$phuongXa%");
            }
            
            $plots = $query->whereNotNull('lp.geom')->get();
            
            $results = [];
            
            foreach ($plots as $plot) {
                // Normalize phuong_xa name for matching
                $normalizedPhuong = $this->removeVietnameseDiacritics($plot->phuong_xa);
                $normalizedPhuong = trim(preg_replace('/^(Phuong|Phường|Xa|Xã)\s+/i', '', $normalizedPhuong));
                $normalizedPhuongLower = mb_strtolower($normalizedPhuong);
                
                // Get ward boundary
                $boundary = DB::table('phuong_xa_boundary')
                    ->where(function ($q) use ($normalizedPhuongLower, $plot) {
                        $q->whereRaw('LOWER(ten_phuong_xa) ILIKE ?', ["%$normalizedPhuongLower%"]);
                        $q->orWhereRaw("LOWER(TRIM(REGEXP_REPLACE(ten_phuong_xa, '^\\s*(Phuong|Phường|Xa|Xã)\\s+', '', 'i'))) ILIKE ?", ["%$normalizedPhuongLower%"]);
                    })
                    ->first();
                
                if (!$boundary) {
                    $results[] = [
                        'plot_id' => $plot->id,
                        'so_to' => $plot->so_to,
                        'so_thua' => $plot->so_thua,
                        'phuong_xa' => $plot->phuong_xa,
                        'valid' => false,
                        'reason' => 'Ward boundary not found',
                        'boundary_matched' => null
                    ];
                    continue;
                }
                
                // Check spatial containment using PostGIS
                $containmentResult = DB::selectOne("
                    SELECT 
                        ST_Contains(p.geom, lp.geom) as is_contained,
                        ST_Intersects(p.geom, lp.geom) as intersects,
                        ST_Area(ST_Intersection(p.geom, lp.geom)) as intersection_area,
                        ST_Area(lp.geom) as plot_area
                    FROM land_plots lp
                    CROSS JOIN phuong_xa_boundary p
                    WHERE lp.id = ?
                    AND p.id = ?
                ", [$plot->id, $boundary->id]);
                
                if ($containmentResult) {
                    $isContained = $containmentResult->is_contained;
                    $intersects = $containmentResult->intersects;
                    $intersectionArea = floatval($containmentResult->intersection_area);
                    $plotArea = floatval($containmentResult->plot_area);
                    $overlapPercentage = $plotArea > 0 ? ($intersectionArea / $plotArea) * 100 : 0;
                    
                    $results[] = [
                        'plot_id' => $plot->id,
                        'so_to' => $plot->so_to,
                        'so_thua' => $plot->so_thua,
                        'phuong_xa' => $plot->phuong_xa,
                        'boundary_matched' => $boundary->ten_phuong_xa,
                        'valid' => $isContained,
                        'details' => [
                            'is_contained' => $isContained,
                            'intersects' => $intersects,
                            'overlap_percentage' => round($overlapPercentage, 2),
                            'plot_area' => round($plotArea, 2),
                            'intersection_area' => round($intersectionArea, 2)
                        ],
                        'reason' => $isContained 
                            ? 'Plot is fully contained within ward boundary' 
                            : ($intersects 
                                ? "Plot partially overlaps (only {$overlapPercentage}% within boundary)" 
                                : 'Plot is outside ward boundary')
                    ];
                } else {
                    $results[] = [
                        'plot_id' => $plot->id,
                        'so_to' => $plot->so_to,
                        'so_thua' => $plot->so_thua,
                        'phuong_xa' => $plot->phuong_xa,
                        'valid' => false,
                        'reason' => 'Spatial check failed',
                        'boundary_matched' => $boundary->ten_phuong_xa
                    ];
                }
            }
            
            $validCount = collect($results)->where('valid', true)->count();
            $invalidCount = collect($results)->where('valid', false)->count();
            
            return response()->json([
                'success' => true,
                'summary' => [
                    'total_checked' => count($results),
                    'valid_count' => $validCount,
                    'invalid_count' => $invalidCount,
                    'validation_rate' => count($results) > 0 ? round(($validCount / count($results)) * 100, 2) : 0
                ],
                'results' => $results
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('validatePlotBoundaries ERROR', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi kiểm tra ranh giới: ' . $e->getMessage()
            ], 500);
        }
    }
}
