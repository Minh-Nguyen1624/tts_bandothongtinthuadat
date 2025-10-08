<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\AuthController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Controllers\PlotListController;
use App\Http\Controllers\LandPlotsController;


// Public test route
Route::get('/test', function () {
    return response()->json(['message' => 'API OK'], 200);
});

// Authentication Routes
Route::prefix('auth')->group(function() {
    Route::post('login', [AuthController::class, 'login']);
    
    // Protected auth routes
    Route::middleware('auth:api')->group(function() {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::prefix('users')->group(function () {
    Route::get('/test-units', function() {
        return response()->json(['success' => true, 'message' => 'Units OK'], 200);
    });
    // Route::post("/", [UsersController::class, 'store']);
});


// Public test routes
Route::prefix('units')->group(function () {
    Route::get('/test-units', function() {
        return response()->json(['success' => true, 'message' => 'Units OK'], 200);
    });
    // Route::post('/', [UnitController::class, 'store']);

});

Route::prefix('teams')->group(function() {
    Route::get('/test-teams', function() {
        return response()->json(['success' => true, 'message' => 'Teams OK'], 200);
    });
        Route::post('/', [TeamController::class, 'store']);

});



// Test routes for debugging
Route::get('/test-jwt', function () {
    return response()->json([
        'message' => 'JWT middleware works!',
        'user' => auth('api')->user()
    ]);
})->middleware([AdminMiddleware::class]);


Route::get('/test-admin', function () {
    return response()->json([
        'message' => 'Admin middleware works!',
        'user' => auth('api')->user()
    ]);
})->middleware([AdminMiddleware::class]);

// Routes for all authenticated users (read-only access)
Route::middleware('auth:api')->group(function() {
    
    // Unit Routes - View only
    Route::prefix('units')->group(function () {
        Route::get('/', [UnitController::class, 'index']);
        Route::get('/{id}', [UnitController::class, 'show']);
    });

    // Team Routes - View only
    Route::prefix('teams')->group(function() {
        Route::get('/', [TeamController::class, 'index']);
        Route::get('/{id}', [TeamController::class, 'show']);
    });

    // User Routes - View only
    Route::prefix('users')->group(function() {
        Route::get("/", [UsersController::class, 'index']);
        Route::get("/{id}", [UsersController::class, 'show']);
        // Route::post("/", [UsersController::class, 'store']);

    });

    Route::prefix('plotlists')->group(function(){
        Route::get('/', [PlotListController::class, 'index']);
        Route::get('/search', [PlotListController::class, 'search'])->name('search');
        Route::get('/{id}', [PlotListController::class, 'show']);
    });
    Route::prefix('land_plots')->group(function(){
        Route::get('/', [LandPlotsController::class, 'index']);
        Route::get('/search', [LandPlotsController::class, 'search']);
        Route::get('/{id}', [LandPlotsController::class, 'show']);
        Route::get('/land_plots/export/excel', [LandPlotsController::class, 'exportExcel']);
        Route::post('/land_plots/export/selected', [LandPlotsController::class, 'exportSelectedExcel']);
    });
});

// Admin-only routes (full CRUD access)
Route::middleware([AdminMiddleware::class])->group(function() {
    
    // Unit Routes - Admin CRUD
    Route::prefix('units')->group(function () {
        Route::post('/', [UnitController::class, 'store']);
        Route::put('/{id}', [UnitController::class, 'update']);
        Route::delete('/{id}', [UnitController::class, 'destroy']);
    });

    // Team Routes - Admin CRUD
    Route::prefix('teams')->group(function() {
        Route::post('/', [TeamController::class, 'store']);
        Route::put('/{id}', [TeamController::class, 'update']);
        Route::delete('/{id}', [TeamController::class, 'destroy']);
    });

    // User Routes - Admin CRUD
    Route::prefix('users')->group(function() {
        Route::post("/", [UsersController::class, 'store']);
        Route::put("/{id}", [UsersController::class, 'update']);
        Route::delete("/{id}", [UsersController::class, 'destroy']);
    });

    // PLotList Route - Admin CRUD
    Route::prefix('plotlists')->group(function(){
        Route::get('/export/plot-list', [PlotListController::class, 'export'])->name('plotlist.export');
        Route::post('/', [PlotListController::class, 'store']);
        Route::put("/{id}", [PlotListController::class, 'update']);
        Route::delete("/{id}", [PlotListController::class, 'destroy']);
        Route::resource('plot-list', PlotListController::class);
    }); 

    Route::prefix('land_plots')->group(function(){
        Route::get('/geometry', [LandPlotsController::class, 'getGeometry']);    
        // Route::get('/{so_to}/{so_thua}/geometry', [LandPlotsController::class, 'getGeometryByParams']);
        Route::get('/land-plots/geojson', [LandPlotsController::class, 'getGeoJson']);
        Route::get('/export/land-plots', [LandPlotsController::class, 'export'])->name('landplots.export');
        Route::post('/', [LandPlotsController::class, 'store']);
        Route::put("/{id}", [LandPlotsController::class, 'update']);
        Route::delete("/{id}", [LandPlotsController::class, 'destroy']);
        Route::get('/test-geometry-steps', [LandPlotsController::class, 'testGeometryStepByStep']);
    });
});

