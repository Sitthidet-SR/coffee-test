import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faChartLine, 
  faBoxes,
  faCoins,
  faChartBar,
  faDownload,
  faCalendarDay, 
  faCalendarWeek, 
  faCalendarAlt,
  faCrown
} from '@fortawesome/free-solid-svg-icons';
import { SalesReport, TopProduct, ReportData } from '../../../interfaces/report.interface';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { THSarabunNew } from '../../../utils/fonts/THSarabunNew-normal';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">รายงานภาพรวม</h2>
        <!-- เพิ่มปุ่มส่งออก PDF -->
        <button 
          (click)="exportToPDF()" 
          class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center">
          <fa-icon [icon]="faDownload" class="mr-2"></fa-icon>
          ส่งออก PDF
        </button>
      </div>

      <!-- สรุปยอดขาย -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-600">ยอดขายวันนี้</h3>
            <fa-icon [icon]="faCalendarDay" class="text-amber-500 text-xl"></fa-icon>
          </div>
          <p class="text-3xl font-bold text-amber-600">฿{{sales?.today | number:'1.0-0'}}</p>
          <p class="text-sm text-gray-500 mt-2">จำนวน {{sales?.todayOrders}} คำสั่งซื้อ</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-600">ยอดขายสัปดาห์นี้</h3>
            <fa-icon [icon]="faCalendarWeek" class="text-amber-500 text-xl"></fa-icon>
          </div>
          <p class="text-3xl font-bold text-amber-600">฿{{sales?.thisWeek | number:'1.0-0'}}</p>
          <p class="text-sm text-gray-500 mt-2">จำนวน {{sales?.weekOrders}} คำสั่งซื้อ</p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-600">ยอดขายเดือนนี้</h3>
            <fa-icon [icon]="faCalendarAlt" class="text-amber-500 text-xl"></fa-icon>
          </div>
          <p class="text-3xl font-bold text-amber-600">฿{{sales?.thisMonth | number:'1.0-0'}}</p>
          <p class="text-sm text-gray-500 mt-2">จำนวน {{sales?.monthOrders}} คำสั่งซื้อ</p>
        </div>
      </div>

      <!-- สินค้าขายดี -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b">
          <div class="flex items-center">
            <fa-icon [icon]="faCrown" class="text-amber-500 text-xl mr-2"></fa-icon>
            <h3 class="text-lg font-semibold">สินค้าขายดี</h3>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลำดับ</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รูปสินค้า</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สินค้า</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนขาย</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดขาย</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let product of topProducts; let i = index" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{i + 1}}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <img 
                    [src]="product.image || 'assets/images/no-image.png'" 
                    [alt]="product.name"
                    class="h-12 w-12 rounded-lg object-cover"
                  >
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900">{{product.name}}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{product.totalQuantity | number}} ชิ้น
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ฿{{product.totalAmount | number:'1.0-0'}}
                </td>
              </tr>
              <tr *ngIf="!topProducts?.length">
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                  ไม่พบข้อมูลสินค้าขายดี
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  sales?: SalesReport;
  topProducts: TopProduct[] = [];

  // Font Awesome Icons
  faChartLine = faChartLine;
  faBoxes = faBoxes;
  faCoins = faCoins;
  faChartBar = faChartBar;
  faDownload = faDownload;
  faCalendarDay = faCalendarDay;
  faCalendarWeek = faCalendarWeek;
  faCalendarAlt = faCalendarAlt;
  faCrown = faCrown;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.adminService.getReports().subscribe({
      next: (data: ReportData) => {
        console.log('Reports data:', data);
        this.sales = data.sales;
        this.topProducts = data.topProducts;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
      }
    });
  }

  formatNumber(num: number | undefined): string {
    if (num === undefined) return '0';
    return new Intl.NumberFormat('th-TH').format(num);
  }

  async exportToPDF() {
    try {
      Swal.fire({
        title: 'กำลังสร้าง PDF',
        html: `<div class="text-center">กรุณารอสักครู่...</div>`,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading(null);
        }
      });

      // สร้าง PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
      });

      // เพิ่มฟอนต์ THSarabunNew
      doc.addFileToVFS('THSarabunNew-normal.ttf', THSarabunNew);
      doc.addFont('THSarabunNew-normal.ttf', 'THSarabunNew', 'normal');
      doc.setFont('THSarabunNew');

      // ตั้งค่าสีและขนาด
      const colors = {
        primary: [251, 191, 36] as [number, number, number],
        secondary: [67, 56, 202] as [number, number, number],
        text: [31, 41, 55] as [number, number, number],
        light: [243, 244, 246] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
        gray: [156, 163, 175] as [number, number, number]
      };

      const margins = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      };

      // วาดพื้นหลังส่วนหัว
      doc.setFillColor(...colors.primary);
      doc.roundedRect(0, 0, 210, 45, 0, 0, 'F');

      // โลโก้และชื่อร้าน
      doc.setTextColor(...colors.white);
      doc.setFontSize(28);
      doc.text('JACK COFFEE', 105, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text('รายงานยอดขายประจำวัน', 105, 32, { align: 'center' });

      // วันที่รายงาน
      const currentDate = new Date().toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.setFontSize(12);
      doc.text(currentDate, 20, 55);

      // กล่องสรุปยอดขาย
      const boxConfig = {
        width: 55,
        height: 35,
        gap: 7,
        startY: 65
      };

      // ฟังก์ชันสำหรับวาดกล่องข้อมูล
      const drawInfoBox = (title: string, value: string, index: number) => {
        const x = margins.left + (boxConfig.width + boxConfig.gap) * index;
        const y = boxConfig.startY;
        
        // วาดกล่อง
        doc.setFillColor(...colors.light);
        doc.roundedRect(x, y, boxConfig.width, boxConfig.height, 3, 3, 'F');
        
        // หัวข้อ
        doc.setTextColor(...colors.text);
        doc.setFontSize(10);
        doc.text(title, x + boxConfig.width/2, y + 8, { align: 'center' });
        
        // ค่า
        doc.setFontSize(16);
        doc.text(value, x + boxConfig.width/2, y + 25, { align: 'center' });
      };

      // วาดกล่องข้อมูลทั้ง 3 กล่อง
      drawInfoBox('ยอดขายวันนี้', '฿' + this.formatNumber(this.sales?.today), 0);
      drawInfoBox('ยอดสัปดาห์นี้', '฿' + this.formatNumber(this.sales?.thisWeek), 1);
      drawInfoBox('ยอดเดือนนี้', '฿' + this.formatNumber(this.sales?.thisMonth), 2);

      let yPos = boxConfig.startY + boxConfig.height + 20;

      // หัวข้อตารางสรุปยอดขาย
      doc.setTextColor(...colors.secondary);
      doc.setFontSize(16);
      doc.text('สรุปยอดขาย', margins.left, yPos);

      yPos += 10;

      // ตารางสรุปยอดขาย
      autoTable(doc, {
        startY: yPos,
        head: [['ช่วงเวลา', 'จำนวนคำสั่งซื้อ', 'ยอดขาย', 'เฉลี่ยต่อคำสั่งซื้อ']],
        body: [
          [
            'วันนี้',
            (this.sales?.todayOrders || 0) + ' รายการ',
            '฿ ' + this.formatNumber(this.sales?.today),
            '฿ ' + this.formatNumber((this.sales?.today || 0) / (this.sales?.todayOrders || 1))
          ],
          [
            'สัปดาห์นี้',
            (this.sales?.weekOrders || 0) + ' รายการ',
            '฿ ' + this.formatNumber(this.sales?.thisWeek),
            '฿ ' + this.formatNumber((this.sales?.thisWeek || 0) / (this.sales?.weekOrders || 1))
          ],
          [
            'เดือนนี้',
            (this.sales?.monthOrders || 0) + ' รายการ',
            '฿ ' + this.formatNumber(this.sales?.thisMonth),
            '฿ ' + this.formatNumber((this.sales?.thisMonth || 0) / (this.sales?.monthOrders || 1))
          ]
        ],
        theme: 'striped',
        styles: {
          font: 'THSarabunNew',
          fontSize: 12,
          cellPadding: 6,
          overflow: 'linebreak',
          cellWidth: 'auto',
          textColor: colors.text,
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: colors.primary,
          textColor: colors.white,
          fontSize: 12,
          fontStyle: 'normal',
          halign: 'center',
          valign: 'middle',
          minCellHeight: 20
        },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: colors.light
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;

      // หัวข้อตารางสินค้าขายดี
      doc.setTextColor(...colors.secondary);
      doc.setFontSize(16);
      doc.text('สินค้าขายดี', margins.left, yPos);

      yPos += 10;

      // ตารางสินค้าขายดี
      autoTable(doc, {
        startY: yPos,
        head: [['สินค้า', 'จำนวนขาย', 'ยอดขายรวม', 'ราคาเฉลี่ย/ชิ้น']],
        body: this.topProducts.map(product => [
          product.name,
          product.totalQuantity + ' ชิ้น',
          '฿ ' + this.formatNumber(product.totalAmount),
          '฿ ' + this.formatNumber(product.totalAmount / product.totalQuantity)
        ]),
        theme: 'striped',
        styles: {
          font: 'THSarabunNew',
          fontSize: 12,
          cellPadding: 6,
          overflow: 'linebreak',
          cellWidth: 'auto',
          textColor: colors.text,
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: colors.primary,
          textColor: colors.white,
          fontSize: 12,
          fontStyle: 'normal',
          halign: 'center',
          valign: 'middle',
          minCellHeight: 20
        },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: colors.light
        }
      });

      // เพิ่มเชิงอรรถ
      doc.setFontSize(10);
      doc.setTextColor(...colors.gray);
      doc.text(
        'สร้างโดยระบบจัดการร้าน Jack Coffee',
        105,
        285,
        { align: 'center' }
      );

      // เพิ่มเลขหน้า
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(...colors.gray);
        doc.text(
          'หน้า ' + i + ' จาก ' + pageCount,
          105,
          290,
          { align: 'center' }
        );
      }

      // บันทึก PDF
      const fileName = 'รายงานยอดขาย-' + new Date().toISOString().slice(0,10) + '.pdf';
      doc.save(fileName);

      // ปิด loading
      Swal.close();

      // แสดงข้อความสำเร็จ
      setTimeout(() => {
        Swal.fire({
          icon: 'success',
          title: 'สร้าง PDF สำเร็จ',
          text: 'ไฟล์ PDF ถูกดาวน์โหลดแล้ว',
          timer: 2000,
          showConfirmButton: false
        });
      }, 100);

    } catch (error) {
      console.error('PDF Generation Error:', error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่อีกครั้ง'
      });
    }
  }
} 