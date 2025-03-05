import { Component, OnInit } from '@angular/core';
import { AdminService } from '../services/admin.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { User, UserStats } from '../interfaces/user.interface';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">จัดการระบบ</h1>
      
      <!-- สถิติ -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">ผู้ใช้ทั้งหมด</h3>
          <p class="text-2xl">{{stats.totalUsers || 0}}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">ยืนยันอีเมลแล้ว</h3>
          <p class="text-2xl">{{stats.verifiedUsers || 0}}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2">ผู้ดูแลระบบ</h3>
          <p class="text-2xl">{{stats.adminUsers || 0}}</p>
        </div>
      </div>

      <!-- ตารางผู้ใช้ -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รูปโปรไฟล์</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมล</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บทบาท</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let user of users">
              <td class="px-6 py-4 whitespace-nowrap">
                <img [src]="user.profileImage || 'assets/images/default-avatar.png'"
                     class="h-10 w-10 rounded-full object-cover"
                     [alt]="user.name">
              </td>
              <td class="px-6 py-4 whitespace-nowrap">{{user.name}}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{user.email}}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full"
                      [class]="user.isVerified ? 
                        'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'">
                  {{user.isVerified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}}
                </span>
                <button *ngIf="!user.isVerified"
                        (click)="verifyUser(user._id)"
                        class="ml-2 text-xs text-blue-600 hover:text-blue-800">
                  ยืนยันตอนนี้
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <select [(ngModel)]="user.role" 
                        (change)="updateUserRole(user._id, user.role)"
                        class="rounded border-gray-300 text-sm">
                  <option value="user">ผู้ใช้ทั่วไป</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </td>
              <td class="px-6 py-4 whitespace-nowrap space-x-2">
                <button (click)="editUser(user)"
                        class="text-blue-600 hover:text-blue-900 text-sm">
                  แก้ไข
                </button>
                <button (click)="deleteUser(user._id)" 
                        class="text-red-600 hover:text-red-900 text-sm">
                  ลบ
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  users: any[] = [];
  stats: UserStats = {
    totalUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  loadStats(): void {
    this.adminService.getUserStats().subscribe({
      next: (data: UserStats) => {
        this.stats = data;
      },
      error: (error: Error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  updateUserRole(userId: string, newRole: string): void {
    Swal.fire({
      title: 'ยืนยันการเปลี่ยนบทบาท',
      text: `คุณต้องการเปลี่ยนบทบาทผู้ใช้เป็น ${newRole} ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.updateUserRole(userId, newRole).subscribe({
          next: () => {
            this.loadStats();
            Swal.fire('สำเร็จ', 'เปลี่ยนบทบาทเรียบร้อยแล้ว', 'success');
          },
          error: (error) => {
            console.error('Error updating role:', error);
            Swal.fire('ผิดพลาด', 'ไม่สามารถเปลี่ยนบทบาทได้', 'error');
          }
        });
      }
    });
  }

  verifyUser(userId: string): void {
    Swal.fire({
      title: 'ยืนยันการดำเนินการ',
      text: 'คุณต้องการยืนยันผู้ใช้นี้ใช่หรือไม่?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.verifyUser(userId).subscribe({
          next: () => {
            this.loadUsers();
            this.loadStats();
            Swal.fire('สำเร็จ', 'ยืนยันผู้ใช้เรียบร้อยแล้ว', 'success');
          },
          error: (error) => {
            console.error('Error verifying user:', error);
            Swal.fire('ผิดพลาด', 'ไม่สามารถยืนยันผู้ใช้ได้', 'error');
          }
        });
      }
    });
  }

  editUser(user: User): void {
    Swal.fire({
      title: 'แก้ไขข้อมูลผู้ใช้',
      html: `
        <input id="name" class="swal2-input" placeholder="ชื่อ" value="${user.name}">
        <input id="email" class="swal2-input" placeholder="อีเมล" value="${user.email}">
        <input id="phone" class="swal2-input" placeholder="เบอร์โทร" value="${user.phone || ''}">
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        return {
          name: (document.getElementById('name') as HTMLInputElement).value,
          email: (document.getElementById('email') as HTMLInputElement).value,
          phone: (document.getElementById('phone') as HTMLInputElement).value
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.updateUser(user._id, result.value).subscribe({
          next: () => {
            this.loadUsers();
            Swal.fire('สำเร็จ', 'อัพเดทข้อมูลเรียบร้อยแล้ว', 'success');
          },
          error: (error) => {
            console.error('Error updating user:', error);
            Swal.fire('ผิดพลาด', 'ไม่สามารถอัพเดทข้อมูลได้', 'error');
          }
        });
      }
    });
  }

  deleteUser(userId: string): void {
    Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteUser(userId).subscribe({
          next: () => {
            this.users = this.users.filter(user => user._id !== userId);
            this.loadStats();
            Swal.fire('สำเร็จ', 'ลบผู้ใช้เรียบร้อยแล้ว', 'success');
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            Swal.fire('ผิดพลาด', 'ไม่สามารถลบผู้ใช้ได้', 'error');
          }
        });
      }
    });
  }
} 