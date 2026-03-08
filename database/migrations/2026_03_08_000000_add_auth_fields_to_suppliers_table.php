<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'password')) {
                $table->string('password')->after('email');
            }
            if (!Schema::hasColumn('suppliers', 'status')) {
                $table->enum('status', ['active', 'inactive', 'pending'])->default('pending')->after('password');
            }
            if (!Schema::hasColumn('suppliers', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['email', 'password', 'status', 'email_verified_at']);
        });
    }
};
