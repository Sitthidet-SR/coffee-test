import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <!-- Logo และ Header -->
        <div class="text-center">
          <img class="mx-auto h-24 w-auto transform hover:scale-105 transition-transform duration-300" 
               src="assets/images/logo.png" 
               alt="Jack Coffee">
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ยืนยันอีเมล
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            เพื่อเริ่มต้นใช้งาน Jack Coffee
          </p>
        </div>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-amber-100">
          <div class="text-center">
            <!-- Loading State -->
            <div *ngIf="loading" class="space-y-4">
              <div class="flex justify-center">
                <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
              </div>
              <p class="text-gray-500 text-lg">กำลังตรวจสอบการยืนยันอีเมล...</p>
            </div>

            <!-- Success State -->
            <div *ngIf="verified" class="space-y-6">
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 transform hover:scale-105 transition-transform duration-300">
                <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <h3 class="text-xl leading-6 font-bold text-gray-900">ยินดีด้วย! ยืนยันอีเมลสำเร็จ</h3>
                <p class="mt-2 text-sm text-gray-500">
                  ขอบคุณที่ยืนยันอีเมลของคุณ คุณสามารถเข้าสู่ระบบและใช้งาน Jack Coffee ได้แล้ว
                </p>
              </div>
              <div class="mt-6">
                <button (click)="goToLogin()" 
                        class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transform hover:scale-105 transition-all duration-300">
                  เข้าสู่ระบบ
                </button>
              </div>
            </div>

            <!-- Error State -->
            <div *ngIf="error" class="space-y-6">
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <div>
                <h3 class="text-xl leading-6 font-bold text-gray-900">ไม่สามารถยืนยันอีเมลได้</h3>
                <p class="mt-2 text-sm text-gray-500">
                  {{ errorMessage }}
                </p>
              </div>
              
              <!-- Resend Form -->
              <div class="mt-6 space-y-6">
                <div class="rounded-lg bg-amber-50 p-6 border border-amber-200">
                  <h4 class="text-sm font-medium text-amber-800 mb-4">
                    ขอลิงก์ยืนยันอีเมลใหม่
                  </h4>
                  <div class="space-y-4">
                    <div>
                      <label for="email" class="block text-sm font-medium text-gray-700 text-left">
                        อีเมลของคุณ
                      </label>
                      <div class="mt-1">
                        <input type="email" 
                               id="email"
                               [(ngModel)]="email" 
                               [class.border-red-300]="showEmailError"
                               class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                               placeholder="example@email.com">
                        <p *ngIf="showEmailError" class="mt-1 text-sm text-red-600 text-left">
                          กรุณากรอกอีเมลให้ถูกต้อง
                        </p>
                      </div>
                    </div>
                    <button (click)="resendVerification()" 
                            [disabled]="isResending"
                            class="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300">
                      <span *ngIf="isResending" class="mr-2">
                        <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      {{ isResending ? 'กำลังส่งลิงก์ยืนยัน...' : 'ส่งลิงก์ยืนยันใหม่' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  verified = false;
  error = false;
  errorMessage = '';
  email = '';
  isResending = false;
  showEmailError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.showError('กรุณาคลิกลิงก์ยืนยันอีเมลที่ได้รับจากอีเมลของคุณ');
      return;
    }

    this.verifyEmail(token);
  }

  verifyEmail(token: string) {
    this.http.get(`${environment.apiUrl}/api/users/verify-email?token=${token}`)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            this.verified = true;
            
            Swal.fire({
              icon: 'success',
              title: 'ยินดีด้วย!',
              text: response.message || 'คุณได้ยืนยันอีเมลเรียบร้อยแล้ว สามารถเข้าสู่ระบบได้ทันที',
              confirmButtonText: 'เข้าสู่ระบบ',
              confirmButtonColor: '#d97706',
              showClass: {
                popup: 'animate__animated animate__fadeInDown'
              },
              hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
              }
            }).then((result) => {
              if (result.isConfirmed) {
                this.goToLogin();
              }
            });
          } else {
            this.showError(response.message || 'ไม่สามารถยืนยันอีเมลได้');
          }
        },
        error: (err) => {
          let message = 'ไม่สามารถยืนยันอีเมลได้';
          if (err.error?.expired) {
            message = 'ลิงก์ยืนยันอีเมลหมดอายุ กรุณาขอลิงก์ยืนยันใหม่';
          } else if (err.error?.invalid) {
            message = 'ลิงก์ยืนยันอีเมลไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้ง';
          } else if (err.error?.message) {
            message = err.error.message;
          }
          this.showError(message);
        }
      });
  }

  showError(message: string) {
    this.loading = false;
    this.error = true;
    this.errorMessage = message;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  resendVerification() {
    this.showEmailError = false;

    if (!this.email || !this.validateEmail(this.email)) {
      this.showEmailError = true;
      return;
    }

    this.isResending = true;

    this.http.post(`${environment.apiUrl}/api/users/resend-verification`, { email: this.email })
      .subscribe({
        next: (response: any) => {
          this.isResending = false;
          this.email = ''; // เคลียร์อีเมลหลังจากส่งสำเร็จ
          
          Swal.fire({
            icon: 'success',
            title: 'ส่งลิงก์ยืนยันใหม่แล้ว',
            text: 'กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันการสมัครสมาชิก',
            confirmButtonColor: '#d97706',
            showClass: {
              popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp'
            }
          });
        },
        error: (err) => {
          this.isResending = false;
          let errorMessage = 'เกิดข้อผิดพลาดในการส่งลิงก์ยืนยัน กรุณาลองใหม่อีกครั้ง';
          
          if (err.error?.message === 'อีเมลนี้ได้รับการยืนยันแล้ว') {
            errorMessage = 'อีเมลนี้ได้รับการยืนยันแล้ว คุณสามารถเข้าสู่ระบบได้ทันที';
          } else if (err.error?.message === 'ไม่พบอีเมลนี้ในระบบ') {
            errorMessage = 'ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลของคุณอีกครั้ง';
          }

          Swal.fire({
            icon: 'error',
            title: 'ไม่สามารถส่งลิงก์ยืนยันได้',
            text: errorMessage,
            confirmButtonColor: '#d97706',
            showClass: {
              popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp'
            }
          });
        }
      });
  }
}
