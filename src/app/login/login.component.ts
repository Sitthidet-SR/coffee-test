import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faClose } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() switchToRegisterEvent = new EventEmitter<void>();


  loginForm!: FormGroup;
  submitted = false;
  
  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faClose = faClose;
  
  // Password visibility toggle
  showPassword = false;

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

  // Switch to register modal
  switchToRegister(): void {
    this.switchToRegisterEvent.emit();
  }

  // Submit form
  onSubmit(): void {
    this.submitted = true;

    // Check if the form is valid
    if (this.loginForm.invalid) {
      return;
    }

    // Here you would make an API call to login the user
    console.log('Form submitted successfully:', this.loginForm.value);
    
    // Reset form after successful submission
    this.submitted = false;
    this.loginForm.reset();
    
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