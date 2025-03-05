import { Component, OnInit, Input, Output, EventEmitter, NO_ERRORS_SCHEMA, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faClose, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() switchToRegisterEvent = new EventEmitter<void>();

  loginForm!: FormGroup;
  submitted = false;
  errorMessage: string = '';
  loginAttempts = 0;
  isLocked = false;
  lockoutEndTime: number | null = null;
  remainingTime: number = 0;
  countdownInterval: any;

  // Font Awesome icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faClose = faClose;
  faSpinner = faSpinner;

  // UI states
  showPassword = false;
  loading = false;
  forgotPasswordMode = false;
  resetEmailSent = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // สร้างฟอร์มใหม่
    this.initializeForm();

    // เพิ่มอนิเมชั่นเมื่อ modal เปิด
    if (this.isOpen) {
      this.setupModalAnimations();
    }

    // ตรวจสอบสถานะการล็อค
    const lockoutEnd = localStorage.getItem('loginLockoutEnd');
    if (lockoutEnd) {
      const endTime = parseInt(lockoutEnd);
      if (endTime > Date.now()) {
        this.isLocked = true;
        this.lockoutEndTime = endTime;
        this.startCountdown();
      } else {
        localStorage.removeItem('loginLockoutEnd');
        localStorage.removeItem('loginAttempts');
      }
    }

    this.loginAttempts = parseInt(localStorage.getItem('loginAttempts') || '0');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      setTimeout(() => {
        this.setupModalAnimations();
      }, 0);
    }
  }

  setupModalAnimations(): void {
    // รีเซ็ตสถานะการแสดงผลก่อน
    gsap.set('.login-modal-container', { scale: 0.7, opacity: 0 });
    gsap.set('.logo-text-jack', { opacity: 0 });
    gsap.set('.logo-text-coffee', { opacity: 0 });
    gsap.set('.form-group', { opacity: 0 });

    // เริ่มอนิเมชั่น
    gsap.to('.login-modal-container', {
      scale: 1,
      opacity: 1,
      duration: 0.2,
      ease: 'power2.out'
    });

    gsap.to('.logo-text-jack', {
      opacity: 1,
      duration: 0.2,
      delay: 0.1
    });

    gsap.to('.logo-text-coffee', {
      opacity: 1,
      duration: 0.2,
      delay: 0.15
    });

    gsap.to('.form-group', {
      opacity: 1,
      duration: 0.2,
      stagger: 0.05
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  async onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.isLocked) {
      const minutes = Math.floor(this.remainingTime / 60);
      const seconds = this.remainingTime % 60;
      await Swal.fire({
        icon: 'error',
        title: 'บัญชีถูกระงับชั่วคราว',
        html: `คุณได้พยายามเข้าสู่ระบบหลายครั้งเกินไป<br>กรุณารอ ${minutes} นาที ${seconds} วินาที แล้วลองใหม่อีกครั้ง`,
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    if (this.loginForm.invalid) {
      const errors: string[] = [];
      
      if (this.f['email'].errors) {
        if (this.f['email'].errors['required']) {
          errors.push('กรุณากรอกอีเมล');
        }
        if (this.f['email'].errors['email']) {
          errors.push('รูปแบบอีเมลไม่ถูกต้อง');
        }
      }
      
      if (!this.forgotPasswordMode && this.f['password'].errors) {
        if (this.f['password'].errors['required']) {
          errors.push('กรุณากรอกรหัสผ่าน');
        }
        if (this.f['password'].errors['minlength']) {
          errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        }
      }

      if (errors.length > 0) {
        await Swal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาด',
          html: errors.join('<br>'),
          confirmButtonText: 'ตกลง'
        });
        return;
      }
    }

    try {
      this.loading = true;
      this.errorMessage = '';

      if (this.forgotPasswordMode) {
        // จัดการกรณีลืมรหัสผ่าน
        const email = this.f['email'].value.trim().toLowerCase();
        
        try {
          await this.authService.requestPasswordReset(email).toPromise();
          this.resetEmailSent = true;
          
          await Swal.fire({
            icon: 'success',
            title: 'ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว',
            text: 'กรุณาตรวจสอบอีเมลของคุณเพื่อดำเนินการต่อ',
            confirmButtonText: 'ตกลง'
          });
          
          // รีเซ็ตฟอร์มและกลับไปหน้าเข้าสู่ระบบ
          this.forgotPasswordMode = false;
          this.submitted = false;
          this.errorMessage = '';
          this.resetEmailSent = false;

          // สร้างฟอร์มใหม่และรอให้ Angular ทำการ render
          setTimeout(() => {
            this.loginForm = this.formBuilder.group({
              email: ['', [Validators.required, Validators.email]],
              password: ['', [Validators.required, Validators.minLength(6)]]
            });
            // เรียก detectChanges หรือ trigger การ render ใหม่
            this.setupModalAnimations();
          }, 0);
        } catch (error: any) {
          console.error('Reset password error:', error);
          let errorMessage = 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้';
          
          if (error instanceof HttpErrorResponse) {
            if (error.status === 404) {
              errorMessage = 'ไม่พบบัญชีผู้ใช้ที่ใช้อีเมลนี้ในระบบ';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }
          }
          
          await Swal.fire({
            icon: 'error',
            title: 'ข้อผิดพลาด',
            text: errorMessage,
            confirmButtonText: 'ตกลง'
          });
        }
        return;
      }

      // กรณีเข้าสู่ระบบปกติ
      const credentials = {
        email: this.f['email'].value.trim().toLowerCase(),
        password: this.f['password'].value
      };

      const response = await this.authService.login(credentials).toPromise();

      if (response?.token) {
        // รีเซ็ตจำนวนครั้งที่พยายามเข้าสู่ระบบ
        this.loginAttempts = 0;
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginLockoutEnd');

        this.closeModal();

        await Swal.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: 'ยินดีต้อนรับกลับมา ' + response.user.name,
          timer: 1500,
          showConfirmButton: false
        });

        this.loginForm.reset();
        this.submitted = false;
        
        window.location.reload();
      } else {
        this.handleLoginAttempt();
        throw new Error('ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
        } else if (error.status === 404) {
          errorMessage = 'ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมลของคุณ';
          this.handleLoginAttempt();
        } else if (error.status === 401 || error.status === 400) {
          errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
          this.handleLoginAttempt();
        } else if (error.error?.message) {
          errorMessage = error.error.message;
          if (error.error.message.includes('Too many login attempts')) {
            this.isLocked = true;
            const lockoutDuration = 5 * 60 * 1000; // 5 นาที
            this.lockoutEndTime = Date.now() + lockoutDuration;
            localStorage.setItem('loginLockoutEnd', this.lockoutEndTime.toString());
            this.startCountdown();
            
            const minutes = Math.floor(this.remainingTime / 60);
            const seconds = this.remainingTime % 60;
            errorMessage = `คุณได้พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ ${minutes} นาที ${seconds} วินาที แล้วลองใหม่อีกครั้ง`;
          } else {
            this.handleLoginAttempt();
          }
        }
      }

      await Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: errorMessage,
        confirmButtonText: 'ตกลง'
      });
    } finally {
      this.loading = false;
    }
  }

  handleLoginAttempt() {
    this.loginAttempts++;
    localStorage.setItem('loginAttempts', this.loginAttempts.toString());
    
    if (this.loginAttempts >= 5) {
      this.isLocked = true;
      const lockoutDuration = 5 * 60 * 1000; // 5 นาที
      this.lockoutEndTime = Date.now() + lockoutDuration;
      localStorage.setItem('loginLockoutEnd', this.lockoutEndTime.toString());
      this.startCountdown();
    }
  }

  startCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    if (this.lockoutEndTime) {
      this.updateRemainingTime();
      this.countdownInterval = setInterval(() => {
        this.updateRemainingTime();
        
        if (this.remainingTime <= 0) {
          this.isLocked = false;
          this.loginAttempts = 0;
          localStorage.removeItem('loginLockoutEnd');
          localStorage.removeItem('loginAttempts');
          clearInterval(this.countdownInterval);
        }
      }, 1000);
    }
  }

  updateRemainingTime() {
    if (this.lockoutEndTime) {
      this.remainingTime = Math.max(0, Math.floor((this.lockoutEndTime - Date.now()) / 1000));
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  closeModal(): void {
    // รีเซ็ตฟอร์มและสถานะทั้งหมดเมื่อปิด modal
    this.forgotPasswordMode = false;
    this.submitted = false;
    this.errorMessage = '';
    this.resetEmailSent = false;
    
    // สร้างฟอร์มใหม่พร้อม validators
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    
    this.closeModalEvent.emit();
  }

  switchToRegister(): void {
    this.switchToRegisterEvent.emit();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  // เพิ่มเมธอด toggleForgotPassword
  toggleForgotPassword(): void {
    this.forgotPasswordMode = !this.forgotPasswordMode;
    this.submitted = false;
    this.errorMessage = '';
    
    // รีเซ็ตฟอร์มและตั้งค่า validators ใหม่
    if (this.forgotPasswordMode) {
      this.loginForm = this.formBuilder.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['']
      });
    } else {
      this.loginForm = this.formBuilder.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeModal();

    Swal.fire({
      icon: 'success',
      title: 'ออกจากระบบสำเร็จ',
      text: 'ขอบคุณที่ใช้บริการ',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      this.router.navigate(['/']);
    });
  }

  // เพิ่มเมธอดใหม่สำหรับการสร้างฟอร์ม
  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
}