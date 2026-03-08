<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddExtraDetailsToCustomerProfilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('customer_profiles', function (Blueprint $table) {
            $table->unsignedInteger('age')->nullable()->after('user_id');
            $table->enum('sex', ['male', 'female', 'other'])->nullable()->after('age');
            $table->string('province', 100)->nullable()->after('landmark');
            $table->string('municipality', 100)->nullable()->after('province');
            $table->string('zip_code', 10)->nullable()->after('municipality');
        });
    }

    public function down()
    {
        Schema::table('customer_profiles', function (Blueprint $table) {
            $table->dropColumn(['age', 'sex', 'province', 'municipality', 'zip_code']);
        });
    }
}
