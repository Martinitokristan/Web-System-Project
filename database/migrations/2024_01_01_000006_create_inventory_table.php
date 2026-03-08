<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInventoryTable extends Migration
{
    public function up()
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->unique()->constrained('products')->onDelete('cascade');
            $table->decimal('current_stock', 10, 2)->default(0);
            $table->decimal('reorder_threshold', 10, 2)->default(10);
            $table->timestamp('last_adjusted_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('inventory');
    }
}
