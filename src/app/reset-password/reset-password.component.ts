import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ 'RESET_PASSWORD.TITLE' | translate }}
        </h2>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                {{ 'RESET_PASSWORD.NEW_PASSWORD' | translate }}
              </label>
              <div class="mt-1">
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
              <div *ngIf="resetForm.get('password')?.touched && resetForm.get('password')?.errors?.['required']" class="text-red-500 text-sm mt-1">
                {{ 'RESET_PASSWORD.PASSWORD_REQUIRED' | translate }}
              </div>
              <div *ngIf="resetForm.get('password')?.touched && resetForm.get('password')?.errors?.['minlength']" class="text-red-500 text-sm mt-1">
                {{ 'RESET_PASSWORD.PASSWORD_MIN_LENGTH' | translate }}
              </div>
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                {{ 'RESET_PASSWORD.CONFIRM_PASSWORD' | translate }}
              </label>
              <div class="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  formControlName="confirmPassword"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                />
              </div>
              <div *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.get('confirmPassword')?.errors?.['required']" class="text-red-500 text-sm mt-1">
                {{ 'RESET_PASSWORD.CONFIRM_PASSWORD_REQUIRED' | translate }}
              </div>
              <div *ngIf="resetForm.get('confirmPassword')?.touched && resetForm.errors?.['passwordMismatch']" class="text-red-500 text-sm mt-1">
                {{ 'RESET_PASSWORD.PASSWORD_MISMATCH' | translate }}
              </div>
            </div>

            <div>
              <button
                type="submit"
                [disabled]="resetForm.invalid || loading"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
              >
                <span *ngIf="!loading">{{ 'RESET_PASSWORD.SUBMIT' | translate }}</span>
                <span *ngIf="loading" class="inline-flex items-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ 'COMMON.LOADING' | translate }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  loading = false;
  token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.router.navigate(['/']);
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: 'ไม่พบ Token สำหรับรีเซ็ตรหัสผ่าน',
        confirmButtonText: 'ตกลง'
      });
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.resetForm.invalid || !this.token) {
      return;
    }

    this.loading = true;
    const { password } = this.resetForm.value;

    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว',
          confirmButtonText: 'เข้าสู่ระบบ'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาด',
          text: error.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน',
          confirmButtonText: 'ตกลง'
        });
      }
    });
  }
} 