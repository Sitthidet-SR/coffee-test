import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faUsers, 
  faUserCheck, 
  faUserShield,
  faChartLine,
  faShoppingCart,
  faCoffee,
  faBoxOpen,
  faClipboardList,
  faExclamationTriangle,
  faUser,
  faCreditCard,
  faCheckCircle,
  faHistory
} from '@fortawesome/free-solid-svg-icons';

// Define interfaces locally
interface Activity {
  type: 'USER_REGISTER' | 'NEW_ORDER' | 'PRODUCT_UPDATE' | 'USER_VERIFY' | 'USER_LOGIN' | 'USER_UPDATE' | 'USER_DELETE' | 'ORDER_CREATE' | 'ORDER_UPDATE' | 'ORDER_STATUS_CHANGE' | 'PRODUCT_CREATE' | 'PRODUCT_DELETE' | 'PRODUCT_STOCK_UPDATE' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED';
  message: string;
  timestamp: Date;
  data?: any;
}

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  // Font Awesome Icons
  faUsers = faUsers;
  faUserCheck = faUserCheck;
  faUserShield = faUserShield;
  faChartLine = faChartLine;
  faShoppingCart = faShoppingCart;
  faCoffee = faCoffee;
  faBoxOpen = faBoxOpen;
  faClipboardList = faClipboardList;
  faExclamationTriangle = faExclamationTriangle;
  faUser = faUser;
  faCreditCard = faCreditCard;
  faCheckCircle = faCheckCircle;
  faHistory = faHistory;

  recentActivities: Activity[] = [];
  dashboardStats: DashboardStats = {
    totalUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0
  };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboardStats();
    this.loadRecentActivities();
  }

  loadDashboardStats() {
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.dashboardStats = data;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
      }
    });
  }

  loadRecentActivities() {
    this.adminService.getRecentActivities(1, 5).subscribe({
      next: (response: any) => {
        this.recentActivities = response.activities || [];
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