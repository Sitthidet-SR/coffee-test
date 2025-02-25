// navbar.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingCart, faUser, faBars, faLanguage, faSearch, faTimes, faSignInAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';
import { RegisterComponent } from '../register/register.component';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, RegisterComponent, LoginComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  // Icons
  faShoppingCart = faShoppingCart;
  faUser = faUser;
  faBars = faBars;
  faLanguage = faLanguage;
  faSearch = faSearch;
  faTimes = faTimes;
  faSignInAlt = faSignInAlt;
  faUserPlus = faUserPlus;

  // State variables
  isMobileMenuOpen = false;
  isEnglish = true;
  searchQuery = '';
  isUserMenuOpen = false;
  isRegisterModalOpen = false;
  isLoginModalOpen = false;
  
  // Responsive state
  isMobile = false;
  
  // Animation timeline
  logoTimeline: gsap.core.Timeline | null = null;

  constructor() {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.setupInitialAnimations();
    this.setupLogoAnimation();
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
    if (!this.isMobile && this.isMobileMenuOpen) {
      this.toggleMobileMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close user menu when clicking outside
    const userMenuElement = document.querySelector('.user-menu-container');
    const userButtonElement = document.querySelector('.user-button');
    
    if (this.isUserMenuOpen && 
        userMenuElement && 
        userButtonElement && 
        !userMenuElement.contains(event.target as Node) && 
        !userButtonElement.contains(event.target as Node)) {
      this.isUserMenuOpen = false;
    }
  }

  setupInitialAnimations(): void {
    // Initial animation for navbar elements (except logo)
    gsap.from('.nav-item', { 
      opacity: 0, 
      y: -10, 
      stagger: 0.1, 
      duration: 0.4, 
      ease: 'power2.out',
      delay: 0.2
    });
    
    gsap.from('.nav-icon', { 
      opacity: 0, 
      x: 10, 
      stagger: 0.1, 
      duration: 0.4, 
      ease: 'power2.out',
      delay: 0.4
    });
    
    gsap.from('.search-container', {
      opacity: 0,
      y: -10,
      duration: 0.5,
      ease: 'power2.out',
      delay: 0.3
    });
  }

  setupLogoAnimation(): void {
    // Create a GSAP timeline for continuous logo animation
    this.logoTimeline = gsap.timeline({repeat: -1, repeatDelay: 2});
    
    // First part - gentle hover effect
    this.logoTimeline.to('.logo-text-jack', {
      y: -5,
      duration: 1,
      ease: 'power1.inOut'
    });
    
    // Second part - return to original position
    this.logoTimeline.to('.logo-text-jack', {
      y: 0,
      duration: 1,
      ease: 'power1.inOut'
    });
    
    // Third part - subtle scale effect for "Coffee"
    this.logoTimeline.to('.logo-text-coffee', {
      scale: 1.05,
      duration: 1,
      ease: 'power1.inOut'
    }, "-=0.5");
    
    // Fourth part - return "Coffee" to original size
    this.logoTimeline.to('.logo-text-coffee', {
      scale: 1,
      duration: 1,
      ease: 'power1.inOut'
    });
    
    // Fifth part - subtle color pulse for both
    this.logoTimeline.to(['.logo-text-jack', '.logo-text-coffee'], {
      filter: 'brightness(1.2)',
      duration: 0.8,
      ease: 'sine.inOut'
    });
    
    // Return to original brightness
    this.logoTimeline.to(['.logo-text-jack', '.logo-text-coffee'], {
      filter: 'brightness(1)',
      duration: 0.8,
      ease: 'sine.inOut'
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    if (this.isMobileMenuOpen) {
      // Animate mobile menu opening
      gsap.fromTo('.mobile-menu', 
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    } else {
      // Animate mobile menu closing
      gsap.to('.mobile-menu', { opacity: 0, y: -20, duration: 0.3 });
    }
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
    
    if (this.isUserMenuOpen) {
      setTimeout(() => {
        gsap.fromTo('.user-menu', 
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
        );
      }, 50); // รอ 50ms
    }
  }

  toggleLanguage(): void {
    this.isEnglish = !this.isEnglish;
    
    // Animate language toggle
    gsap.fromTo('.language-icon', 
      { rotate: 0 },
      { rotate: 360, duration: 0.5, ease: 'power1.out' }
    );
  }

  searchSubmit(): void {
    // Handle search submission
    console.log('Searching for:', this.searchQuery);
    // Reset after search
    this.searchQuery = '';
  }

  openLoginModal() {
    this.isLoginModalOpen = true;
    this.isRegisterModalOpen = false; // ปิด Register Modal ถ้ามีการเปิดอยู่
  }

  closeLoginModal() {
    this.isLoginModalOpen = false;
  }

  openRegisterModal() {
    this.isRegisterModalOpen = true;
    this.isLoginModalOpen = false; // ปิด Login Modal ถ้ามีการเปิดอยู่
  }

  closeRegisterModal() {
    this.isRegisterModalOpen = false;
  }
}