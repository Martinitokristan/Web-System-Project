<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "=== Searching for products matching 'Screw' or 'Driver' ===" . PHP_EOL;
    $products = DB::table('products')
        ->where('name', 'like', '%Screw%')
        ->orWhere('name', 'like', '%Driver%')
        ->get();

    foreach ($products as $p) {
        echo "Product: [" . $p->id . "] " . $p->name . " | SKU: " . $p->sku . PHP_EOL;
        
        $inv = DB::table('inventory')->where('product_id', $p->id)->first();
        if ($inv) {
            echo "  Inventory Record: " . json_encode($inv) . PHP_EOL;
        } else {
            echo "  Inventory Record: NOT FOUND in 'inventory' table!" . PHP_EOL;
        }

        $poItems = DB::table('purchase_order_items')
            ->join('purchase_orders', 'purchase_order_items.purchase_order_id', '=', 'purchase_orders.id')
            ->where('purchase_order_items.product_id', $p->id)
            ->select('purchase_orders.po_number', 'purchase_orders.status', 'purchase_order_items.quantity')
            ->get();
        
        foreach ($poItems as $item) {
            echo "  PO: " . $item->po_number . " | Status: " . $item->status . " | Qty: " . $item->quantity . PHP_EOL;
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
