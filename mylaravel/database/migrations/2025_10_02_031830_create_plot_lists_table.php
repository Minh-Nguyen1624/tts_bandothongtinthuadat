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
        Schema::create('plot_lists', function (Blueprint $table) {
            $table->id(); // Sẽ tự động tạo cột 'id' bigint primary key
            $table->string('organization_name')->nullable();
            $table->integer('so_to')->nullable();
            $table->integer('so_thua')->nullable();
            $table->string('dia_chi_thua_dat')->nullable();
            $table->string('xa')->nullable();
            $table->decimal('dien_tich', 10, 2)->nullable();
            $table->timestamps(); // Sẽ tạo created_at và updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plot_lists');
    }
};