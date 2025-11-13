<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            // Bước 1: Thêm cột code cho phép NULL
            $table->string('code')->nullable()->after('name');
        });

        // Bước 2: Cập nhật giá trị code cho các bản ghi hiện có
        DB::table('teams')->get()->each(function ($team, $index) {
            DB::table('teams')
                ->where('id', $team->id)
                ->update([
                    'code' => 'TEAM-' . ($index + 1) . '-' . strtoupper(Str::random(3))
                ]);
        });

        // Bước 3: Thay đổi cột code thành NOT NULL và UNIQUE
        Schema::table('teams', function (Blueprint $table) {
            $table->string('code')->nullable(false)->unique()->change();
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn('code');
        });
    }
};