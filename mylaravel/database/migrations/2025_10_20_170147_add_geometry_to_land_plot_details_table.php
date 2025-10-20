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
        Schema::table('land_plot_details', function (Blueprint $table) {
            $table->geometry('geometry')->nullable()->after('dien_tich');
            $table->spatialIndex('geometry');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('land_plot_details', function (Blueprint $table) {
            $table->dropSpatialIndex(['geometry']);
            $table->dropColumn('geometry');
        });
    }
};