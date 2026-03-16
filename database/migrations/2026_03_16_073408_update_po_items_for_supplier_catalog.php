<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdatePoItemsForSupplierCatalog extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Use raw SQL to make product_id nullable since change() requires doctrine/dbal
        DB::statement('ALTER TABLE purchase_order_items MODIFY product_id BIGINT UNSIGNED NULL');

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->foreignId('supplier_product_id')->nullable()->constrained('supplier_products')->onDelete('set null');
            $table->foreignId('supplier_product_variant_id')->nullable()->constrained('supplier_product_variants', 'id', 'po_items_svid_fk')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropForeign(['supplier_product_id']);
            $table->dropColumn('supplier_product_id');
            $table->dropForeign('po_items_svid_fk');
            $table->dropColumn('supplier_product_variant_id');
        });

        DB::statement('ALTER TABLE purchase_order_items MODIFY product_id BIGINT UNSIGNED NOT NULL');
    }
}
