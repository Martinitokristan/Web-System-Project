<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddApprovalFieldsToRiderProfiles extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('rider_profiles', function (Blueprint $table) {
            $table->string('valid_id_type')->nullable()->after('plate_number');
            $table->string('valid_id_path')->nullable()->after('valid_id_type');
            $table->text('address')->nullable()->after('valid_id_path');
            $table->timestamp('interview_at')->nullable()->after('address');
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
            $table->dropColumn(['valid_id_type', 'valid_id_path', 'address', 'interview_at']);
        });
    }
}
