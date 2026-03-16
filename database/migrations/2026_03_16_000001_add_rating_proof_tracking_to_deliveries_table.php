<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRatingProofTrackingToDeliveriesTable extends Migration
{
    public function up()
    {
        Schema::table('deliveries', function (Blueprint $table) {
            if (!Schema::hasColumn('deliveries', 'tracking_number')) {
                $table->string('tracking_number', 30)->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('deliveries', 'rating')) {
                $table->unsignedTinyInteger('rating')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('deliveries', 'rating_comment')) {
                $table->text('rating_comment')->nullable()->after('rating');
            }
            if (!Schema::hasColumn('deliveries', 'rated_at')) {
                $table->timestamp('rated_at')->nullable()->after('rating_comment');
            }
            if (!Schema::hasColumn('deliveries', 'proof_photo')) {
                $table->string('proof_photo')->nullable()->after('rated_at');
            }
        });
    }

    public function down()
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn(['tracking_number', 'rating', 'rating_comment', 'rated_at', 'proof_photo']);
        });
    }
}
