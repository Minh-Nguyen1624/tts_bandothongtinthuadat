<?php

namespace App\Http\Controllers;

use App\Models\Teams;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index()
    {
        return Teams::with('unit')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'unit_id' => 'required|integer',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $teams = Teams::create($validated);
        $teams = Teams::with('unit')->find($teams->id);
        return response()->json($teams, 201);
    }

    public function show(string $id){
        return Teams::with('unit')->findOrFail($id);
    }

    public function update(Request $request, string $id){
        $teams = Teams::findOrFail($id);
         $validated = $request->validate([
            'name' => 'required|string',
            'unit_id' => 'required|integer',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        $teams-> update($validated);
        $teams = Teams::with('unit')->find($teams->id);
        return response()->json($teams, 200);
    }

    public function destroy(string $id){
        Teams::destroy($id);
        return response()->json(null, 204);
    }
}