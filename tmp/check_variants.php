<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    echo "=== Variants for Product ID 1 (Screwdriver) ===" . PHP_EOL;
    $variants = DB::table('product_variants')->where('product_id', 1)->get();
    if ($variants->isEmpty()) {
        echo "No variants found." . PHP_EOL;
    } else {
        foreach ($variants as $v) {
            echo "Variant: " . json_encode($v) . PHP_EOL;
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
