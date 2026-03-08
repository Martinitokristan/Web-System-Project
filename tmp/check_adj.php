<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "=== Inventory Adjustments for Product ID 1 (Screwdriver) ===" . PHP_EOL;
    $adjustments = DB::table('inventory_adjustments')
        ->where('product_id', 1)
        ->orderBy('created_at', 'desc')
        ->get();

    foreach ($adjustments as $adj) {
        echo "Adjustment: " . json_encode($adj) . PHP_EOL;
    }

    echo PHP_EOL . "=== Purchase Order PO-0002 Details ===" . PHP_EOL;
    $po = DB::table('purchase_orders')->where('po_number', 'PO-0002')->first();
    echo "PO Record: " . json_encode($po) . PHP_EOL;

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
