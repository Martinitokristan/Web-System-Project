<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPipelineFieldsToRiderProfilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('rider_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('rider_profiles', 'valid_id_type')) {
                $table->string('valid_id_type')->nullable()->after('plate_number');
            }
            if (!Schema::hasColumn('rider_profiles', 'valid_id_path')) {
                $table->string('valid_id_path')->nullable()->after('valid_id_type');
            }
            if (!Schema::hasColumn('rider_profiles', 'license_number')) {
                $table->string('license_number')->nullable()->after('valid_id_path');
            }
            if (!Schema::hasColumn('rider_profiles', 'address')) {
                $table->text('address')->nullable()->after('license_number');
            }
            if (!Schema::hasColumn('rider_profiles', 'interview_at')) {
                $table->dateTime('interview_at')->nullable()->after('address');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('rider_profiles', function (Blueprint $table) {
            $table->dropColumn(['valid_id_type', 'valid_id_path', 'license_number', 'address', 'interview_at']);
        });
    }
}
