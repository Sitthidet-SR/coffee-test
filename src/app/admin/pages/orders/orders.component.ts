import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faCheck, faTruck, faTimes, faEdit, faTrash, faCreditCard, faQrcode, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { AdminService } from '../../../services/admin.service';
import { Order } from '../../../interfaces/order.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h2 class="text-2xl font-bold mb-6">จัดการคำสั่งซื้อ</h2>

      <!-- ตัวกรอง -->
      <div class="mb-6 flex gap-4">
        <select 
          [(ngModel)]="statusFilter" 
          (change)="filterOrders()"
          class="rounded-lg border-gray-300 focus:border-amber-500 focus:ring-amber-500">
          <option value="all">ทั้งหมด</option>
          <option value="pending">รอดำเนินการ</option>
          <option value="processing">กำลังดำเนินการ</option>
          <option value="completed">เสร็จสิ้น</option>
          <option value="cancelled">ยกเลิก</option>
        </select>

        <select 
          [(ngModel)]="paymentFilter"
          (change)="filterOrders()"
          class="rounded-lg border-gray-300 focus:border-amber-500 focus:ring-amber-500">
          <option value="all">การชำระเงินทั้งหมด</option>
          <option value="pending">รอชำระ</option>
          <option value="paid">ชำระแล้ว</option>
          <option value="failed">ชำระไม่สำเร็จ</option>
        </select>
      </div>

      <!-- สถิติ -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2 text-gray-600">คำสั่งซื้อทั้งหมด</h3>
          <p class="text-3xl font-bold text-amber-600">{{stats.total}}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2 text-gray-600">รอดำเนินการ</h3>
          <p class="text-3xl font-bold text-yellow-600">{{stats.pending}}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2 text-gray-600">กำลังดำเนินการ</h3>
          <p class="text-3xl font-bold text-blue-600">{{stats.processing}}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2 text-gray-600">ยอดขายรวม</h3>
          <p class="text-3xl font-bold text-green-600">฿{{stats.totalSales | number:'1.0-0'}}</p>
        </div>
      </div>

      <!-- ตารางคำสั่งซื้อ -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสคำสั่งซื้อ</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดรวม</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วิธีชำระเงิน</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะการชำระ</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะคำสั่งซื้อ</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let order of filteredOrders" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900">{{order._id.slice(-6)}}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{order.user.name}}</div>
                  <div class="text-sm text-gray-500">{{order.user.email}}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900">฿{{order.totalAmount}}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="getPaymentMethodClass(order.paymentMethod)">
                    <fa-icon [icon]="getPaymentIcon(order.paymentMethod)" class="mr-1"></fa-icon>
                    {{getPaymentMethodLabel(order.paymentMethod)}}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select 
                    [(ngModel)]="order.paymentStatus"
                    (change)="updatePaymentStatus(order)"
                    class="text-sm rounded-lg border-gray-300 focus:border-amber-500 focus:ring-amber-500">
                    <option value="pending">รอชำระเงิน</option>
                    <option value="paid">ชำระแล้ว</option>
                    <option value="failed">ชำระไม่สำเร็จ</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select 
                    [(ngModel)]="order.orderStatus"
                    (change)="updateOrderStatus(order)"
                    class="text-sm rounded-lg border-gray-300 focus:border-amber-500 focus:ring-amber-500">
                    <option value="pending">รอดำเนินการ</option>
                    <option value="processing">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{order.createdAt | date:'dd/MM/yyyy HH:mm'}}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button (click)="viewOrderDetails(order)" 
                          class="text-amber-600 hover:text-amber-900">
                    <fa-icon [icon]="faEye"></fa-icon>
                  </button>
                  <button (click)="deleteOrder(order._id)"
                          class="text-red-600 hover:text-red-900">
                    <fa-icon [icon]="faTrash"></fa-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  statusFilter: string = 'all';
  paymentFilter: string = 'all';
  stats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    totalSales: 0
  };

  // Icons
  faEye = faEye;
  faCheck = faCheck;
  faTruck = faTruck;
  faTimes = faTimes;
  faEdit = faEdit;
  faTrash = faTrash;
  faCreditCard = faCreditCard;
  faQrcode = faQrcode;
  faMoneyBill = faMoneyBill;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.adminService.getAllOrders().subscribe({
      next: (orders: Order[]) => {
        this.orders = orders;
        this.calculateStats();
        this.filterOrders();
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้', 'error');
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.orders.filter(o => o.orderStatus !== 'cancelled').length;
    this.stats.pending = this.orders.filter(o => o.orderStatus === 'pending').length;
    this.stats.processing = this.orders.filter(o => o.orderStatus === 'processing').length;
    this.stats.completed = this.orders.filter(o => o.orderStatus === 'completed').length;
    this.stats.cancelled = this.orders.filter(o => o.orderStatus === 'cancelled').length;

    // log เพื่อตรวจสอบ
    console.log('Orders for sales calculation:', this.orders
      .filter(o => o.paymentStatus === 'paid' && o.orderStatus !== 'cancelled')
      .map(o => ({
        id: o._id,
        amount: o.totalAmount,
        method: o.paymentMethod,
        status: o.paymentStatus
      }))
    );

    this.stats.totalSales = this.orders
      .filter(o => o.paymentStatus === 'paid' && o.orderStatus !== 'cancelled')
      .reduce((sum, order) => {
        // log แต่ละรายการที่นำมาคำนวณ
        console.log(`Adding order ${order._id}: ${order.totalAmount} (${order.paymentMethod})`);
        return sum + (order.totalAmount || 0);
      }, 0);

    // แยกยอดตามวิธีชำระเงินเพื่อตรวจสอบ
    const salesByMethod = {
      credit: this.orders
        .filter(o => o.paymentStatus === 'paid' && o.paymentMethod === 'credit')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      promptpay: this.orders
        .filter(o => o.paymentStatus === 'paid' && o.paymentMethod === 'promptpay')
        .reduce((sum, o) => sum + o.totalAmount, 0),
      cash: this.orders
        .filter(o => o.paymentStatus === 'paid' && o.paymentMethod === 'cash')
        .reduce((sum, o) => sum + o.totalAmount, 0)
    };

    console.log('Sales by payment method:', salesByMethod);
  }

  filterOrders(): void {
    this.filteredOrders = this.orders.filter(order => {
      const matchStatus = this.statusFilter === 'all' || order.orderStatus === this.statusFilter;
      const matchPayment = this.paymentFilter === 'all' || order.paymentStatus === this.paymentFilter;
      return matchStatus && matchPayment;
    });
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      'credit': 'บัตรเครดิต',
      'promptpay': 'พร้อมเพย์',
      'cash': 'เงินสด'
    };
    return labels[method] || method;
  }

  getPaymentMethodClass(method: string): string {
    const classes: { [key: string]: string } = {
      'credit': 'bg-blue-100 text-blue-800',
      'promptpay': 'bg-purple-100 text-purple-800',
      'cash': 'bg-green-100 text-green-800'
    };
    return classes[method] || 'bg-gray-100 text-gray-800';
  }

  getPaymentIcon(method: string) {
    const icons: { [key: string]: any } = {
      'credit': this.faCreditCard,
      'promptpay': this.faQrcode,
      'cash': this.faMoneyBill
    };
    return icons[method] || this.faCreditCard;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'รอชำระเงิน',
      'paid': 'ชำระแล้ว',
      'failed': 'ชำระไม่สำเร็จ'
    };
    return labels[status] || status;
  }

  getPaymentStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getOrderStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'รอดำเนินการ',
      'processing': 'กำลังดำเนินการ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return labels[status] || status;
  }

  async viewOrderDetails(order: Order): Promise<void> {
    const itemsList = order.items.map(item => 
      `<div class="flex justify-between border-b py-2">
        <span>${item.product.name} x ${item.quantity}</span>
        <span>฿${item.price * item.quantity}</span>
      </div>`
    ).join('');

    await Swal.fire({
      title: `คำสั่งซื้อ #${order._id.slice(-6)}`,
      html: `
        <div class="text-left">
          <h3 class="font-semibold mb-2">ข้อมูลลูกค้า</h3>
          <p>${order.user.name}</p>
          <p>${order.user.email}</p>
          <p>${order.shippingAddress.address}</p>
          <p>${order.shippingAddress.city}, ${order.shippingAddress.postalCode}</p>
          
          <h3 class="font-semibold mt-4 mb-2">รายการสินค้า</h3>
          ${itemsList}
          
          <div class="mt-4 text-right">
            <p class="font-semibold">ยอดรวม: ฿${order.totalAmount}</p>
          </div>
        </div>
      `,
      width: '600px'
    });
  }

  updateOrderStatus(order: Order): void {
    Swal.fire({
      title: 'ยืนยันการเปลี่ยนสถานะ',
      text: `ต้องการเปลี่ยนสถานะเป็น "${this.getOrderStatusLabel(order.orderStatus)}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.updateOrderStatus(order._id, order.orderStatus).subscribe({
          next: () => {
            this.loadOrders();
            Swal.fire('สำเร็จ', 'อัพเดทสถานะเรียบร้อย', 'success');
          },
          error: (error) => {
            console.error('Error updating order status:', error);
            Swal.fire('Error', 'ไม่สามารถอัพเดทสถานะได้', 'error');
          }
        });
      }
    });
  }

  deleteOrder(orderId: string): void {
    Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'ต้องการลบคำสั่งซื้อนี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteOrder(orderId).subscribe({
          next: () => {
            this.orders = this.orders.filter(order => order._id !== orderId);
            this.filterOrders();
            Swal.fire('สำเร็จ', 'ลบคำสั่งซื้อเรียบร้อย', 'success');
          },
          error: (error) => {
            console.error('Error deleting order:', error);
            Swal.fire('Error', 'ไม่สามารถลบคำสั่งซื้อได้', 'error');
          }
        });
      }
    });
  }

  updatePaymentStatus(order: Order): void {
    Swal.fire({
      title: 'ยืนยันการเปลี่ยนสถานะ',
      text: `ต้องการเปลี่ยนสถานะการชำระเงินเป็น "${this.getPaymentStatusLabel(order.paymentStatus)}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.updatePaymentStatus(order._id, order.paymentStatus).subscribe({
          next: () => {
            this.loadOrders();
            Swal.fire('สำเร็จ', 'อัพเดทสถานะการชำระเงินเรียบร้อย', 'success');
          },
          error: (error) => {
            console.error('Error updating payment status:', error);
            Swal.fire('Error', 'ไม่สามารถอัพเดทสถานะการชำระเงินได้', 'error');
          }
        });
      }
    });
  }
} 