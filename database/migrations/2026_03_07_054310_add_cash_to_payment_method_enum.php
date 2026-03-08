<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCashToPaymentMethodEnum extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::statement("ALTER TABLE sales MODIFY COLUMN payment_method ENUM('cod', 'cash', 'gcash', 'bank_transfer') NOT NULL");
    }

    public function down()
    {
        DB::statement("ALTER TABLE sales MODIFY COLUMN payment_method ENUM('cod', 'gcash', 'bank_transfer') NOT NULL");
    }
}
