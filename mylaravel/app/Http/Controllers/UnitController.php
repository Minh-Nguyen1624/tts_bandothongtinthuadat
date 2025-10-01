<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index()
    {
        // return Unit::all();
        return Unit::with('teams')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'type' => 'required|string',
            'code' => 'required|string',
        ]);

        $unit = Unit::create($validated);
        $unit = Unit::with('teams')->find($unit->id);
        return response()->json($unit, 201);
    }

    public function show(string $id)
    {
        return Unit::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $unit = Unit::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'type' => 'sometimes|string',
            'code' => 'sometimes|string',
        ]);

        $unit->update($validated);
        $unit = Unit::with('teams')->find($unit->id);
        return response()->json($unit, 200);
    }

    public function destroy(string $id)
    {
        Unit::destroy($id);
        return response()->json(null, 204);
    }
}