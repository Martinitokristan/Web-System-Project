<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Variant;
use App\Models\VariantValue;
use App\Models\Supplier;
use App\Models\User;
use App\Models\PurchaseOrder;
use App\Models\POItem;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;

try {
    echo "Starting test...\n";
    DB::beginTransaction();

    // 1. Setup Data
    $admin = User::first();
    $supplier = Supplier::first();
    
    if (!$supplier) {
        $supplier = Supplier::create([
            'name' => 'Test Supplier',
            'contact_person' => 'John Doe',
            'email' => 'test@supplier.com',
            'phone' => '1234567890',
            'address' => '123 Test St',
        ]);
        echo "Created supplier\n";
    }

    $product = Product::forceCreate([
        'sku' => 'TEST-001',
        'name' => 'Test Product',
        'category_id' => 1,
        'unit_type_id' => 1,
        'supplier_id' => $supplier->id,
        'purchase_price' => 100,
        'sell_price' => 150,
        'is_active' => true,
    ]);
    echo "Created product {$product->id}\n";

    // Setup variant
    $colorType = Variant::firstOrCreate(['name' => 'Color']);
    $redValue = VariantValue::firstOrCreate(['variant_id' => $colorType->id, 'label' => 'Red']);
    
    $variant = ProductVariant::forceCreate([
        'product_id' => $product->id,
        'color_value_id' => $redValue->id,
        'sku_suffix' => 'RED',
        'price_override' => null,
        'stock' => 0,
    ]);
    echo "Created product variant {$variant->id}\n";

    // Request mock
    $request = Illuminate\Http\Request::create('/api/purchase-orders', 'POST', [
        'supplier_id' => $supplier->id,
        'items' => [
            [
                'product_id' => $product->id,
                'product_variant_id' => $variant->id,
                'quantity' => 10,
                'unit_cost' => 100,
            ]
        ]
    ]);
    $request->setUserResolver(function() use ($admin) { return $admin; });

    // 2. Create PO
    $poController = app(\App\Http\Controllers\PurchaseOrderController::class);
    $response = $poController->store($request);
    $poId = json_decode($response->getContent())->data->id;
    echo "Created PO {$poId}\n";

    // 3. Approve and Deliver
    $poController->approve($poId);
    $po = PurchaseOrder::find($poId);
    $po->update(['status' => 'supplier_delivered']); // Simulate supplier bypassing accept/deliver for test
    echo "Approved & Delivered PO\n";

    // 4. Receive PO
    $poController->markReceived($poId);
    echo "Received PO\n";

    // 5. Assertions before transfer
    $inventory = Inventory::where('product_id', $product->id)->where('product_variant_id', $variant->id)->first();
    $variant = $variant->fresh();
    
    if ($inventory->warehouse_stock != 10) throw new Exception("Expected 10 warehouse_stock, got {$inventory->warehouse_stock}");
    if ($variant->stock != 0) throw new Exception("Expected 0 storefront stock, got {$variant->stock}");
    if ($inventory->current_stock != 0) throw new Exception("Expected 0 base current_stock, got {$inventory->current_stock}");
    
    echo "✔ Assertions passed: Warehouse has 10, Storefront has 0\n";

    // 6. Transfer to Store
    $transferRequest = Illuminate\Http\Request::create('/api/inventory/transfer', 'POST', [
        'product_id' => $product->id,
        'variant_id' => $variant->id,
        'quantity' => 5,
    ]);
    $transferRequest->setUserResolver(function() use ($admin) { return $admin; });

    $invController = app(\App\Http\Controllers\InventoryController::class);
    $invController->transferToStore($transferRequest);
    echo "Transferred 5 items to storefront\n";

    // 7. Assertions after transfer
    $inventory = $inventory->fresh();
    $variant = ProductVariant::find($variant->id);
    $inventoryBase = Inventory::where('product_id', $product->id)->whereNull('product_variant_id')->first();
    
    if ($inventory->warehouse_stock != 5) throw new Exception("Expected 5 warehouse_stock, got {$inventory->warehouse_stock}");
    if ($variant->stock != 5) throw new Exception("Expected 5 storefront stock, got {$variant->stock}");
    // Note: since this is a variant, base product current_stock is synced from variants. So base should be 5.
    $product->syncStockWithVariants();
    $baseInventory = Inventory::where('product_id', $product->id)->first();
    if ($baseInventory->current_stock != 5) throw new Exception("Expected 5 base current_stock, got {$baseInventory->current_stock}");

    echo "✔ Assertions passed: Warehouse has 5, Storefront has 5\n";
    
    // Clean up
    DB::rollBack();
    echo "\nAll Tests Passed! Database rolled back.\n";

} catch (Exception $e) {
    DB::rollBack();
    echo "Test Failed: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
