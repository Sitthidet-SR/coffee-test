import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingCart, faUser, faBars, faSearch, faTimes, faSignInAlt, faUserPlus, faSignOutAlt, faCoffee, faLanguage, faCog, faMinus, faPlus, faTrash, faShoppingBasket } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';
import { RegisterComponent } from '../register/register.component';
import { LoginComponent } from '../login/login.component';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { CartService } from '../services/cart.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, 
    FontAwesomeModule, 
    FormsModule, 
    RouterModule,
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
  faCog = faCog;
  faMinus = faMinus;
  faPlus = faPlus;
  faTrash = faTrash;
  faShoppingBasket = faShoppingBasket;

  isMobileMenuOpen = false;
  isMobileSearchOpen = false;
  searchQuery = '';
  isUserMenuOpen = false;
  isRegisterModalOpen = false;
  isLoginModalOpen = false;
  isSearchOpen = false;

  userProfile: string | null = null;
  user: any = null;
  profileImage: string = 'assets/images/default-avatar.jpg';

  isMobile = false;

  logoTimeline: gsap.core.Timeline | null = null;
  activeMenuIndex: number = 0;

  showLogo = true;

  isCartMenuOpen = false;
  cartItems: any[] = [];
  cartItemCount = 0;
  cartTotal = 0;

  isLoggedIn$: Observable<boolean>;
  isAdmin$: Observable<boolean>;

  constructor(
    private languageService: LanguageService, 
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    this.isAdmin$ = this.authService.isAdmin$;
    
    this.cartService.openLoginModal.subscribe(() => {
      this.openLoginModal();
    });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.setupInitialAnimations();
    this.setupLogoAnimation();
    this.loadUserProfile();
    this.setupMenuAnimations();

    this.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.loadUserProfile();
      } else {
        this.userProfile = null;
      }
    });

    this.authService.user$.subscribe(user => {
      this.user = user;
      if (user?.profileImage) {
        this.profileImage = user.profileImage.startsWith('http') 
          ? user.profileImage 
          : `${environment.imageBaseUrl}/${user.profileImage}`;
      }
    });

    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartItemCount = items.length;
      this.cartTotal = this.calculateCartTotal();
    });
  }

  loadUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.userProfile = null;
      this.profileImage = 'assets/images/default-avatar.jpg';
      return;
    }
    
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        if (user?.profileImage) {
          this.profileImage = user.profileImage.startsWith('http') 
            ? user.profileImage 
            : `${environment.imageBaseUrl}/${user.profileImage}`;
        } else {
          this.profileImage = 'assets/images/default-avatar.jpg';
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        if (error.status === 401) {
          this.authService.logout();
          this.userProfile = null;
          this.profileImage = 'assets/images/default-avatar.jpg';
        }
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.userProfile = null;
    this.isUserMenuOpen = false;

    Swal.fire({
      icon: 'success',
      title: 'ออกจากระบบสำเร็จ',
      text: 'ขอบคุณที่ใช้บริการ',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      window.location.reload();
    });
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

    const cartMenuContainer = document.querySelector('.cart-menu-container');
    if (this.isCartMenuOpen && 
        cartMenuContainer && 
        !cartMenuContainer.contains(event.target as Node)) {
      this.isCartMenuOpen = false;
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
    const logoContainer = document.querySelector('.navbar-logo');
    const logoIcon = document.querySelector('.navbar-logo fa-icon');
    
    if (logoContainer && logoIcon) {
      const logoTimeline = gsap.timeline({ paused: true });
      
      logoTimeline.to(logoIcon, {
        rotate: 12,
        scale: 1.1,
        duration: 0.3,
        ease: 'power2.out'
      });

      logoContainer.addEventListener('mouseenter', () => logoTimeline.play());
      logoContainer.addEventListener('mouseleave', () => logoTimeline.reverse());
    }
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
    if (this.isLoginModalOpen) {
      this.closeLoginModal();
      return;
    }

    if (this.isRegisterModalOpen) {
      this.closeRegisterModal();
    }

    this.isLoginModalOpen = true;
    setTimeout(() => {
      const loginModal = document.querySelector('app-login .login-modal-backdrop');
      if (loginModal) {
        (loginModal as HTMLElement).style.visibility = 'visible';
        (loginModal as HTMLElement).style.zIndex = '1001';
        gsap.to(loginModal, {
          opacity: 1,
          duration: 0.3
        });
      }
    }, 0);
  }

  closeLoginModal() {
    const loginModal = document.querySelector('app-login .login-modal-backdrop');
    if (loginModal) {
      gsap.to(loginModal, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          this.isLoginModalOpen = false;
          (loginModal as HTMLElement).style.visibility = 'hidden';
        }
      });
    }
  }

  openRegisterModal() {
    if (this.isRegisterModalOpen) {
      this.closeRegisterModal();
      return;
    }

    if (this.isLoginModalOpen) {
      this.closeLoginModal();
    }

    this.isRegisterModalOpen = true;
    setTimeout(() => {
      const registerModal = document.querySelector('app-register .register-modal-backdrop');
      if (registerModal) {
        (registerModal as HTMLElement).style.visibility = 'visible';
        (registerModal as HTMLElement).style.zIndex = '1001';
        gsap.to(registerModal, {
          opacity: 1,
          duration: 0.3
        });
      }
    }, 0);
  }

  closeRegisterModal() {
    const registerModal = document.querySelector('app-register .register-modal-backdrop');
    if (registerModal) {
      gsap.to(registerModal, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          this.isRegisterModalOpen = false;
          (registerModal as HTMLElement).style.visibility = 'hidden';
        }
      });
    }
  }

  toggleCartMenu(event: Event): void {
    event.stopPropagation();
    this.isCartMenuOpen = !this.isCartMenuOpen;
  }

  calculateCartTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  updateQuantity(item: any, change: number): void {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      this.cartService.updateQuantity(item.productId, newQuantity).subscribe({
        next: () => {
          item.quantity = newQuantity;
          this.cartTotal = this.calculateCartTotal();
        },
        error: (error) => console.error('Error updating quantity:', error)
      });
    }
  }

  removeFromCart(item: any): void {
    this.cartService.removeFromCart(item.productId).subscribe({
      next: () => {
        this.cartItems = this.cartItems.filter(i => i.productId !== item.productId);
        this.cartTotal = this.calculateCartTotal();
        this.cartItemCount = this.cartItems.length;
      },
      error: (error) => console.error('Error removing item:', error)
    });
  }

  checkout(): void {
    this.router.navigate(['/checkout']);
    this.isCartMenuOpen = false;
  }

  get currentLanguage(): string {
    return this.languageService.getCurrentLang();
  }
}