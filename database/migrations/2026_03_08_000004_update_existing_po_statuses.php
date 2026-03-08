<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing POs with old status values to new ones
        DB::statement("UPDATE purchase_orders SET status = 'pending' WHERE status IN ('draft', 'submitted')");
        DB::statement("UPDATE purchase_orders SET status = 'approved' WHERE status = 'confirmed'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse the changes
        DB::statement("UPDATE purchase_orders SET status = 'draft' WHERE status = 'pending'");
        DB::statement("UPDATE purchase_orders SET status = 'confirmed' WHERE status = 'approved'");
    }
};
