<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('land_plots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plot_lists_id')->nullable()->constrained('plot_lists')->onDelete('set null');
            $table->string('ten_chu')->nullable(); // chỉ lưu tên chủ
            $table->integer('so_to');
            $table->integer('so_thua');
            $table->string('ky_hieu_mdsd'); // ví dụ: ODT, ONT, CLN
            $table->string('phuong_xa');
            $table->enum('status', ['available', 'owned', 'suspended'])->default('available');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('land_plots');
    }
};
