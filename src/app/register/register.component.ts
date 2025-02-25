import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faClose, faUser } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';
import axios from 'axios';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() switchToLoginEvent = new EventEmitter<void>();

  registerForm!: FormGroup;
  submitted = false;
  loading = false;

  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faClose = faClose;
  faUser = faUser;

  // Password visibility toggles
  showPassword = false;
  showConfirmPassword = false;

  // Image preview
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      profileImage: [null]
    }, {
      validators: this.matchPassword('password', 'confirmPassword')
    });
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      setTimeout(() => {
        this.animateFormElements();
      }, 100);
    }
  }

  // Custom validator for password matching
  matchPassword(controlName: string, matchingControlName: string): ValidatorFn {
    return (controls: AbstractControl) => {
      const control = controls.get(controlName);
      const matchingControl = controls.get(matchingControlName);

      if (!control || !matchingControl) return null;

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ matching: true });
        return { matching: true };
      } else {
        matchingControl.setErrors(null);
        return null;
      }
    };
  }

  get f() {
    return this.registerForm.controls;
  }

  closeModal(event?: Event): void {
    if (event) event.preventDefault();
    this.closeModalEvent.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.selectedFile = inputElement.files[0];

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  switchToLogin(): void {
    this.switchToLoginEvent.emit();
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.registerForm.invalid) return;

    if (this.f['password'].value !== this.f['confirmPassword'].value) {
      Swal.fire('ผิดพลาด!', 'รหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    this.loading = true;

    const formData = new FormData();
    formData.append('username', this.f['username'].value);
    formData.append('firstName', this.f['firstName'].value);
    formData.append('lastName', this.f['lastName'].value);
    formData.append('email', this.f['email'].value);
    formData.append('phone', this.f['phone'].value);
    formData.append('password', this.f['password'].value);
    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }

    try {
      const response = await axios.post('http://localhost:5000/api/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Swal.fire({
        title: 'สำเร็จ!',
        text: 'สมัครสมาชิกเรียบร้อย',
        icon: 'success',
        showConfirmButton: false,
        timer: 2000
      });

      this.registerForm.reset();
      this.submitted = false;
      this.imagePreview = null;
      this.selectedFile = null;
      this.closeModal();
    } catch (error: any) {
      Swal.fire('ผิดพลาด!', error.response?.data?.error || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      this.loading = false;
    }
  }

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
