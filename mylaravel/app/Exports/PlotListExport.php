<?php

namespace App\Exports;

use App\Models\PlotList;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class PlotListExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    /**
     * Lấy dữ liệu từ database có áp dụng filter (nếu có)
     */
    public function collection()
    {
        $query = PlotList::query();

        // Lọc theo từ khóa tìm kiếm
        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('organization_name', 'like', "%{$search}%")
                    ->orWhere('so_to', 'like', "%{$search}%")
                    ->orWhere('so_thua', 'like', "%{$search}%")
                    ->orWhere('dia_chi_thua_dat', 'like', "%{$search}%")
                    ->orWhere('xa', 'like', "%{$search}%");
            });
        }

        // Lọc theo xã
        if (!empty($this->filters['xa'])) {
            $query->where('xa', $this->filters['xa']);
        }

        return $query->get();
    }

    /**
     * Tiêu đề các cột
     */
    public function headings(): array
    {
        return [
            'STT',
            'Tên chủ sở hữu',
            'Số tờ',
            'Số thửa',
            'Địa chỉ thửa đất',
            'Xã',
            'Diện tích (m²)',
            'Ngày tạo',
            'Ngày cập nhật',
        ];
    }

    /**
     * Map dữ liệu mỗi dòng
     */
    public function map($plotList): array
    {
        static $index = 0;
        $index++;

        return [
            $index,
            $plotList->organization_name ?? 'Không có',
            $plotList->so_to,
            $plotList->so_thua,
            $plotList->dia_chi_thua_dat ?? 'Không có',
            $plotList->xa ?? 'Không có',
            $plotList->dien_tich ? number_format($plotList->dien_tich, 2) : '0',
            optional($plotList->created_at)->format('d/m/Y H:i'),
            optional($plotList->updated_at)->format('d/m/Y H:i'),
        ];
    }

    /**
     * Đặt tên sheet
     */
    public function title(): string
    {
        return 'Danh sách thửa đất';
    }

    /**
     * Style cho Excel sheet
     */
    public function styles(Worksheet $sheet)
    {
        // Style hàng đầu tiên (header)
        $sheet->getStyle('A1:I1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2E86C1'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ]);

        // Tự động căn chỉnh độ rộng
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return [];
    }
}
