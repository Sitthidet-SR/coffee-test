import { Component, OnInit, Input, Output, EventEmitter, OnChanges, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faEye, 
  faEyeSlash, 
  faClose, 
  faUser, 
  faSpinner,
  faPlus,
  faMinus,
  faUndo,
  faTrash,
  faUpload
} from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FontAwesomeModule
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() switchToLoginEvent = new EventEmitter<void>();

  registerForm!: FormGroup;
  submitted = false;
  loading = false;
  errorMessage: string = '';

  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faClose = faClose;
  faUser = faUser;
  faSpinner = faSpinner;
  faPlus = faPlus;
  faMinus = faMinus;
  faUndo = faUndo;
  faTrash = faTrash;
  faUpload = faUpload;

  showPassword = false;
  showConfirmPassword = false;

  imagePreview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  // Image manipulation properties
  isDragging = false;
  imageScale = 1;
  imagePosition = { x: 0, y: 0 };
  isDraggingImage = false;
  dragStart = { x: 0, y: 0 };

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(/^[ก-์a-zA-Z0-9\s]{3,50}$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
        this.emailValidator()
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      phone: ['', [Validators.pattern(/^0[0-9]{9}$/)]],
      address: this.formBuilder.group({
        street: [''],
        city: [''],
        state: [''],
        zip: [''],
        country: ['']
      }),
      profileImage: [null]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      setTimeout(() => {
        this.animateFormElements();
      }, 100);
    }
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword) {
      confirmPassword.setErrors(null);
    }
  }

  get f() {
    return this.registerForm.controls;
  }

  closeModal(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.isOpen = false;
    setTimeout(() => {
      this.closeModalEvent.emit();
    }, 300);
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

  // Image manipulation methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleImageFile(files[0]);
    }
  }

  startDragging(event: MouseEvent): void {
    if (!this.imagePreview) return;
    
    this.isDraggingImage = true;
    this.dragStart = {
      x: event.clientX - this.imagePosition.x,
      y: event.clientY - this.imagePosition.y
    };
  }

  onDrag(event: MouseEvent): void {
    if (!this.isDraggingImage) return;
    
    event.preventDefault();
    this.imagePosition = {
      x: event.clientX - this.dragStart.x,
      y: event.clientY - this.dragStart.y
    };
  }

  stopDragging(): void {
    this.isDraggingImage = false;
  }

  zoomIn(): void {
    if (this.imageScale < 2) {
      this.imageScale += 0.1;
    }
  }

  zoomOut(): void {
    if (this.imageScale > 0.5) {
      this.imageScale -= 0.1;
    }
  }

  resetImage(): void {
    this.imageScale = 1;
    this.imagePosition = { x: 0, y: 0 };
  }

  removeImage(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.resetImage();
    this.registerForm.get('profileImage')?.setValue(null);
  }

  handleImageFile(file: File): void {
    if (file.type.match(/image\/*/) == null) {
      // Handle invalid file type
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    
    reader.onload = () => {
      this.imagePreview = reader.result;
      this.resetImage(); // Reset position and scale for new image
    };
    
    reader.readAsDataURL(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleImageFile(input.files[0]);
    }
  }

  switchToLogin(): void {
    this.closeModal();
    setTimeout(() => {
      this.switchToLoginEvent.emit();
    }, 400);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      const errors: string[] = [];
      
      if (this.f['name'].errors) {
        if (this.f['name'].errors['required']) {
          errors.push('กรุณากรอกชื่อ');
        }
        if (this.f['name'].errors['minlength'] || this.f['name'].errors['maxlength']) {
          errors.push('ชื่อต้องมีความยาว 3-50 ตัวอักษร');
        }
        if (this.f['name'].errors['pattern']) {
          errors.push('ชื่อต้องประกอบด้วยตัวอักษรภาษาไทย อังกฤษ หรือตัวเลขเท่านั้น');
        }
      }

      if (this.f['email'].errors) {
        if (this.f['email'].errors['required']) {
          errors.push('กรุณากรอกอีเมล');
        }
        if (this.f['email'].errors['pattern'] || this.f['email'].errors['invalidFormat']) {
          errors.push('รูปแบบอีเมลไม่ถูกต้อง');
        }
        if (this.f['email'].errors['invalidLength']) {
          errors.push('ชื่อผู้ใช้ในอีเมลต้องมีความยาว 3-64 ตัวอักษร');
        }
        if (this.f['email'].errors['invalidDomainLength']) {
          errors.push('โดเมนอีเมลไม่ถูกต้อง');
        }
        if (this.f['email'].errors['consecutiveDots']) {
          errors.push('อีเมลต้องไม่มีจุดติดกัน');
        }
        if (this.f['email'].errors['dotAtEdge']) {
          errors.push('อีเมลต้องไม่ขึ้นต้นหรือลงท้ายด้วยจุด');
        }
      }

      if (this.f['password'].errors) {
        if (this.f['password'].errors['required']) {
          errors.push('กรุณากรอกรหัสผ่าน');
        }
        if (this.f['password'].errors['minlength']) {
          errors.push('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        }
        if (this.f['password'].errors['pattern']) {
          errors.push('รหัสผ่านต้องประกอบด้วยตัวอักษรภาษาอังกฤษพิมพ์ใหญ่อย่างน้อย 1 ตัว, ตัวพิมพ์เล็กอย่างน้อย 1 ตัว และตัวเลขอย่างน้อย 1 ตัว');
        }
      }

      if (this.f['confirmPassword'].errors) {
        if (this.f['confirmPassword'].errors['required']) {
          errors.push('กรุณายืนยันรหัสผ่าน');
        }
        if (this.f['confirmPassword'].errors['passwordMismatch']) {
          errors.push('รหัสผ่านไม่ตรงกัน');
        }
      }

      if (this.f['phone'].errors?.['pattern']) {
        errors.push('เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0 และตามด้วยตัวเลข 9 หลัก');
      }

      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        html: errors.join('<br>'),
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formData = new FormData();
    const name = this.registerForm.get('name')?.value;
    const email = this.registerForm.get('email')?.value.toLowerCase();
    const password = this.registerForm.get('password')?.value;
    const phone = this.registerForm.get('phone')?.value || '';

    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('phone', phone);
    
    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }

    const address = this.registerForm.get('address')?.value;
    if (address) {
      formData.append('address', JSON.stringify(address));
    }

    // แสดงข้อมูลที่จะส่งในคอนโซล (ยกเว้นรหัสผ่าน)
    console.log('Sending registration data:', {
      name,
      email,
      phone,
      hasProfileImage: !!this.selectedFile,
      address
    });

    this.apiService.register(formData).subscribe({
      next: (response) => {
        console.log('Registration response:', response);
        this.loading = false;
        
        Swal.fire({
          icon: 'success',
          title: 'สมัครสมาชิกสำเร็จ',
          text: 'กรุณาตรวจสอบอีเมลของท่านเพื่อยืนยันการสมัครสมาชิก',
          timer: 3000,
          showConfirmButton: false
        });

        this.resetForm();
        this.closeModal();
        setTimeout(() => {
          this.switchToLoginEvent.emit();
        }, 500);
      },
      error: (error) => {
        console.error('Registration error in component:', error);
        this.loading = false;
        
        let errorMessage = 'เกิดข้อผิดพลาดในการลงทะเบียน';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error instanceof HttpErrorResponse) {
          if (error.status === 0) {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
        }
        
        Swal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาด',
          text: errorMessage,
          confirmButtonText: 'ตกลง'
        });
      }
    });
  }

  animateFormElements(): void {
    this.isOpen = true;
    
    // Form groups animation
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
      const element = group as HTMLElement;
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        element.style.transition = 'all 0.3s ease-out';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, 100 + (index * 50));
    });
  }

  resetForm(): void {
    this.registerForm.reset();
    this.submitted = false;
    this.imagePreview = null;
    this.selectedFile = null;
  }

  // เพิ่มฟังก์ชัน validator สำหรับอีเมล
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const email = control.value;
      if (!email) return null;

      // ตรวจสอบความยาวของส่วนต่างๆ
      const [localPart, domain] = email.split('@');
      if (!domain) return { invalidFormat: true };
      
      if (localPart.length < 3 || localPart.length > 64) {
        return { invalidLength: true };
      }
      if (domain.length < 4 || domain.length > 255) {
        return { invalidDomainLength: true };
      }
      
      // ตรวจสอบจุดติดกัน
      if (email.includes('..')) {
        return { consecutiveDots: true };
      }
      
      // ตรวจสอบจุดที่ขึ้นต้นหรือลงท้าย
      if (localPart.startsWith('.') || localPart.endsWith('.')) {
        return { dotAtEdge: true };
      }

      return null;
    };
  }
}