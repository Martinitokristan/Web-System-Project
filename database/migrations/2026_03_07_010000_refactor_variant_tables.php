<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RefactorVariantTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // 1. Rename existing tables to match the new architecture
        if (Schema::hasTable('product_variants') && !Schema::hasTable('variants')) {
            Schema::rename('product_variants', 'variants');
        }
        
        if (Schema::hasTable('product_variant_values') && !Schema::hasTable('variant_values')) {
            Schema::rename('product_variant_values', 'variant_values');
        }

        // 2. Drop the pivot table as we are moving to a combination-based approach
        Schema::dropIfExists('product_variant_value_product');

        // 3. Create the new product_variants table for specific combinations
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            // Using size_value_id and color_value_id as per requirements
            $table->foreignId('size_value_id')->nullable()->constrained('variant_values')->onDelete('set null');
            $table->foreignId('color_value_id')->nullable()->constrained('variant_values')->onDelete('set null');
            $table->integer('stock')->default(0);
            $table->decimal('price_override', 10, 2)->nullable();
            $table->string('sku_suffix')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('product_variants');
        
        if (Schema::hasTable('variants') && !Schema::hasTable('product_variants')) {
            Schema::rename('variants', 'product_variants');
        }
        
        if (Schema::hasTable('variant_values') && !Schema::hasTable('product_variant_values')) {
            Schema::rename('variant_values', 'product_variant_values');
        }
    }
}
