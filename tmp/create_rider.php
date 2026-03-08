<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\RiderProfile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

DB::beginTransaction();
try {
    $rider = User::create([
        'name'     => 'Test Rider',
        'email'    => 'rider@hrms.com',
        'phone'    => '09123456789',
        'role'     => 'rider',
        'status'   => 'active',
        'password' => Hash::make('password'),
    ]);

    RiderProfile::create([
        'user_id'         => $rider->id,
        'vehicle_type'    => 'Motorcycle',
        'plate_number'    => 'ABC-123',
        'availability'    => 'off_duty',
        'total_deliveries'=> 0,
        'on_time_count'   => 0,
    ]);

    DB::commit();
    echo "Rider account created successfully!\n";
    echo "Email: rider@hrms.com\n";
    echo "Password: password\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}
