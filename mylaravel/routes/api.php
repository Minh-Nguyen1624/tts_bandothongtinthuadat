<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\AuthController;
use App\Http\Middleware\AdminMiddleware;


Route::options('/{any}', function (Request $request) {
    return response()->json([], 204)
        ->header('Access-Control-Allow-Origin', $request->headers->get('Origin') ?: '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        ->header('Access-Control-Allow-Credentials', 'true');
})->where('any', '.*');

// Public test route
Route::get('/test', function () {
    return response()->json(['message' => 'API OK'], 200);
});

// Authentication Routes
Route::prefix('auth')->group(function() {
    Route::post('login', [AuthController::class, 'login']);
    // Route::post('refresh', [AuthController::class, 'refresh']);
    
    // Protected auth routes
    Route::middleware('auth:api')->group(function() {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

// Public test routes
Route::prefix('units')->group(function () {
    Route::get('/test-units', function() {
        return response()->json(['success' => true, 'message' => 'Units OK'], 200);
    });
});

Route::prefix('teams')->group(function() {
    Route::get('/test-teams', function() {
        return response()->json(['success' => true, 'message' => 'Teams OK'], 200);
    });
});

// Test routes for debugging
Route::get('/test-jwt', function () {
    return response()->json([
        'message' => 'JWT middleware works!',
        'user' => auth('api')->user()
    ]);
// })->middleware('auth:api');
})->middleware([AdminMiddleware::class]);


Route::get('/test-admin', function () {
    return response()->json([
        'message' => 'Admin middleware works!',
        'user' => auth('api')->user()
    ]);
// })->middleware(['auth:api', [AdminMiddleware::class]]);
})->middleware([AdminMiddleware::class]);

// Routes for all authenticated users (read-only access)
// Route::middleware('auth:api')->group(function() {
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
});