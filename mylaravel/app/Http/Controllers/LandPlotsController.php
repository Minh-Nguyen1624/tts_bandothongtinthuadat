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
                    'pl.dia_chi_thua_dat'
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
        $validator = Validator::make($request->all(), [
            'ten_chu'      => 'nullable|string|max:100',
            'so_to'        => 'required|integer',
            'so_thua'      => 'required|integer',
            'ky_hieu_mdsd' => 'required|string',
            'phuong_xa'    => 'required|string|max:100',
            'status'       => 'in:available,owned,suspended',
            'plot_list_id' => 'nullable|exists:plot_list,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $landPlot = land_plots::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Land plot created successfully',
            'data'    => $landPlot
        ], 201);
    }

    public function show($id)
    {
        $landPlot = land_plots::findOrFail($id);
        return response()->json(['success' => true, 'data' => $landPlot], 200);
    }

    public function update(Request $request, $id)
    {
        $landPlot = land_plots::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'ten_chu'      => 'nullable|string|max:100',
            'so_to'        => 'nullable|integer',
            'so_thua'      => 'nullable|integer',
            'ky_hieu_mdsd' => 'nullable|string',
            'phuong_xa'    => 'nullable|string|max:100',
            'status'       => 'in:available,owned,suspended'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        // ✅ FIX: LOGIC ĐƠN GIẢN VÀ HIỆU QUẢ
        if (array_key_exists('ten_chu', $data)) {
            // Nếu ten_chu được gửi trong request (kể cả null)
            if (!empty(trim($data['ten_chu'] ?? ''))) {
                $data['status'] = 'owned';
            } else {
                $data['status'] = 'available';
            }
        }
        // Nếu không gửi ten_chu, giữ nguyên status

        // ✅ Tự động tìm plot_list
        $plotList = \App\Models\PlotList::where('so_to', $data['so_to'] ?? $landPlot->so_to)
            ->where('so_thua', $data['so_thua'] ?? $landPlot->so_thua)
            ->first();

        if ($plotList) {
            $data['plot_list_id'] = $plotList->id;
        } else {
            $data['plot_list_id'] = null;
        }

        // ✅ Cập nhật dữ liệu
        $landPlot->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Land plot updated successfully',
            'data'    => $landPlot->fresh('plotList')
        ]);
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

    public function search(Request $request)
    {
        try {
            $query = land_plots::query();

            if ($request->has('query') && !empty($request->input('query'))) {
                $searchTerm = $request->input('query');
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('ten_chu', 'ILIKE', "%{$searchTerm}%")
                    ->orWhere('so_to', 'ILIKE', "%{$searchTerm}%")
                    ->orWhere('so_thua', 'ILIKE', "%{$searchTerm}%")
                    ->orWhere('phuong_xa', 'ILIKE', "%{$searchTerm}%")
                    ->orWhere('ky_hieu_mdsd', 'ILIKE', "%{$searchTerm}%");
                });
            }

            if ($request->has('phuong_xa') && !empty($request->input('phuong_xa'))) {
                $query->where('phuong_xa', $request->input('phuong_xa'));
            }

            $plots = $query->orderBy('id', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $plots,
                'total' => $plots->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Search error: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Có lỗi xảy ra khi tìm kiếm'
            ], 500);
        }
    }

    public function exportExcel(Request $request): BinaryFileResponse
    {
        $filters = [
            'search' => $request->get('search', ''),
            'phuong_xa' => $request->get('phuong_xa', ''),
        ];

        $filename = 'danh_sach_thua_dat_' . date('Y_m_d_His') . '.xlsx';

        return Excel::download(new LandPlotsExport($filters), $filename);
    }

    /**
     * Export selected land plots to Excel
     */
    public function exportSelectedExcel(Request $request): BinaryFileResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:land_plots,id'
        ]);

        $filters = [
            'ids' => $request->ids
        ];

        $filename = 'danh_sach_thua_dat_chon_' . date('Y_m_d_His') . '.xlsx';

        return Excel::download(new LandPlotsExport($filters), $filename);
    }
}
