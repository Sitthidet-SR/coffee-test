import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address: {
    address?: string;
    subdistrict?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
  profileImage?: string;
  role: string;
  isVerified: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    NavbarComponent,
    FooterComponent
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="min-h-screen bg-[#fff8ee] pt-20">
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-2xl mx-auto">
          <h1 class="text-3xl font-bold mb-8 text-gray-800">
            {{ 'PROFILE.TITLE' | translate }}
          </h1>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <form (ngSubmit)="updateProfile()" #profileForm="ngForm">
              <!-- Profile Image -->
              <div class="mb-6 text-center">
                <div class="relative w-32 h-32 mx-auto mb-4 group">
                  <img [src]="user.profileImage || 'assets/images/default-avatar.png'"
                    alt="Profile"
                    class="w-full h-full rounded-full object-cover border-4 border-amber-500">
                  <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full">
                    <label class="cursor-pointer p-2 text-white hover:text-amber-500">
                      <input type="file" 
                        (change)="onFileSelected($event)" 
                        accept="image/*" 
                        class="hidden">
                      {{ 'PROFILE.CHANGE_PHOTO' | translate }}
                    </label>
                  </div>
                </div>
                <button type="button" 
                  *ngIf="user.profileImage"
                  (click)="removeProfileImage()"
                  class="text-red-600 hover:text-red-700 text-sm">
                  {{ 'PROFILE.REMOVE_PHOTO' | translate }}
                </button>
              </div>

              <!-- Name -->
              <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2">
                  {{ 'PROFILE.NAME' | translate }}
                </label>
                <input type="text"
                  [(ngModel)]="user.name"
                  name="name"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500">
              </div>

              <!-- Email -->
              <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2">
                  {{ 'PROFILE.EMAIL' | translate }}
                </label>
                <input type="email"
                  [(ngModel)]="user.email"
                  name="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500">
              </div>

              <!-- Phone -->
              <div class="mb-4">
                <label class="block text-gray-700 text-sm font-bold mb-2">
                  {{ 'PROFILE.PHONE' | translate }}
                </label>
                <input type="tel"
                  [(ngModel)]="user.phone"
                  name="phone"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500">
              </div>

              <!-- Address -->
              <div class="mb-6">
                <label class="block text-gray-700 text-sm font-bold mb-2">
                  {{ 'PROFILE.ADDRESS_LABEL' | translate }}
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-gray-700 text-sm mb-1">
                      {{ 'PROFILE.ADDRESS' | translate }}
                    </label>
                    <input type="text"
                      [(ngModel)]="user.address.address"
                      name="address"
                      placeholder="{{ 'PROFILE.ADDRESS_PLACEHOLDER' | translate }}"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500">
                  </div>
                  <div>
                    <label class="block text-gray-700 text-sm mb-1">
                      {{ 'PROFILE.SUBDISTRICT' | translate }}
                    </label>
                    <input type="text"
                      [(ngModel)]="user.address.subdistrict"
                      name="subdistrict"
                      placeholder="{{ 'PROFILE.SUBDISTRICT_PLACEHOLDER' | translate }}"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500">
                  </div>
                  <div>
                    <label class="block text-gray-700 text-sm mb-1">
                      {{ 'PROFILE.DISTRICT' | translate }}
                    </label>
                    <input type="text"
                      [(ngModel)]="user.address.district"
                      name="district"
                      placeholder="{{ 'PROFILE.DISTRICT_PLACEHOLDER' | translate }}"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500">
                  </div>
                  <div>
                    <label class="block text-gray-700 text-sm mb-1">
                      {{ 'PROFILE.PROVINCE' | translate }}
                    </label>
                    <input type="text"
                      [(ngModel)]="user.address.province"
                      name="province"
                      placeholder="{{ 'PROFILE.PROVINCE_PLACEHOLDER' | translate }}"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500">
                  </div>
                  <div>
                    <label class="block text-gray-700 text-sm mb-1">
                      {{ 'PROFILE.POSTAL_CODE' | translate }}
                    </label>
                    <input type="text"
                      [(ngModel)]="user.address.postalCode"
                      name="postalCode"
                      placeholder="{{ 'PROFILE.POSTAL_CODE_PLACEHOLDER' | translate }}"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amber-500">
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div class="flex flex-col space-y-4">
                <button type="submit"
                  [disabled]="!profileForm.form.valid || loading"
                  class="w-full bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                  <span *ngIf="loading" class="inline-flex items-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ 'COMMON.SAVING' | translate }}
                  </span>
                  <span *ngIf="!loading">
                    {{ 'PROFILE.SAVE' | translate }}
                  </span>
                </button>

                <button type="button"
                  (click)="changePassword()"
                  class="w-full border border-amber-500 text-amber-500 py-2 px-4 rounded-lg hover:bg-amber-50 transition-colors">
                  {{ 'PROFILE.CHANGE_PASSWORD' | translate }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class ProfileComponent implements OnInit {
  user: User = {
    _id: '',
    name: '',
    email: '',
    role: '',
    isVerified: false,
    address: {}
  };
  loading = false;

  constructor(
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = {
          ...user,
          address: user.address || {}
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้'
        });
      }
    });
  }

  onFileSelected(event: Event) {
    this.translate.get([
      'COMMON.ERROR',
      'PROFILE.FILE_SIZE_ERROR',
      'PROFILE.FILE_TYPE_ERROR',
      'COMMON.SUCCESS',
      'PROFILE.UPLOAD_SUCCESS',
      'PROFILE.UPLOAD_ERROR'
    ]).subscribe(trans => {
      const input = event.target as HTMLInputElement;
      const file = input?.files?.[0];
      
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          Swal.fire({
            icon: 'error',
            title: trans['COMMON.ERROR'],
            text: trans['PROFILE.FILE_SIZE_ERROR']
          });
          return;
        }

        if (!file.type.match(/^image\/(jpeg|png|gif)$/)) {
          Swal.fire({
            icon: 'error',
            title: trans['COMMON.ERROR'],
            text: trans['PROFILE.FILE_TYPE_ERROR']
          });
          return;
        }

        const formData = new FormData();
        formData.append('profileImage', file);

        this.loading = true;
        this.authService.uploadProfileImage(formData).subscribe({
          next: (response) => {
            this.user.profileImage = response.profileImage;
            this.loading = false;
            Swal.fire({
              icon: 'success',
              title: trans['COMMON.SUCCESS'],
              text: trans['PROFILE.UPLOAD_SUCCESS']
            });
          },
          error: (error) => {
            console.error('Error uploading profile image:', error);
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: trans['COMMON.ERROR'],
              text: error.error?.message || trans['PROFILE.UPLOAD_ERROR']
            });
          }
        });
      }
    });
  }

  removeProfileImage() {
    this.translate.get([
      'PROFILE.REMOVE_PHOTO_CONFIRM_TITLE',
      'PROFILE.REMOVE_PHOTO_CONFIRM_TEXT',
      'PROFILE.REMOVE_PHOTO_CONFIRM_BUTTON',
      'COMMON.CANCEL',
      'COMMON.SUCCESS',
      'PROFILE.REMOVE_PHOTO_SUCCESS',
      'COMMON.ERROR',
      'PROFILE.REMOVE_PHOTO_ERROR'
    ]).subscribe(trans => {
      Swal.fire({
        title: trans['PROFILE.REMOVE_PHOTO_CONFIRM_TITLE'],
        text: trans['PROFILE.REMOVE_PHOTO_CONFIRM_TEXT'],
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: trans['PROFILE.REMOVE_PHOTO_CONFIRM_BUTTON'],
        cancelButtonText: trans['COMMON.CANCEL']
      }).then((result) => {
        if (result.isConfirmed) {
          this.loading = true;
          this.authService.removeProfileImage().subscribe({
            next: (user) => {
              this.user = {
                ...user,
                address: user.address || {}
              };
              this.loading = false;
              Swal.fire({
                icon: 'success',
                title: trans['COMMON.SUCCESS'],
                text: trans['PROFILE.REMOVE_PHOTO_SUCCESS']
              });
            },
            error: (error) => {
              console.error('Error removing profile image:', error);
              this.loading = false;
              Swal.fire({
                icon: 'error',
                title: trans['COMMON.ERROR'],
                text: error.error?.message || trans['PROFILE.REMOVE_PHOTO_ERROR']
              });
            }
          });
        }
      });
    });
  }

  updateProfile() {
    this.translate.get([
      'COMMON.ERROR',
      'PROFILE.REQUIRED_FIELDS_ERROR',
      'PROFILE.INVALID_EMAIL_ERROR',
      'PROFILE.INVALID_PHONE_ERROR',
      'COMMON.SUCCESS',
      'PROFILE.UPDATE_SUCCESS',
      'PROFILE.UPDATE_ERROR',
      'PROFILE.EMAIL_EXISTS_ERROR'
    ]).subscribe(trans => {
      if (!this.user.name || !this.user.email) {
        Swal.fire({
          icon: 'error',
          title: trans['COMMON.ERROR'],
          text: trans['PROFILE.REQUIRED_FIELDS_ERROR']
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.user.email)) {
        Swal.fire({
          icon: 'error',
          title: trans['COMMON.ERROR'],
          text: trans['PROFILE.INVALID_EMAIL_ERROR']
        });
        return;
      }

      if (this.user.phone) {
        const phoneRegex = /^[0-9]{9,10}$/;
        if (!phoneRegex.test(this.user.phone)) {
          Swal.fire({
            icon: 'error',
            title: trans['COMMON.ERROR'],
            text: trans['PROFILE.INVALID_PHONE_ERROR']
          });
          return;
        }
      }

      const payload: Partial<User> = {
        name: this.user.name.trim(),
        email: this.user.email.trim(),
        phone: this.user.phone?.trim() || '',
        address: {}
      };

      if (this.user.address) {
        const address: Record<string, string> = {};
        if (this.user.address['address']?.trim()) address['address'] = this.user.address['address'].trim();
        if (this.user.address['subdistrict']?.trim()) address['subdistrict'] = this.user.address['subdistrict'].trim();
        if (this.user.address['district']?.trim()) address['district'] = this.user.address['district'].trim();
        if (this.user.address['province']?.trim()) address['province'] = this.user.address['province'].trim();
        if (this.user.address['postalCode']?.trim()) address['postalCode'] = this.user.address['postalCode'].trim();

        if (Object.keys(address).length > 0) {
          payload.address = address;
        }
      }

      this.loading = true;
      this.authService.updateProfile(payload).subscribe({
        next: (user) => {
          this.user = {
            ...user,
            address: user.address || {}
          };
          this.loading = false;
          Swal.fire({
            icon: 'success',
            title: trans['COMMON.SUCCESS'],
            text: trans['PROFILE.UPDATE_SUCCESS']
          });
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.loading = false;
          let errorMessage = trans['PROFILE.UPDATE_ERROR'];
          
          if (error.error?.message) {
            switch (error.error.message) {
              case 'Email already exists':
                errorMessage = trans['PROFILE.EMAIL_EXISTS_ERROR'];
                break;
              case 'Invalid email format':
                errorMessage = trans['PROFILE.INVALID_EMAIL_ERROR'];
                break;
              case 'Invalid phone format':
                errorMessage = trans['PROFILE.INVALID_PHONE_ERROR'];
                break;
              default:
                errorMessage = error.error.message;
            }
          }

          Swal.fire({
            icon: 'error',
            title: trans['COMMON.ERROR'],
            text: errorMessage
          });
        }
      });
    });
  }

  changePassword() {
    const translations = {
      title: '',
      currentPassword: '',
      currentPasswordPlaceholder: '',
      newPassword: '',
      newPasswordPlaceholder: '',
      confirmPassword: '',
      confirmPasswordPlaceholder: '',
      confirm: '',
      cancel: '',
      fillAllFields: '',
      passwordLengthError: '',
      passwordMismatch: '',
      success: '',
      successMessage: '',
      error: '',
      errorMessage: ''
    };

    // Get all translations first
    this.translate.get([
      'PROFILE.CHANGE_PASSWORD_TITLE',
      'PROFILE.CURRENT_PASSWORD',
      'PROFILE.CURRENT_PASSWORD_PLACEHOLDER',
      'PROFILE.NEW_PASSWORD',
      'PROFILE.NEW_PASSWORD_PLACEHOLDER',
      'PROFILE.CONFIRM_PASSWORD',
      'PROFILE.CONFIRM_PASSWORD_PLACEHOLDER',
      'PROFILE.CHANGE_PASSWORD_CONFIRM',
      'COMMON.CANCEL',
      'PROFILE.FILL_ALL_FIELDS',
      'PROFILE.PASSWORD_LENGTH_ERROR',
      'PROFILE.PASSWORD_MISMATCH',
      'COMMON.SUCCESS',
      'PROFILE.PASSWORD_CHANGE_SUCCESS',
      'COMMON.ERROR',
      'PROFILE.PASSWORD_CHANGE_ERROR'
    ]).subscribe(trans => {
      translations.title = trans['PROFILE.CHANGE_PASSWORD_TITLE'];
      translations.currentPassword = trans['PROFILE.CURRENT_PASSWORD'];
      translations.currentPasswordPlaceholder = trans['PROFILE.CURRENT_PASSWORD_PLACEHOLDER'];
      translations.newPassword = trans['PROFILE.NEW_PASSWORD'];
      translations.newPasswordPlaceholder = trans['PROFILE.NEW_PASSWORD_PLACEHOLDER'];
      translations.confirmPassword = trans['PROFILE.CONFIRM_PASSWORD'];
      translations.confirmPasswordPlaceholder = trans['PROFILE.CONFIRM_PASSWORD_PLACEHOLDER'];
      translations.confirm = trans['PROFILE.CHANGE_PASSWORD_CONFIRM'];
      translations.cancel = trans['COMMON.CANCEL'];
      translations.fillAllFields = trans['PROFILE.FILL_ALL_FIELDS'];
      translations.passwordLengthError = trans['PROFILE.PASSWORD_LENGTH_ERROR'];
      translations.passwordMismatch = trans['PROFILE.PASSWORD_MISMATCH'];
      translations.success = trans['COMMON.SUCCESS'];
      translations.successMessage = trans['PROFILE.PASSWORD_CHANGE_SUCCESS'];
      translations.error = trans['COMMON.ERROR'];
      translations.errorMessage = trans['PROFILE.PASSWORD_CHANGE_ERROR'];

      Swal.fire({
        title: translations.title,
        html: `
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">${translations.currentPassword}</label>
            <input id="currentPassword" type="password" class="swal2-input" placeholder="${translations.currentPasswordPlaceholder}">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">${translations.newPassword}</label>
            <input id="newPassword" type="password" class="swal2-input" placeholder="${translations.newPasswordPlaceholder}">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700">${translations.confirmPassword}</label>
            <input id="confirmPassword" type="password" class="swal2-input" placeholder="${translations.confirmPasswordPlaceholder}">
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: translations.confirm,
        cancelButtonText: translations.cancel,
        preConfirm: () => {
          const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
          const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
          const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

          if (!currentPassword || !newPassword || !confirmPassword) {
            Swal.showValidationMessage(translations.fillAllFields);
            return false;
          }

          if (newPassword.length < 6) {
            Swal.showValidationMessage(translations.passwordLengthError);
            return false;
          }

          if (newPassword !== confirmPassword) {
            Swal.showValidationMessage(translations.passwordMismatch);
            return false;
          }

          return { currentPassword, newPassword };
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.loading = true;
          this.authService.changePassword(result.value).subscribe({
            next: () => {
              this.loading = false;
              Swal.fire({
                icon: 'success',
                title: translations.success,
                text: translations.successMessage
              });
            },
            error: (error) => {
              console.error('Error changing password:', error);
              this.loading = false;
              Swal.fire({
                icon: 'error',
                title: translations.error,
                text: error.error?.message || translations.errorMessage
              });
            }
          });
        }
      });
    });
  }
} 