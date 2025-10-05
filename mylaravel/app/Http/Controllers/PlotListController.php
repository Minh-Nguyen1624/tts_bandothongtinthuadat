<?php

namespace App\Http\Controllers;

use App\Models\PlotList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PlotListController extends Controller
{
    public function index(){
        try {
            // return PlotList::all();
            return response()->json([
                'success' => true,
                'data' => PlotList::orderBy('id', 'desc')->get()
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }

    }

    public function store(Request $request){
        try {
            $validator = Validator::make($request->all(), [
                'organization_name' => 'nullable|string',
                'so_to' => 'nullable|integer',
                'so_thua' => 'nullable|integer',
                'dia_chi_thua_dat' => 'nullable|string',
                'xa' => 'nullable|string',
                'dien_tich' => 'nullable|numeric|regex:/^\d{1,8}(\.\d{1,2})?$/',
            ]);

            if($validator->fails()){
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $plotList = PlotList::create($request->all());
            return response()->json(['message' => 'PlotList created successfully', 'data' => $plotList], 201);
            
        }catch(\Exception $e){
            \Log::error('Test error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(string $id){
        try{
            $plotList = PlotList::findOrFail($id);
            return response()->json(['success' => true, 'message' => 'PlotList retrieved successfully', 'data' => $plotList], 200);
        }catch(\Exception $e){
            \Log::error('Test error: ' . $e->getMessage()); 
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, string $id){
        try{
            $plotList = PlotList::findOrFail($id);
            $validator = Validator::make($request->all(), [
                'organization_name' => 'nullable|string',
                'so_to' => 'nullable|integer',
                'so_thua' => 'nullable|integer',
                'dia_chi_thua_dat' => 'nullable|string',
                'xa' => 'nullable|string',
                'dien_tich' => 'nullable|numeric|regex:/^\d{1,8}(\.\d{1,2})?$/',
            ]);

            if($validator->fails()){
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $validatedData = $validator->validate();
            $plotList->update($validatedData);

            return response()->json(['success' => true, 'message' => 'PlotList updated successfully', 'data' => $plotList], 200);


        }catch(\Exception $e){
            \Log::error('Test error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id){
        try{
            $plotList = PlotList::findOrFail($id);
               
            if(!$plotList){
                return response()->json(['success' => false, 'message' => 'PlotList not found'], 404);
            }

            $plotList->delete();
               
            return response()->json(['success' => true, 'message' => 'PlotList deleted successfully'], 200);
        }catch(\Exception $e){
            \Log::error('Test error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    
    } 

   public function search(Request $request){
    try {
        $query = $request->input('query');

        $results = PlotList::query()
            ->when($query, function ($q) use ($query) {
                // Nếu là số nguyên -> tìm cả exact match và LIKE
                if (is_numeric($query)) {
                    return $q->where('organization_name', 'like', "%$query%")
                        ->orWhere('so_to', (int) $query)
                        ->orWhere('so_thua', (int) $query)
                        ->orWhere(DB::raw("CAST(so_to AS TEXT)"), 'like', "%$query%")
                        ->orWhere(DB::raw("CAST(so_thua AS TEXT)"), 'like', "%$query%")
                        ->orWhere('dia_chi_thua_dat', 'like', "%$query%")
                        ->orWhere('xa', 'like', "%$query%");
                } else {
                    // Nếu là chữ -> chỉ tìm trong cột text
                    return $q->where('organization_name', 'like', "%$query%")
                        ->orWhere('dia_chi_thua_dat', 'like', "%$query%")
                        ->orWhere('xa', 'like', "%$query%");
                }
            })
            ->get();

            // return view('plotlist.search', compact('results', 'query'));
            return response()->json([
                'success' => true,
                'query'   => $query,
                'results' => $results
            ]);

        } catch (\Exception $e) {
            \Log::error('Search error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

}
