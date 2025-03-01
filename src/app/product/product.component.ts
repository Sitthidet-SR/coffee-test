import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingCart, faHeart, faCheck } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FontAwesomeModule],
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
  apiUrl = 'http://localhost:5000/api/products';
  
  @ViewChildren('productCard') productCards!: QueryList<ElementRef>;
  @ViewChildren('productImage') productImages!: QueryList<ElementRef>;
  @ViewChild('productsContainer') productsContainer!: ElementRef;
  
  mainTimeline: gsap.core.Timeline | null = null;

  constructor(private http: HttpClient, private el: ElementRef) {}

  ngOnInit(): void {
    this.fetchProducts();
  }
  
  ngAfterViewInit(): void {
    this.mainTimeline = gsap.timeline();
    this.animateTitle();
  }
  
  animateTitle(): void {
    const titleElement = this.el.nativeElement.querySelector('h2');
    const spanElement = this.el.nativeElement.querySelector('h2 span');
    
    if (titleElement && spanElement) {
      gsap.set(titleElement, { opacity: 1, y: 0 });
      gsap.set(spanElement, { width: '6rem' });
      
      this.mainTimeline?.add(gsap.from(titleElement, {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      }));
      
      this.mainTimeline?.add(gsap.from(spanElement, {
        width: 0,
        duration: 0.5,
        ease: 'power1.out'
      }), "-=0.3");
    }
  }

  fetchProducts(): void {
    this.loading = true;
    
    this.http.get<Product[]>(this.apiUrl)
      .subscribe({
        next: (data) => {
          this.products = data;
          this.loading = false;
          
          requestAnimationFrame(() => {
            setTimeout(() => this.animateProducts(), 0);
          });
        },
        error: (error) => {
          console.error('Error fetching products:', error);
          this.error = 'Failed to load products. Please try again later.';
          this.loading = false;
        }
      });
  }
  
  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/placeholder.png';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    return 'http://localhost:5000/' + imagePath;
  }
  
  addToCart(product: Product, event: MouseEvent): void {
    event.stopPropagation();
    
    const button = event.currentTarget as HTMLElement;
    
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
    
    console.log('Adding to cart:', product);
    
    const originalHTML = button.innerHTML;
    const originalWidth = button.offsetWidth;
    const originalBackgroundColor = window.getComputedStyle(button).backgroundColor;
    
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
              backgroundColor: originalBackgroundColor,
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
  }
  
  createFlyingAnimation(event: MouseEvent): void {
    const productCard = (event.currentTarget as HTMLElement).closest('.bg-white');
    const productImage = productCard?.querySelector('img') as HTMLElement;
    
    if (productImage) {
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
      
      const cartIcon = document.querySelector('.cart-icon') as HTMLElement;
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
  }

  formatPrice(price: number): string {
    return '฿ ' + price.toFixed(2);
  }

  animateProducts(): void {
    if (this.mainTimeline) {
      this.mainTimeline.clear();
      this.animateTitle();
    } else {
      this.mainTimeline = gsap.timeline();
      this.animateTitle();
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
      duration: 0.6,
      ease: 'power2.out'
    }));
    
    this.mainTimeline?.add(gsap.from(productCards, {
      y: 50,
      opacity: 0,
      scale: 0.95,
      duration: 0.7,
      stagger: {
        each: 0.08,
        grid: 'auto',
        from: 'start'
      },
      ease: 'power2.out',
      clearProps: 'opacity,scale'
    }), "-=0.3");
    
    if (productImages.length > 0) {
      this.mainTimeline?.add(gsap.from(productImages, {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'back.out(1.7)',
        clearProps: 'opacity,scale'
      }), "-=0.4");
    }
    
    if (productTitles.length > 0) {
      this.mainTimeline?.add(gsap.from(productTitles, {
        y: 15,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'opacity'
      }), "-=0.3");
    }
    
    if (productDescriptions.length > 0) {
      this.mainTimeline?.add(gsap.from(productDescriptions, {
        y: 15,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'opacity'
      }), "-=0.4");
    }
    
    const endElements = [...Array.from(productPrices), ...Array.from(productButtons)];
    if (endElements.length > 0) {
      this.mainTimeline?.add(gsap.from(endElements, {
        y: 10,
        opacity: 0,
        duration: 0.6,
        stagger: 0.03,
        ease: 'power2.out',
        clearProps: 'opacity'
      }), "-=0.4");
    }
    
    productImages.forEach((image: Element) => {
      gsap.to(image, {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: Math.random() * 0.5
      });
    });
    
    this.mainTimeline?.play();
  }
}