<?php

namespace App\Exports;

use App\Models\land_plots;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class LandPlotsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
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
        $query = land_plots::query();

        // Lọc theo từ khóa tìm kiếm
        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('ten_chu', 'like', "%{$search}%")
                    ->orWhere('so_to', 'like', "%{$search}%")
                    ->orWhere('so_thua', 'like', "%{$search}%")
                    ->orWhere('ky_hieu_mdsd', 'like', "%{$search}%")
                    ->orWhere('phuong_xa', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        // Lọc theo ID danh sách
        if (!empty($this->filters['plot_list_id'])) {
            $query->where('plot_list_id', $this->filters['plot_list_id']);
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
            'Ký hiệu MĐSD',
            'Phường/Xã',
            'Trạng thái',
            'Ngày tạo',
            'Cập nhật',
        ];
    }

    /**
     * Định dạng dữ liệu cho từng dòng
     */
    public function map($land_plot): array
    {
        return [
            $land_plot->id,
            $land_plot->ten_chu,
            $land_plot->so_to,
            $land_plot->so_thua,
            $land_plot->ky_hieu_mdsd,
            $land_plot->phuong_xa,
            $land_plot->status,
            optional($land_plot->created_at)->format('d/m/Y H:i'),
            optional($land_plot->updated_at)->format('d/m/Y H:i'),
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
     * Định dạng style cho file Excel
     */
    public function styles(Worksheet $sheet)
    {
        // Style cho hàng tiêu đề
        $sheet->getStyle('A1:I1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '2E86C1'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Căn giữa các cột số
        $sheet->getStyle('A:I')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Tự động giãn độ rộng các cột
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Căn chiều cao cho dòng đầu
        $sheet->getRowDimension(1)->setRowHeight(25);

        return [];
    }
}
