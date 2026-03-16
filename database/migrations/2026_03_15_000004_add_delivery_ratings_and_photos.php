<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Add rating columns to deliveries table
        if (Schema::hasTable('deliveries')) {
            Schema::table('deliveries', function (Blueprint $table) {
                if (!Schema::hasColumn('deliveries', 'rating')) {
                    $table->tinyInteger('rating')->nullable()->after('status');
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
                if (!Schema::hasColumn('deliveries', 'delivered_at')) {
                    $table->timestamp('delivered_at')->nullable()->after('proof_photo');
                }
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('deliveries')) {
            Schema::table('deliveries', function (Blueprint $table) {
                $table->dropColumn(['rating', 'rating_comment', 'rated_at', 'proof_photo', 'delivered_at']);
            });
        }
    }
};
