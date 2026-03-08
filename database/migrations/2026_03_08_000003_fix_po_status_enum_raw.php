<?php

use Illuminate\Database\Migrations\Migration;

// This migration has been superseded by 2026_03_08_000002_add_supplier_response_fields_to_purchase_orders_table
// which converted the status column to VARCHAR(50).
return new class extends Migration
{
    public function up(): void
    {
        // no-op: status column is already VARCHAR(50)
    }

    public function down(): void
    {
        // no-op
    }
};
