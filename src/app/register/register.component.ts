import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faEye, faEyeSlash, faClose, faUser
} from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() switchToLoginEvent = new EventEmitter<void>();

  registerForm!: FormGroup;
  submitted = false;
  
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

      if (matchingControl.errors && !matchingControl.errors['matching']) {
        return null;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ matching: true });
        return { matching: true };
      } else {
        matchingControl.setErrors(null);
        return null;
      }
    };
  }

  // Helper getter for form controls
  get f() {
    return this.registerForm.controls;
  }

  // Close modal function
  closeModal(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.closeModalEvent.emit();
  }

  // Stop event propagation
  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Toggle confirm password visibility
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Handle image selection
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

  // Switch to login modal
  switchToLogin(): void {
    this.switchToLoginEvent.emit();
  }

  // Submit form
  onSubmit(): void {
    this.submitted = true;

    // Check if the form is valid
    if (this.registerForm.invalid) {
      return;
    }

    // Create form data object if uploading file is required
    const formData = new FormData();
    Object.keys(this.registerForm.value).forEach(key => {
      if (key === 'profileImage' && this.selectedFile) {
        formData.append(key, this.selectedFile);
      } else {
        formData.append(key, this.registerForm.value[key]);
      }
    });

    // Here you would make an API call to register the user
    console.log('Form submitted successfully:', this.registerForm.value);
    
    // Reset form after successful submission
    this.submitted = false;
    this.registerForm.reset();
    this.imagePreview = null;
    this.selectedFile = null;
    
    // Close the modal
    this.closeModal();
  }

  // Animation function using GSAP
  animateFormElements(): void {
    // Animate form elements one by one
    gsap.fromTo('.modal-container', 
      { opacity: 0, scale: 0.8 }, 
      { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
    );

    // Animate form fields with staggered effect
    gsap.fromTo('.form-group', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", delay: 0.2 }
    );
  }
}