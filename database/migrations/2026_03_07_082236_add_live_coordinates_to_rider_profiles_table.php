<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddLiveCoordinatesToRiderProfilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('rider_profiles', function (Blueprint $table) {
            $table->decimal('current_latitude', 10, 7)->nullable()->after('plate_number');
            $table->decimal('current_longitude', 10, 7)->nullable()->after('current_latitude');
        });
    }

    public function down()
    {
        Schema::table('rider_profiles', function (Blueprint $table) {
            $table->dropColumn(['current_latitude', 'current_longitude']);
        });
    }
}
