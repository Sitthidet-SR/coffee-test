import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingCart, faUser, faBars, faLanguage, faSearch, faTimes, faSignInAlt, faUserPlus, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
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
  faShoppingCart = faShoppingCart;
  faUser = faUser;
  faBars = faBars;
  faLanguage = faLanguage;
  faSearch = faSearch;
  faTimes = faTimes;
  faSignInAlt = faSignInAlt;
  faUserPlus = faUserPlus;
  faSignOutAlt = faSignOutAlt;

  isMobileMenuOpen = false;
  isEnglish = true;
  searchQuery = '';
  isUserMenuOpen = false;
  isRegisterModalOpen = false;
  isLoginModalOpen = false;

  isLoggedIn = false;
  userProfile: string | null = null;

  isMobile = false;

  logoTimeline: gsap.core.Timeline | null = null;

  constructor() { }

  ngOnInit(): void {
    this.checkScreenSize();
    this.setupInitialAnimations();
    this.setupLogoAnimation();
    this.checkLoginStatus();
  }

  checkLoginStatus(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.isLoggedIn = true;
      const userDataString = localStorage.getItem('userData');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          if (userData.profileImage) {
            if (userData.profileImage.startsWith('http')) {
              this.userProfile = `http://localhost:5000/${userData.profileImage}`;
              setTimeout(() => this.userProfile = this.userProfile, 0);
              console.log('Final Profile Image URL:', this.userProfile);
            } else {
              this.userProfile = 'http://localhost:5000/' + userData.profileImage;
            }
          } else {
            this.userProfile = 'https://via.placeholder.com/150';
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          this.userProfile = 'https://via.placeholder.com/150';
        }
      } else {
        this.userProfile = 'https://via.placeholder.com/150';
      }
    } else {
      this.isLoggedIn = false;
      this.userProfile = null;
    }
    console.log('Profile Image URL:', this.userProfile);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    this.isLoggedIn = false;
    this.userProfile = null;
    this.isUserMenuOpen = false;
    window.location.reload();
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
    this.logoTimeline = gsap.timeline({ repeat: -1, repeatDelay: 2 });

    this.logoTimeline.to('.logo-text-jack', {
      y: -5,
      duration: 1,
      ease: 'power1.inOut'
    });

    this.logoTimeline.to('.logo-text-jack', {
      y: 0,
      duration: 1,
      ease: 'power1.inOut'
    });

    this.logoTimeline.to('.logo-text-coffee', {
      scale: 1.05,
      duration: 1,
      ease: 'power1.inOut'
    }, "-=0.5");

    this.logoTimeline.to('.logo-text-coffee', {
      scale: 1,
      duration: 1,
      ease: 'power1.inOut'
    });

    this.logoTimeline.to(['.logo-text-jack', '.logo-text-coffee'], {
      filter: 'brightness(1.2)',
      duration: 0.8,
      ease: 'sine.inOut'
    });

    this.logoTimeline.to(['.logo-text-jack', '.logo-text-coffee'], {
      filter: 'brightness(1)',
      duration: 0.8,
      ease: 'sine.inOut'
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;

    if (this.isMobileMenuOpen) {
      gsap.fromTo('.mobile-menu',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    } else {
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
      }, 50);
    }
  }

  toggleLanguage(): void {
    this.isEnglish = !this.isEnglish;

    gsap.fromTo('.language-icon',
      { rotate: 0 },
      { rotate: 360, duration: 0.5, ease: 'power1.out' }
    );
  }

  searchSubmit(): void {
    console.log('Searching for:', this.searchQuery);
    this.searchQuery = '';
  }

  openLoginModal() {
    this.isLoginModalOpen = true;
    this.isRegisterModalOpen = false;
  }

  closeLoginModal() {
    this.isLoginModalOpen = false;
    this.checkLoginStatus();
  }

  openRegisterModal() {
    this.isRegisterModalOpen = true;
    this.isLoginModalOpen = false;
  }

  closeRegisterModal() {
    this.isRegisterModalOpen = false;
    this.checkLoginStatus();
  }
}