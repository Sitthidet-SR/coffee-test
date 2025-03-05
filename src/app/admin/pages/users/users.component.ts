import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash, faEdit, faCheck, faUserShield, faKey } from '@fortawesome/free-solid-svg-icons';
import { AdminService } from '../../../services/admin.service';
import { User, UserStats } from '../../../interfaces/user.interface';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">จัดการผู้ใช้งาน</h2>
      
      <!-- สถิติ -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2 text-gray-600">ผู้ใช้ทั้งหมด</h3>
          <p class="text-3xl font-bold text-amber-600">{{stats.totalUsers || 0}}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2 text-gray-600">ยืนยันอีเมลแล้ว</h3>
          <p class="text-3xl font-bold text-green-600">{{stats.verifiedUsers || 0}}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-2 text-gray-600">ผู้ดูแลระบบ</h3>
          <p class="text-3xl font-bold text-blue-600">{{stats.adminUsers || 0}}</p>
        </div>
      </div>

      <!-- ตารางผู้ใช้ -->
      <div class="bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รูปโปรไฟล์</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">อีเมล</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เบอร์โทร</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ที่อยู่</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">บทบาท</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่สมัคร</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let user of users" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <img [src]="user.profileImage || 'assets/images/default-avatar.png'"
                     [alt]="user.name"
                     class="h-10 w-10 rounded-full object-cover">
              </td>
              <td class="px-6 py-4">{{user.name}}</td>
              <td class="px-6 py-4">{{user.email}}</td>
              <td class="px-6 py-4">{{user.phone || '-'}}</td>
              <td class="px-6 py-4">
                <button *ngIf="hasValidAddress(user.address)"
                        (click)="showAddress(user.address)"
                        class="text-blue-600 hover:text-blue-900 text-sm">
                  ดูที่อยู่
                </button>
                <span *ngIf="!hasValidAddress(user.address)">-</span>
              </td>
              <td class="px-6 py-4">
                <select [value]="user.role" 
                        (change)="onRoleChange($event, user._id)"
                        class="rounded border border-gray-300 focus:border-amber-500">
                  <option value="user">ผู้ใช้ทั่วไป</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </td>
              <td class="px-6 py-4">
                <span [ngClass]="{
                  'bg-green-100 text-green-800': user.isVerified,
                  'bg-red-100 text-red-800': !user.isVerified
                }" class="px-2 py-1 text-xs rounded-full">
                  {{user.isVerified ? 'ยืนยันแล้ว' : 'รอยืนยัน'}}
                </span>
              </td>
              <td class="px-6 py-4">{{user.createdAt | date:'short'}}</td>
              <td class="px-6 py-4">
                <div class="flex gap-3">
                  <button (click)="editUser(user)"
                          class="text-blue-600 hover:text-blue-900">
                    <fa-icon [icon]="faEdit"></fa-icon>
                  </button>
                  <button *ngIf="!user.isVerified"
                          (click)="verifyUser(user._id)"
                          class="text-green-600 hover:text-green-900">
                    <fa-icon [icon]="faCheck"></fa-icon>
                  </button>
                  <button (click)="deleteUser(user._id)"
                          class="text-red-600 hover:text-red-900">
                    <fa-icon [icon]="faTrash"></fa-icon>
                  </button>
                  <button (click)="changePassword(user)"
                          class="text-yellow-600 hover:text-yellow-900">
                    <fa-icon [icon]="faKey"></fa-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  stats: UserStats = {
    totalUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0
  };

  faTrash = faTrash;
  faEdit = faEdit;
  faCheck = faCheck;
  faUserShield = faUserShield;
  faKey = faKey;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadStats();
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next: (data: User[]) => {
        this.users = data;
      },
      error: (error: Error) => {
        console.error('Error loading users:', error);
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้', 'error');
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

  onRoleChange(event: Event, userId: string): void {
    const select = event.target as HTMLSelectElement;
    if (select) {
      this.updateUserRole(userId, select.value);
    }
  }

  updateUserRole(userId: string, role: string): void {
    if (!['user', 'admin'].includes(role)) {
      Swal.fire('Error', 'บทบาทไม่ถูกต้อง', 'error');
      return;
    }

    this.adminService.updateUserRole(userId, role).subscribe({
      next: () => {
        this.loadStats();
        Swal.fire('สำเร็จ', 'อัพเดทบทบาทเรียบร้อยแล้ว', 'success');
      },
      error: (error: Error) => {
        console.error('Error updating user role:', error);
        Swal.fire('Error', 'ไม่สามารถอัพเดทบทบาทได้', 'error');
      }
    });
  }

  verifyUser(userId: string): void {
    this.adminService.verifyUser(userId).subscribe({
      next: () => {
        this.loadUsers();
        this.loadStats();
        Swal.fire('สำเร็จ', 'ยืนยันผู้ใช้เรียบร้อยแล้ว', 'success');
      },
      error: (error: Error) => {
        console.error('Error verifying user:', error);
        Swal.fire('Error', 'ไม่สามารถยืนยันผู้ใช้ได้', 'error');
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
          error: (error: Error) => {
            console.error('Error deleting user:', error);
            Swal.fire('Error', 'ไม่สามารถลบผู้ใช้ได้', 'error');
          }
        });
      }
    });
  }

  editUser(user: User): void {
    Swal.fire({
      title: 'แก้ไขข้อมูลผู้ใช้',
      html: `
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">รูปโปรไฟล์</label>
          <img src="${user.profileImage || 'assets/images/default-avatar.png'}" 
               class="w-24 h-24 rounded-full mx-auto mb-2 object-cover">
          <input id="profileImage" type="file" accept="image/*" class="swal2-file w-full">
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">ชื่อ</label>
          <input id="name" class="swal2-input" placeholder="ชื่อ" value="${user.name}">
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">อีเมล</label>
          <input id="email" class="swal2-input" placeholder="อีเมล" value="${user.email}">
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">เบอร์โทร</label>
          <input id="phone" class="swal2-input" placeholder="เบอร์โทร" value="${user.phone || ''}">
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">ที่อยู่</label>
          <textarea id="address" class="swal2-textarea" placeholder="ที่อยู่">${
            typeof user.address === 'object' ? 
              JSON.stringify(user.address, null, 2) : 
              user.address || ''
          }</textarea>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">สถานะการยืนยัน</label>
          <select id="isVerified" class="swal2-select">
            <option value="true" ${user.isVerified ? 'selected' : ''}>ยืนยันแล้ว</option>
            <option value="false" ${!user.isVerified ? 'selected' : ''}>ยังไม่ยืนยัน</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">บทบาท</label>
          <select id="role" class="swal2-select">
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>ผู้ใช้ทั่วไป</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>ผู้ดูแลระบบ</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      preConfirm: async () => {
        try {
          const fileInput = document.getElementById('profileImage') as HTMLInputElement;
          const file = fileInput?.files?.[0];
          let profileImage = user.profileImage;

          if (file) {
            console.log('Attempting to upload file:', file.name, 'for user:', user._id);
            const formData = new FormData();
            formData.append('profileImage', file);
            
            // Log the FormData contents
            for (let [key, value] of formData.entries()) {
              console.log('FormData:', key, value);
            }

            const result = await firstValueFrom(
              this.adminService.uploadUserProfileImage(user._id, file)
            );
            console.log('Upload result:', result);
            profileImage = result.profileImage;
          }

          return {
            name: (document.getElementById('name') as HTMLInputElement).value,
            email: (document.getElementById('email') as HTMLInputElement).value,
            phone: (document.getElementById('phone') as HTMLInputElement).value,
            address: JSON.parse((document.getElementById('address') as HTMLTextAreaElement).value || '{}'),
            profileImage,
            isVerified: (document.getElementById('isVerified') as HTMLSelectElement).value === 'true',
            role: (document.getElementById('role') as HTMLSelectElement).value
          };
        } catch (error: any) {
          console.error('Error in form submission:', error);
          console.error('Full error object:', error);
          console.error('Error response:', error.error);
          Swal.showValidationMessage(
            `เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถดำเนินการได้'}`
          );
          return false;
        }
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
            Swal.fire('Error', 'ไม่สามารถอัพเดทข้อมูลได้', 'error');
          }
        });
      }
    });
  }

  changePassword(user: User): void {
    Swal.fire({
      title: 'เปลี่ยนรหัสผ่าน',
      html: `
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
          <input id="newPassword" type="password" class="swal2-input" placeholder="รหัสผ่านใหม่">
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
          <input id="confirmPassword" type="password" class="swal2-input" placeholder="ยืนยันรหัสผ่านใหม่">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'เปลี่ยนรหัสผ่าน',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
        const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

        if (newPassword.length < 6) {
          Swal.showValidationMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('รหัสผ่านไม่ตรงกัน');
          return false;
        }

        return { newPassword };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.changeUserPassword(user._id, result.value.newPassword).subscribe({
          next: () => {
            Swal.fire('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
          },
          error: (error) => {
            console.error('Error changing password:', error);
            Swal.fire('Error', 'ไม่สามารถเปลี่ยนรหัสผ่านได้', 'error');
          }
        });
      }
    });
  }

  hasValidAddress(address: any): boolean {
    if (!address || typeof address !== 'object') return false;
    
    // ตรวจสอบว่ามีข้อมูลที่อยู่อย่างน้อย 1 field
    return Object.values(address).some(value => 
      value !== null && 
      value !== undefined && 
      value !== ''
    );
  }

  showAddress(address: any): void {
    console.log('Address data:', address);

    let addressText = '';
    try {
      if (typeof address === 'object' && address !== null) {
        if (Object.keys(address).length === 0) {
          addressText = 'ไม่มีข้อมูลที่อยู่';
        } else {
          const parts = [];
          if (address.address) parts.push(`<p>บ้านเลขที่: ${address.address}</p>`);
          if (address.subdistrict) parts.push(`<p>ตำบล/แขวง: ${address.subdistrict}</p>`);
          if (address.district) parts.push(`<p>อำเภอ/เขต: ${address.district}</p>`);
          if (address.province) parts.push(`<p>จังหวัด: ${address.province}</p>`);
          if (address.postalCode) parts.push(`<p>รหัสไปรษณีย์: ${address.postalCode}</p>`);
          addressText = parts.join('');
        }
      } else {
        addressText = 'ไม่มีข้อมูลที่อยู่';
      }

      Swal.fire({
        title: 'ที่อยู่',
        html: addressText || 'ไม่มีข้อมูลที่อยู่',
        confirmButtonText: 'ปิด'
      });
    } catch (error) {
      console.error('Error showing address:', error);
      Swal.fire({
        title: 'ที่อยู่',
        text: 'ไม่สามารถแสดงข้อมูลที่อยู่ได้',
        icon: 'error',
        confirmButtonText: 'ปิด'
      });
    }
  }
} 