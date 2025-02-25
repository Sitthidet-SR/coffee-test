import { Component, OnInit, Input, Output, EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faClose, faSpinner } from '@fortawesome/free-solid-svg-icons'; // นำเข้ารายการ spinner ด้วย
import { gsap } from 'gsap';
import axios, { AxiosError } from 'axios';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() switchToRegisterEvent = new EventEmitter<void>();

  loginForm!: FormGroup;
  submitted = false;
  userProfile: string | null = null;
  
  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faClose = faClose;
  faSpinner = faSpinner; // icon loading

  // Password visibility toggle
  showPassword = false;
  
  // Loading state
  loading = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      setTimeout(() => {
        this.animateFormElements();
      }, 100);
    }
  }

  // Helper getter for form controls
  get f() {
    return this.loginForm.controls;
  }

  // Close modal function
  closeModal(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    gsap.to('.modal-container', { opacity: 0, scale: 0.8, duration: 0.3, onComplete: () => {
      this.isOpen = false;
      this.closeModalEvent.emit();
    }});
  }

  // Stop event propagation
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Switch to register modal
  switchToRegister(): void {
    this.switchToRegisterEvent.emit();
  }

  // Submit form
  async onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;
    
    // เริ่มการแสดงสถานะการโหลด
    this.loading = true;

    try {
      const response = await axios.post('http://localhost:5000/api/login', { email, password });
      
      Swal.fire({
        icon: 'success',
        title: 'เข้าสู่ระบบสำเร็จ',
        text: 'ยินดีต้อนรับ!'
      });
      
      localStorage.setItem('token', response.data.token);
      this.userProfile = response.data.user.profileImage || 'default-profile.png';
      this.closeModal();
    } catch (error) {
      const err = error as AxiosError<{message?: string}>;
      Swal.fire({
        icon: 'error',
        title: 'เข้าสู่ระบบล้มเหลว',
        text: err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
      });
    } finally {
      // สิ้นสุดสถานะการโหลดไม่ว่าจะสำเร็จหรือไม่ก็ตาม
      this.loading = false;
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.userProfile = null;
    Swal.fire({
      icon: 'info',
      title: 'ออกจากระบบ',
      text: 'คุณได้ออกจากระบบเรียบร้อยแล้ว'
    });
  }

  // Animation function using GSAP
  animateFormElements(): void {
    gsap.fromTo('.modal-container', 
      { opacity: 0, scale: 0.8 }, 
      { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
    );

    gsap.fromTo('.form-group', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 0.2 }
    );
  }
}
