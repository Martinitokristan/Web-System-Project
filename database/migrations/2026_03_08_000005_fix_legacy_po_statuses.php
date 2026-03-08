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
     * This fix moves POs from the legacy 'approved' status into the new 
     * 'pending_supplier' status so they fall into the Accept/Reject workflow.
     */
    public function up(): void
    {
        // Move legacy 'approved' to 'pending_supplier'
        DB::table('purchase_orders')
            ->where('status', 'approved')
            ->update(['status' => 'pending_supplier']);
        
        // Ensure any other inconsistencies are handled
        // If a PO was 'confirmed' in the very old flow, it's also 'pending_supplier'
        DB::table('purchase_orders')
            ->where('status', 'confirmed')
            ->update(['status' => 'pending_supplier']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse if necessary (though usually we don't want to go back to broken)
        DB::table('purchase_orders')
            ->where('status', 'pending_supplier')
            ->update(['status' => 'approved']);
    }
};
