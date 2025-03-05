import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingCart, faHeart, faCheck, faStar } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { SearchComponent } from '../search/search.component';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, retry, timeout, throwError } from 'rxjs';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  ratings: number;
  numReviews: number;
  category: string;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    FontAwesomeModule, 
    SearchComponent,
    TranslateModule
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent implements OnInit, AfterViewInit {
  products: Product[] = [];
  loading: boolean = true;
  error: string | null = null;
  faShoppingCart = faShoppingCart;
  faHeart = faHeart;
  faCheck = faCheck;
  faStar = faStar;
  apiUrl = 'http://13.239.242.215:5000/api/products';
  
  @ViewChildren('productCard') productCards!: QueryList<ElementRef>;
  @ViewChildren('productImage') productImages!: QueryList<ElementRef>;
  @ViewChild('productsContainer') productsContainer!: ElementRef;
  
  mainTimeline: gsap.core.Timeline | null = null;

  categories: string[] = ['ทั้งหมด', 'กาแฟ', 'ชา', 'เบเกอรี่', 'ของหวาน'];
  selectedCategory: string = 'ทั้งหมด';
  filteredProducts: Product[] = [];

  constructor(
    private http: HttpClient, 
    private el: ElementRef,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchProducts();
  }
  
  ngAfterViewInit(): void {
    this.mainTimeline = gsap.timeline();
    this.initTitleAnimation();
  }
  
  initTitleAnimation() {
    // ลบหรือ comment animation ที่ไม่ได้ใช้
  }

  fetchProducts(): void {
    this.loading = true;
    this.error = null;
    
    this.http.get<Product[]>(this.apiUrl)
      .pipe(
        timeout(10000), // timeout หลังจาก 10 วินาที
        retry(3), // ลองใหม่ 3 ครั้งถ้าเกิด error
        catchError((error: HttpErrorResponse) => {
          let errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า';
          
          if (error.status === 0) {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง';
          } else if (error.status === 404) {
            errorMessage = 'ไม่พบข้อมูลสินค้า';
          }
          
          return throwError(() => errorMessage);
        })
      )
      .subscribe({
        next: (data) => {
          this.products = data;
          this.filteredProducts = data;
          this.loading = false;
          
          requestAnimationFrame(() => {
            setTimeout(() => this.animateProducts(), 0);
          });
        },
        error: (error) => {
          console.error('Error fetching products:', error);
          this.error = error;
          this.loading = false;
        }
      });
  }
  
  getImageUrl(images: string[]): string {
    if (!images || images.length === 0) {
      return 'assets/images/default-product.jpg';
    }
    
    const image = images[0];
    if (image.startsWith('http')) {
      return image;
    }
    
    if (image.startsWith('assets/')) {
      return image;
    }
    
    return `http://13.239.242.215:5000/${image}`;
  }
  
  addToCart(product: Product, event: MouseEvent): void {
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;

    this.cartService.addToCart(product).subscribe({
      next: () => {
        // Success animation
        const buttonTimeline = gsap.timeline();
        buttonTimeline
          .to(button, {
            scale: 0.9,
            duration: 0.1,
            ease: 'back.out(1.7)'
          })
          .to(button, {
            scale: 1,
            duration: 0.2,
            ease: 'back.out(1.7)'
          });

        // Change button appearance temporarily
        const originalHTML = button.innerHTML;
        const originalWidth = button.offsetWidth;
        button.style.width = `${originalWidth}px`;

        const textChangeTimeline = gsap.timeline();
        textChangeTimeline
          .to(button, {
            backgroundColor: '#15803d',
            color: 'white',
            duration: 0.3,
            ease: 'power1.inOut',
            onComplete: () => {
              button.innerHTML = `<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span>Added</span>`;
            }
          })
          .to({}, {
            duration: 1.2,
            onComplete: () => {
              if (button) {
                gsap.to(button, {
                  backgroundColor: 'rgb(245, 158, 11)',
                  duration: 0.3,
                  ease: 'power1.inOut',
                  onComplete: () => {
                    if (button) {
                      button.style.width = '';
                      button.innerHTML = originalHTML;
                    }
                  }
                });
              }
            }
          });

        this.createFlyingAnimation(event);
      },
      error: (error) => {
        if (error === 'login_required') {
          // Store current URL to redirect back after login
          localStorage.setItem('redirectUrl', this.router.url);
          
          // Find and trigger login modal
          const loginButton = document.querySelector('.nav-icon.user-button') as HTMLElement;
          if (loginButton) {
            loginButton.click();
          }
        }
      }
    });
  }
  
  createFlyingAnimation(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (!target) {
      console.warn('Could not find target element for flying animation');
      return;
    }

    const productCard = target.closest('.bg-white');
    if (!productCard) {
      console.warn('Could not find product card element');
      return;
    }

    const productImage = productCard.querySelector('img');
    if (!productImage) {
      console.warn('Could not find product image element');
      return;
    }

    const imgClone = productImage.cloneNode(true) as HTMLElement;
    document.body.appendChild(imgClone);

    const imgRect = productImage.getBoundingClientRect();

    Object.assign(imgClone.style, {
      position: 'fixed',
      left: `${imgRect.left}px`,
      top: `${imgRect.top}px`,
      width: `${imgRect.width}px`,
      height: `${imgRect.height}px`,
      borderRadius: '8px',
      pointerEvents: 'none',
      zIndex: '9999',
      transition: 'none',
      boxShadow: '0 10px 15px -3px rgba(217, 119, 6, 0.2)',
    });

    const cartIconPosition = {
      x: window.innerWidth - 80,
      y: 30
    };

    const flyingTimeline = gsap.timeline({
      onComplete: () => {
        if (document.body.contains(imgClone)) {
          document.body.removeChild(imgClone);
        }
      }
    });

    flyingTimeline
      .set(imgClone, { scale: 1, opacity: 1 })
      .to(imgClone, {
        x: cartIconPosition.x - imgRect.left,
        y: cartIconPosition.y - imgRect.top,
        opacity: 0,
        scale: 0.3,
        rotation: -5,
        duration: 0.8,
        ease: 'power3.in',
      });

    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
      flyingTimeline.to(cartIcon, {
        scale: 1.2,
        duration: 0.2,
        delay: 0.6
      }).to(cartIcon, {
        scale: 1,
        duration: 0.2,
        ease: 'bounce.out'
      });
    }
  }

  formatPrice(price: number): string {
    return '฿ ' + price.toFixed(2);
  }

  animateProducts(): void {
    if (this.mainTimeline) {
      this.mainTimeline.clear();
    } else {
      this.mainTimeline = gsap.timeline();
    }
    
    const productsContainer = this.el.nativeElement.querySelector('.grid');
    
    if (!productsContainer || !this.products.length) {
      return;
    }
    
    const productCards = this.el.nativeElement.querySelectorAll('.bg-white');
    const productImages = this.el.nativeElement.querySelectorAll('.bg-white img');
    const productTitles = this.el.nativeElement.querySelectorAll('.bg-white h3');
    const productDescriptions = this.el.nativeElement.querySelectorAll('.bg-white p');
    const productPrices = this.el.nativeElement.querySelectorAll('.bg-white .text-amber-500');
    const productButtons = this.el.nativeElement.querySelectorAll('.bg-white button');
    
    gsap.set(productsContainer, { opacity: 1, y: 0 });
    
    this.mainTimeline?.add(gsap.from(productsContainer, {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: 'power2.out'
    }));
    
    this.mainTimeline?.add(gsap.from(productCards, {
      y: 30,
      opacity: 0,
      scale: 0.95,
      duration: 0.5,
      stagger: {
        each: 0.05,
        grid: 'auto',
        from: 'start'
      },
      ease: 'power2.out',
      clearProps: 'opacity,scale'
    }), "-=0.3");
    
    if (productTitles.length > 0) {
      this.mainTimeline?.add(gsap.from(productTitles, {
        y: 15,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'opacity'
      }), "-=0.3");
    }
    
    if (productDescriptions.length > 0) {
      this.mainTimeline?.add(gsap.from(productDescriptions, {
        y: 15,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'opacity'
      }), "-=0.4");
    }
    
    const endElements = [...Array.from(productPrices), ...Array.from(productButtons)];
    if (endElements.length > 0) {
      this.mainTimeline?.add(gsap.from(endElements, {
        y: 10,
        opacity: 0,
        duration: 0.4,
        stagger: 0.02,
        ease: 'power2.out',
        clearProps: 'opacity'
      }), "-=0.4");
    }
    
    this.mainTimeline?.play();
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    
    if (category === 'ทั้งหมด') {
      this.filteredProducts = this.products;
    } else {
      const categoryMap: { [key: string]: string } = {
        'กาแฟ': 'coffee',
        'ชา': 'tea',
        'เบเกอรี่': 'bakery',
        'ของหวาน': 'dessert'
      };
      
      this.filteredProducts = this.products.filter(
        product => product.category.toLowerCase() === categoryMap[category].toLowerCase()
      );
    }

    requestAnimationFrame(() => {
      setTimeout(() => this.animateProducts(), 0);
    });
  }

  getCategoryTranslationKey(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'ทั้งหมด': 'ALL',
      'กาแฟ': 'COFFEE',
      'ชา': 'TEA',
      'เบเกอรี่': 'BAKERY',
      'ของหวาน': 'DESSERT'
    };
    return categoryMap[category] || category.toUpperCase();
  }
}