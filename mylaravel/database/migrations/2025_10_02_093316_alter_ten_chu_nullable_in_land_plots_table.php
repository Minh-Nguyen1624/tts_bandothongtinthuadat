<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(){
        Schema::table('land_plots', function (Blueprint $table) {
            $table->string('ten_chu')->nullable()->change();
        });
    }

    public function down(){
        Schema::table('land_plots', function (Blueprint $table) {
            $table->string('ten_chu')->nullable(false)->change();
        });
    }
};
