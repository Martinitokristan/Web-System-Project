<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Purchase Orders Schema ===" . PHP_EOL;
$cols = DB::select('SHOW COLUMNS FROM purchase_orders');
foreach ($cols as $col) {
    echo sprintf("  %-25s %s", $col->Field, $col->Type) . PHP_EOL;
}

echo PHP_EOL . "=== Pending Migrations ===" . PHP_EOL;
$pending = DB::table('migrations')->orderBy('id', 'desc')->take(5)->get();
foreach ($pending as $m) {
    echo "  " . $m->migration . " (batch " . $m->batch . ")" . PHP_EOL;
}
