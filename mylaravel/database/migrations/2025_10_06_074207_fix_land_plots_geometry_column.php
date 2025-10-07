<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kiểm tra xem cột geom đã tồn tại chưa
        $columnExists = DB::selectOne("
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'land_plots' AND column_name = 'geom'
        ");

        if (!$columnExists) {
            // Nếu chưa có, tạo cột geom
            DB::statement('ALTER TABLE land_plots ADD COLUMN geom geometry(Polygon,4326)');
        } else {
            // Nếu đã có, sửa kiểu dữ liệu cho đúng
            DB::statement('ALTER TABLE land_plots ALTER COLUMN geom TYPE geometry(Polygon,4326)');
        }

        // Tạo spatial index nếu chưa có
        DB::statement('CREATE INDEX IF NOT EXISTS land_plots_geom_idx ON land_plots USING GIST (geom)');
    }

    public function down(): void
    {
        // Không xóa cột geom khi rollback, chỉ xóa index
        DB::statement('DROP INDEX IF EXISTS land_plots_geom_idx');
    }
};