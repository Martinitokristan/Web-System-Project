<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\DeliveryController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\RiderController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SupplierController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth (public)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Products & Categories
    Route::apiResource('products', ProductController::class);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/categories', [CategoryController::class, 'store']);

    // Suppliers & Unit Types
    Route::apiResource('suppliers', SupplierController::class);
    Route::get('/unit-types', [\App\Http\Controllers\UnitTypeController::class, 'index']);

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory/{id}/adjust', [InventoryController::class, 'adjust']);
    Route::post('/inventory/{id}/reorder', [InventoryController::class, 'reorder']);

    // Sales
    Route::get('/sales/summary', [SaleController::class, 'summary']);
    Route::get('/sales', [SaleController::class, 'index']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/sales/{id}', [SaleController::class, 'show']);
    Route::post('/sales/{id}/return', [SaleController::class, 'processReturn']);

    // Purchase Orders
    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
    Route::get('/purchase-orders/{id}', [PurchaseOrderController::class, 'show']);
    Route::put('/purchase-orders/{id}/approve', [PurchaseOrderController::class, 'approve']);
    Route::put('/purchase-orders/{id}/receive', [PurchaseOrderController::class, 'markReceived']);

    // Deliveries
    Route::get('/deliveries', [DeliveryController::class, 'index']);
    Route::put('/deliveries/{id}/assign', [DeliveryController::class, 'assignRider']);
    Route::put('/deliveries/{id}/status', [DeliveryController::class, 'updateStatus']);

    // Reports
    Route::get('/reports/sales', [ReportController::class, 'sales']);
    Route::get('/reports/inventory', [ReportController::class, 'inventory']);
    Route::get('/reports/export', [ReportController::class, 'export']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::put('/users/{id}/suspend', [UserController::class, 'suspend']);
    Route::put('/users/{id}/restore', [UserController::class, 'restore']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customer/orders', [CustomerController::class, 'myOrders']);

    // Riders
    Route::get('/riders', [RiderController::class, 'index']);
    Route::get('/riders/me/dashboard', [RiderController::class, 'dashboard']);
    Route::get('/riders/me/deliveries', [RiderController::class, 'myDeliveries']);
    Route::post('/riders/me/toggle-status', [RiderController::class, 'toggleStatus']);
    Route::get('/riders/available', [RiderController::class, 'availableRiders']);
    Route::get('/riders/{id}/stats', [RiderController::class, 'stats']);

    // Settings
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);
    Route::post('/settings/variant-types', [SettingsController::class, 'saveVariantType']);
    Route::delete('/settings/variant-types/{id}', [SettingsController::class, 'deleteVariantType']);
    Route::post('/settings/variant-values', [SettingsController::class, 'saveVariantValue']);
    Route::delete('/settings/variant-values/{id}', [SettingsController::class, 'deleteVariantValue']);
    Route::get('/settings/unit-types', [SettingsController::class, 'getUnitTypes']); // Optional, index has it
    Route::post('/settings/unit-types', [SettingsController::class, 'saveUnitType']);
    Route::delete('/settings/unit-types/{id}', [SettingsController::class, 'deleteUnitType']);
    Route::post('/settings/unit-conversions', [SettingsController::class, 'saveUnitConversion']);
    Route::delete('/settings/unit-conversions/{id}', [SettingsController::class, 'deleteUnitConversion']);
    
    // Category Management in Settings
    Route::post('/settings/categories', [SettingsController::class, 'saveCategory']);
    Route::delete('/settings/categories/{id}', [SettingsController::class, 'deleteCategory']);
});
