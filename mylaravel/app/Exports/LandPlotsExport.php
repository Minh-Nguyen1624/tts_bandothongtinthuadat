<?php

namespace App\Exports;

use App\Models\land_plots;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class LandPlotsExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected $filters; // Sửa $fillters -> $filters

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        $query = land_plots::query();

        // Áp dụng filters nếu có
        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('ten_chu', 'LIKE', "%{$search}%")
                  ->orWhere('so_to', 'LIKE', "%{$search}%")
                  ->orWhere('so_thua', 'LIKE', "%{$search}%")
                  ->orWhere('ky_hieu_mdsd', 'LIKE', "%{$search}%")
                  ->orWhere('phuong_xa', 'LIKE', "%{$search}%");
            });
        }

        if (!empty($this->filters['phuong_xa'])) {
            $query->where('phuong_xa', $this->filters['phuong_xa']);
        }

        if (!empty($this->filters['ids'])) {
            $query->whereIn('id', $this->filters['ids']);
        }

        return $query->orderBy('phuong_xa')
                    ->orderBy('so_to')
                    ->orderBy('so_thua')
                    ->get();
    }

    public function headings(): array
    {
        return [
            'STT',
            'Tên chủ',
            'Số tờ',
            'Số thửa', 
            'Ký hiệu mục đích sử dụng',
            'Diện tích (m²)',
            'Phường/Xã',
            'ODT',
            'Phương kế',
            'Ghi chú',
            'Ngày tạo',
            'Ngày cập nhật'
        ];
    }

    public function map($landPlot): array
    {
        static $stt = 0;
        $stt++;

        return [
            $stt,
            $landPlot->ten_chu ?? '',
            $landPlot->so_to ?? '',
            $landPlot->so_thua ?? '',
            $landPlot->ky_hieu_mdsd ?? '',
            $landPlot->dien_tich ?? '',
            $landPlot->phuong_xa ?? '',
            $landPlot->odt ?? '',
            $landPlot->phuong_ke ?? '',
            $landPlot->ghi_chu ?? '',
            $landPlot->created_at ? $landPlot->created_at->format('d/m/Y H:i') : '',
            $landPlot->updated_at ? $landPlot->updated_at->format('d/m/Y H:i') : '',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Style cho header (dòng 1)
        $sheet->getStyle('A1:L1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '3498DB'],
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                ],
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Auto size columns
        foreach (range('A', 'L') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Style cho toàn bộ dữ liệu
        $lastRow = $sheet->getHighestRow();
        if ($lastRow > 1) {
            $sheet->getStyle('A2:L' . $lastRow)->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                    ],
                ],
            ]);
        }

        // Căn giữa cho các cột số
        $sheet->getStyle('A:A')->getAlignment()->setHorizontal('center');
        $sheet->getStyle('C:D')->getAlignment()->setHorizontal('center');
        $sheet->getStyle('F:F')->getAlignment()->setHorizontal('center');

        return [];
    }
}