<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddVariantAndWarehouseToInventoryTable extends Migration
{
    public function up()
    {
        Schema::table('inventory', function (Blueprint $table) {
            // Drop foreign key first, then the unique index
            $table->dropForeign(['product_id']);
            $table->dropUnique(['product_id']);
        });

        Schema::table('inventory', function (Blueprint $table) {
            // Add variant id and warehouse stock columns
            $table->foreignId('product_variant_id')
                ->nullable()
                ->after('product_id')
                ->constrained('product_variants')
                ->onDelete('cascade');

            $table->decimal('warehouse_stock', 10, 2)
                ->default(0)
                ->after('current_stock')
                ->comment('Stock received from POs, not yet pushed to storefront');

            // Re-add product_id foreign key
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');

            // New composite unique constraint
            $table->unique(['product_id', 'product_variant_id'], 'inventory_product_variant_unique');
        });
    }

    public function down()
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->dropUnique('inventory_product_variant_unique');
            $table->dropForeign(['product_variant_id']);
            $table->dropColumn(['product_variant_id', 'warehouse_stock']);
            $table->unique('product_id');
        });
    }
}
