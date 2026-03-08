<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->timestamp('delivered_at')->nullable()->after('expected_date');
            $table->unsignedBigInteger('delivered_by')->nullable()->after('delivered_at');
            $table->text('delivery_notes')->nullable()->after('delivered_by');

            $table->foreign('delivered_by')->references('id')->on('suppliers');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['delivered_by']);
            $table->dropColumn(['delivered_at', 'delivered_by', 'delivery_notes']);
        });
    }
};
