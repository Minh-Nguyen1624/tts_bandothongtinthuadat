<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('land_plots', function (Blueprint $table) {
            // Xóa cột cũ nếu có (đề phòng)
            if (Schema::hasColumn('land_plots', 'plot_lists_id')) {
                $table->dropColumn('plot_lists_id');
            }

            // Tạo cột mới chuẩn
            $table->foreignId('plot_list_id')
                ->nullable()
                ->constrained('plot_lists')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('land_plots', function (Blueprint $table) {
            $table->dropForeign(['plot_list_id']);
            $table->dropColumn('plot_list_id');
        });
    }

};
