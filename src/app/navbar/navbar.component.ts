import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingCart, faUser, faBars, faSearch, faTimes, faSignInAlt, faUserPlus, faSignOutAlt, faCoffee, faLanguage } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';
import { RegisterComponent } from '../register/register.component';
import { LoginComponent } from '../login/login.component';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, 
    FontAwesomeModule, 
    FormsModule, 
    RegisterComponent, 
    LoginComponent,
    TranslateModule,
    LanguageSwitcherComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  faShoppingCart = faShoppingCart;
  faUser = faUser;
  faBars = faBars;
  faSearch = faSearch;
  faTimes = faTimes;
  faSignInAlt = faSignInAlt;
  faUserPlus = faUserPlus;
  faSignOutAlt = faSignOutAlt;
  faCoffee = faCoffee;
  faLanguage = faLanguage;

  isMobileMenuOpen = false;
  isMobileSearchOpen = false;
  searchQuery = '';
  isUserMenuOpen = false;
  isRegisterModalOpen = false;
  isLoginModalOpen = false;
  isSearchOpen = false;

  isLoggedIn = false;
  userProfile: string | null = null;

  isMobile = false;

  logoTimeline: gsap.core.Timeline | null = null;
  activeMenuIndex: number = 0;

  constructor(private languageService: LanguageService) { }

  ngOnInit(): void {
    this.checkScreenSize();
    this.setupInitialAnimations();
    this.setupLogoAnimation();
    this.checkLoginStatus();
    this.setupMenuAnimations();
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
    
    const searchContainerWrapper = document.querySelector('.search-container-wrapper');
    if (this.isSearchOpen && 
        searchContainerWrapper && 
        !searchContainerWrapper.contains(event.target as Node)) {
      this.isSearchOpen = false;
    }
  }

  setupInitialAnimations(): void {
    gsap.from('.nav-item', {
      opacity: 0,
      y: -10,
      stagger: 0.1,
      duration: 0.6,
      ease: 'back.out(1.7)',
      delay: 0.2
    });

    gsap.from('.nav-icon', {
      opacity: 0,
      x: 10,
      stagger: 0.1,
      duration: 0.5,
      ease: 'power2.out',
      delay: 0.4
    });
  }

  setupMenuAnimations(): void {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        gsap.to(item, {
          scale: 1.1,
          duration: 0.3,
          ease: 'power1.out'
        });
      });
      
      item.addEventListener('mouseleave', () => {
        gsap.to(item, {
          scale: 1,
          duration: 0.3,
          ease: 'power1.in'
        });
      });
    });
  }

  setupLogoAnimation(): void {
    this.logoTimeline = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });

    this.logoTimeline.to('.logo-text-jack', {
      y: -8,
      duration: 0.8,
      ease: 'elastic.out(1.2, 0.5)'
    });

    this.logoTimeline.to('.logo-text-jack', {
      y: 0,
      duration: 0.8,
      ease: 'elastic.out(1.2, 0.5)'
    });

    this.logoTimeline.to('.logo-icon', {
      y: -10,
      rotation: -15,
      duration: 0.5,
      ease: 'power2.out'
    }, "-=0.3");

    this.logoTimeline.to('.logo-icon', {
      y: 0,
      rotation: 0,
      duration: 0.8,
      ease: 'elastic.out(1.2, 0.3)'
    });

    this.logoTimeline.to('.logo-text-coffee', {
      scale: 1.1,
      duration: 0.7,
      ease: 'power2.inOut'
    }, "-=0.5");

    this.logoTimeline.to('.logo-text-coffee', {
      scale: 1,
      duration: 0.7,
      ease: 'power2.inOut'
    });

    this.logoTimeline.to('.logo-text-jack', {
      color: '#f59e0b',
      textShadow: '0 0 8px rgba(245, 158, 11, 0.5)',
      duration: 0.8,
      ease: 'sine.inOut'
    }, "-=0.3");

    this.logoTimeline.to('.logo-text-jack', {
      color: '#f97316',
      textShadow: 'none',
      duration: 0.8,
      ease: 'sine.inOut'
    });

    this.logoTimeline.to('.logo-text-coffee', {
      color: '#44403c',
      fontWeight: '700',
      duration: 0.8,
      ease: 'sine.inOut'
    }, "-=0.8");

    this.logoTimeline.to('.logo-text-coffee', {
      color: '#1f2937',
      fontWeight: '600',
      duration: 0.8,
      ease: 'sine.inOut'
    });
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      }, 300);
      
      gsap.fromTo('.search-container',
        { opacity: 0, width: 0 },
        { opacity: 1, width: 'auto', duration: 0.3, ease: 'power2.out' }
      );
    }
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen = !this.isMobileSearchOpen;
    
    if (this.isMobileSearchOpen) {
      if (this.isMobileMenuOpen) {
        this.isMobileMenuOpen = false;
        gsap.to('.mobile-menu', { opacity: 0, y: -20, duration: 0.3 });
      }
      
      gsap.fromTo('.mobile-search-container',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
      
      setTimeout(() => {
        const mobileSearchInput = document.querySelector('.mobile-search-container input');
        if (mobileSearchInput) {
          (mobileSearchInput as HTMLInputElement).focus();
        }
      }, 300);
    } else {
      gsap.to('.mobile-search-container', { opacity: 0, y: -10, duration: 0.3 });
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    
    if (this.isMobileSearchOpen && this.isMobileMenuOpen) {
      this.isMobileSearchOpen = false;
      gsap.to('.mobile-search-container', { opacity: 0, y: -10, duration: 0.3 });
    }

    if (this.isMobileMenuOpen) {
      gsap.fromTo('.mobile-menu',
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
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
          { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' }
        );
      }, 50);
    }
  }

  toggleLanguage(): void {
    this.languageService.toggleLanguage();
  
    gsap.fromTo('.language-icon',
      { rotate: 0 },
      { rotate: 360, duration: 0.7, ease: 'back.out(1.5)' }
    );
  }

  searchSubmit(): void {
    console.log('Searching for:', this.searchQuery);
    this.isSearchOpen = false;
    this.isMobileSearchOpen = false;
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

  get isEnglish(): boolean {
    return this.languageService.isEnglish();
  }
}