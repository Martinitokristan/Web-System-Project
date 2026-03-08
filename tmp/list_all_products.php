<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "=== All Products ===" . PHP_EOL;
    $products = DB::table('products')->select('id', 'name', 'sku')->get();
    foreach ($products as $p) {
        echo "Product: [" . $p->id . "] " . $p->name . " | SKU: " . $p->sku . PHP_EOL;
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
