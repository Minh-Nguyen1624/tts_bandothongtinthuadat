<?php

namespace App\Http\Controllers;

use App\Models\Teams;
use App\Models\Unit;
use App\Http\Resources\TeamResource;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index()
    {
        $teams = Teams::with('unit')->get();
        return TeamResource::collection($teams);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'unit_code' => 'required|string|exists:units,code',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        // Tìm unit_id từ unit_code
        $unit = Unit::where('code', $validated['unit_code'])->firstOrFail();
        
        $team = Teams::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'unit_id' => $unit->id,
            'description' => $validated['description'],
            'status' => $validated['status'] ?? 'active'
        ]);

        $team->load('unit');
        
        return response()->json(new TeamResource($team), 201);
    }

    public function show(string $id)
    {
        $team = Teams::with('unit')->findOrFail($id);
        return new TeamResource($team);
    }

    public function update(Request $request, string $id)
    {
        $team = Teams::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string',
             'code' => 'nullable|string|unique:teams,code,' . $id . '|max:50',
            'unit_code' => 'required|string|exists:units,code',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        // Tìm unit_id từ unit_code
        $unit = Unit::where('code', $validated['unit_code'])->firstOrFail();
        
        $team->update([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'unit_id' => $unit->id,
            'description' => $validated['description'],
            'status' => $validated['status'] ?? $team->status
        ]);

        $team->load('unit');
        
        return response()->json(new TeamResource($team), 200);
    }

    public function destroy(string $id)
    {
        Teams::destroy($id);
        return response()->json(null, 204);
    }
}