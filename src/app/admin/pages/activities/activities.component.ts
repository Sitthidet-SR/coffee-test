import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faUser, 
  faShoppingCart, 
  faCoffee, 
  faCreditCard,
  faCheckCircle,
  faEdit,
  faTrash,
  faPlus,
  faSync
} from '@fortawesome/free-solid-svg-icons';

interface Activity {
  type: string;
  message: string;
  timestamp: Date;
  data?: any;
}

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">กิจกรรมทั้งหมดในระบบ</h2>
        <button (click)="loadActivities()" 
                class="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center">
          <fa-icon [icon]="faSync" class="mr-2"></fa-icon>
          รีเฟรช
        </button>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ข้อความ</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let activity of activities" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span [class]="getActivityTypeClass(activity.type)" class="px-3 py-1 rounded-full text-sm">
                      <fa-icon [icon]="getActivityIcon(activity.type)" class="mr-2"></fa-icon>
                      {{getActivityTypeLabel(activity.type)}}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-gray-900">{{activity.message}}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{activity.timestamp | date:'dd/MM/yyyy HH:mm:ss'}}
                </td>
              </tr>
              <tr *ngIf="activities.length === 0">
                <td colspan="3" class="px-6 py-4 text-center text-gray-500">
                  ไม่พบข้อมูลกิจกรรม
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ActivitiesComponent implements OnInit {
  activities: Activity[] = [];
  
  // Font Awesome Icons
  faUser = faUser;
  faShoppingCart = faShoppingCart;
  faCoffee = faCoffee;
  faCreditCard = faCreditCard;
  faCheckCircle = faCheckCircle;
  faEdit = faEdit;
  faTrash = faTrash;
  faPlus = faPlus;
  faSync = faSync;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadActivities();
  }

  loadActivities() {
    this.adminService.getRecentActivities().subscribe({
      next: (response: any) => {
        // ตรวจสอบว่าข้อมูลมาในรูปแบบที่ถูกต้อง
        this.activities = response.activities || [];
        console.log('Loaded activities:', this.activities);
      },
      error: (error) => {
        console.error('Error loading activities:', error);
      }
    });
  }

  getActivityTypeClass(type: string): string {
    const classes = {
      'USER_': 'bg-blue-100 text-blue-800',
      'ORDER_': 'bg-green-100 text-green-800',
      'PRODUCT_': 'bg-yellow-100 text-yellow-800',
      'PAYMENT_': 'bg-purple-100 text-purple-800'
    };

    for (const [prefix, className] of Object.entries(classes)) {
      if (type.startsWith(prefix)) {
        return className;
      }
    }
    return 'bg-gray-100 text-gray-800';
  }

  getActivityIcon(type: string) {
    if (type.startsWith('USER_')) return this.faUser;
    if (type.startsWith('ORDER_')) return this.faShoppingCart;
    if (type.startsWith('PRODUCT_')) return this.faCoffee;
    if (type.startsWith('PAYMENT_')) return this.faCreditCard;
    return this.faCheckCircle;
  }

  getActivityTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'USER_REGISTER': 'ลงทะเบียน',
      'USER_LOGIN': 'เข้าสู่ระบบ',
      'USER_UPDATE': 'แก้ไขข้อมูล',
      'USER_DELETE': 'ลบผู้ใช้',
      'USER_VERIFY': 'ยืนยันตัวตน',
      'ORDER_CREATE': 'คำสั่งซื้อใหม่',
      'ORDER_UPDATE': 'แก้ไขคำสั่งซื้อ',
      'ORDER_STATUS_CHANGE': 'เปลี่ยนสถานะ',
      'PRODUCT_CREATE': 'เพิ่มสินค้า',
      'PRODUCT_UPDATE': 'แก้ไขสินค้า',
      'PRODUCT_DELETE': 'ลบสินค้า',
      'PRODUCT_STOCK_UPDATE': 'อัพเดทสต็อก',
      'PAYMENT_SUCCESS': 'ชำระเงินสำเร็จ',
      'PAYMENT_FAILED': 'ชำระเงินไม่สำเร็จ'
    };
    return labels[type] || type;
  }
} 