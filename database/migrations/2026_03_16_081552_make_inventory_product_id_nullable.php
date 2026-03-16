<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MakeInventoryProductIdNullable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('inventory', function (Blueprint $table) {
            // Drop old unique constraint and foreign key
            $table->dropForeign(['product_id']);
            $table->dropUnique('inventory_product_variant_unique');
        });

        // Use raw SQL to make product_id nullable because of potential Doctrine issues
        DB::statement('ALTER TABLE inventory MODIFY product_id BIGINT UNSIGNED NULL');

        Schema::table('inventory', function (Blueprint $table) {
            // Re-add product_id foreign key as nullable
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');

            $table->foreignId('supplier_product_id')
                ->nullable()
                ->after('product_variant_id')
                ->constrained('supplier_products')
                ->onDelete('set null');

            // Add new unique constraint that includes supplier_product_id
            $table->unique(['product_id', 'product_variant_id', 'supplier_product_id'], 'inventory_refined_unique');
        });
    }

    public function down()
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->dropUnique('inventory_refined_unique');
            $table->dropForeign(['supplier_product_id']);
            $table->dropForeign(['product_id']);
            $table->dropColumn('supplier_product_id');
        });

        DB::statement('ALTER TABLE inventory MODIFY product_id BIGINT UNSIGNED NOT NULL');

        Schema::table('inventory', function (Blueprint $table) {
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->unique(['product_id', 'product_variant_id'], 'inventory_product_variant_unique');
        });
    }
}
