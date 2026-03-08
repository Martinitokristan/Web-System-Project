<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds supplier response fields and migrates status column from ENUM to
     * VARCHAR(50) for flexibility (no ALTER TABLE for new status values needed).
     */
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            // Add rejection fields if they don't already exist
            if (!Schema::hasColumn('purchase_orders', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('delivery_notes');
            }
            if (!Schema::hasColumn('purchase_orders', 'accepted_at')) {
                $table->timestamp('accepted_at')->nullable()->after('rejection_reason');
            }
        });

        // Migrate status from ENUM to VARCHAR(50) for maximum flexibility.
        // First update any legacy status values to match our new naming conventions.
        DB::statement("UPDATE purchase_orders SET status = 'pending' WHERE status IN ('draft', 'submitted')");
        DB::statement("UPDATE purchase_orders SET status = 'received' WHERE status IN ('confirmed', 'closed')");

        // Now change the column type to VARCHAR so we can use any status string going forward.
        DB::statement("ALTER TABLE purchase_orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("UPDATE purchase_orders SET status = 'pending' WHERE status NOT IN ('draft','submitted','confirmed','received','closed')");
        DB::statement("ALTER TABLE purchase_orders MODIFY COLUMN status ENUM('draft','submitted','confirmed','received','closed') NOT NULL DEFAULT 'draft'");

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn(array_filter(['rejection_reason', 'accepted_at'], function ($col) {
                return Schema::hasColumn('purchase_orders', $col);
            }));
        });
    }
};
