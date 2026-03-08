<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDeliveriesTable extends Migration
{
    public function up()
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->unique()->constrained('sales')->onDelete('cascade');
            $table->foreignId('rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['pending', 'in_progress', 'delivered', 'failed'])->default('pending');
            $table->text('address');
            $table->timestamp('pickup_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('deliveries');
    }
}
