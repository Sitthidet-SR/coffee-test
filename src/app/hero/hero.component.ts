import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../navbar/navbar.component";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faEye, faEyeSlash, faClose, faSpinner,
  faStar, faHeart, faMugHot, faShoppingCart,
  faCoffee, faTruck, faGift, faArrowRight,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { TranslateModule } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { ApiService } from '../services/api.service';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [
    NavbarComponent, 
    FontAwesomeModule, 
    CommonModule,
    TranslateModule
  ],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('carouselContainer') carouselContainer!: ElementRef;
  
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faClose = faClose;
  faSpinner = faSpinner;
  faStar = faStar;
  faHeart = faHeart;
  faMugHot = faMugHot;
  faShoppingCart = faShoppingCart;
  faCoffee = faCoffee;
  faTruck = faTruck;
  faGift = faGift;
  faArrowRight = faArrowRight;
  faArrowLeft = faArrowLeft;
  
  products: Product[] = [];
  infiniteProducts: Product[] = [];
  loading: boolean = true;
  slideWidth: number = 320;
  visibleSlides: number = 3;
  carouselPaused: boolean = false;
  carouselTimeline: gsap.core.Timeline | null = null;
  error: string | null = null;

  constructor(private apiService: ApiService) {}
  
  async ngOnInit() {
    gsap.registerPlugin(ScrollTrigger, TextPlugin);
    await this.loadTopProducts();
    
    this.updateSlideConfig();
    window.addEventListener('resize', this.updateSlideConfig.bind(this));
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.initAnimations();
      if (this.carouselContainer) {
        this.initCarousel();
      }
    }, 500);
  }
  
  ngOnDestroy() {
    if (this.carouselTimeline) {
      this.carouselTimeline.kill();
    }
    window.removeEventListener('resize', this.updateSlideConfig.bind(this));
  }
  
  updateSlideConfig() {
    if (window.innerWidth < 640) {
      this.visibleSlides = 1;
      this.slideWidth = window.innerWidth - 60;
    } else if (window.innerWidth < 1024) {
      this.visibleSlides = 2;
      this.slideWidth = (window.innerWidth - 80) / 2;
    } else {
      this.visibleSlides = 3;
      this.slideWidth = (window.innerWidth - 120) / 3;
    }
    
    this.slideWidth = Math.min(this.slideWidth, 400);
  }
  
  private async loadTopProducts() {
    this.loading = true;
    this.error = null;

    try {
      const products = await this.apiService.getTopProducts().toPromise();
      this.products = products || [];
      this.infiniteProducts = [...this.products, ...this.products, ...this.products];
    } catch (error: any) {
      console.error('Error loading products:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการโหลดสินค้า';
      
      if (error.status === 0) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      this.error = errorMessage;

      await Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: errorMessage,
        confirmButtonText: 'ตกลง'
      });
    } finally {
      this.loading = false;
    }
  }
  
  getImageUrl(images: string[]): string {
    if (!images || images.length === 0) return 'assets/img/coffee-placeholder.png';
    
    const image = images[0];
    if (image.startsWith('http')) {
      return image;
    }
    
    if (image.startsWith('assets/')) {
      return image;
    }
    
    return `${environment.imageBaseUrl}/${image}`;
  }
  
  initCarousel() {
    if (!this.carouselContainer?.nativeElement) {
      return;
    }

    const carousel = this.carouselContainer.nativeElement;
    
    const maxSlide = Math.ceil(this.products.length / this.visibleSlides) - 1;
    const totalDistance = maxSlide * this.slideWidth;

    this.carouselTimeline = gsap.timeline({
      repeat: -1,
      paused: this.carouselPaused,
      defaults: { ease: "none" }
    });

    this.carouselTimeline.to(carousel, {
      x: -totalDistance,
      duration: maxSlide * 3,
      ease: "none"
    });

    this.carouselTimeline.set(carousel, {
      x: 0
    });

    this.carouselTimeline.play();
  }
  
  pauseCarousel() {
    if (this.carouselTimeline) {
      this.carouselTimeline.pause();
      this.carouselPaused = true;
    }
  }
  
  resumeCarousel() {
    if (this.carouselTimeline && this.carouselPaused) {
      this.carouselTimeline.play();
      this.carouselPaused = false;
    }
  }
  
  nextSlide() {
    if (!this.carouselContainer?.nativeElement) return;
    if (this.carouselTimeline) {
      const currentTime = this.carouselTimeline.time();
      const nextTime = currentTime + 3;
      this.carouselTimeline.seek(nextTime);
    }
  }
  
  prevSlide() {
    if (!this.carouselContainer?.nativeElement) return;
    if (this.carouselTimeline) {
      const currentTime = this.carouselTimeline.time();
      const prevTime = currentTime - 3;
      this.carouselTimeline.seek(prevTime);
    }
  }
  
  animateNumber(element: Element, end: number, duration: number = 2, decimals: number = 0) {
    const start = 0;
    gsap.to({}, {
      duration: duration,
      onUpdate: function(this: gsap.core.Tween) {
        const progress = this['progress']();
        const currentNumber = start + (end - start) * progress;
        (element as HTMLElement).textContent = currentNumber.toFixed(decimals);
      }
    });
  }
  
  initAnimations() {
    const mainTl = gsap.timeline();

    // Hero section animations
    const heroTl = gsap.timeline();
    
    // Badge animation
    heroTl.to('.badge-tag', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    });

    // Signature text animation
    heroTl.to('.signature-text', {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power4.out',
      onComplete: () => {
        // Animate underline using the span element instead of pseudo-element
        gsap.to('.signature-underline', {
          scaleX: 1,
          duration: 0.8,
          ease: 'power2.out'
        });
      }
    }, '-=0.3');

    // Coffee text animation with bounce and continuous effect
    heroTl.to('.coffee-text', {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'bounce.out',
      onComplete: () => {
        // เริ่ม animation ต่อเนื่องหลังจาก initial animation เสร็จ
        gsap.to('.coffee-text', {
          y: -10,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut'
        });
        
        // เพิ่ม glow effect
        gsap.to('.coffee-text', {
          textShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut'
        });
      }
    }, '-=0.7');

    // Description fade in
    heroTl.to('.hero-description', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out'
    }, '-=0.5');

    // Stats animation
    heroTl.from('.stat-item', {
      opacity: 0,
      y: 30,
      stagger: 0.2,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => {
        // Animate numbers
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
          const value = parseFloat(stat.getAttribute('data-value') || '0');
          const decimals = stat.getAttribute('data-decimals') || '0';
          this.animateNumber(stat, value, 2, parseInt(decimals));
        });

        // Add hover animation for stat items
        gsap.utils.toArray('.stat-item').forEach((stat: any) => {
          stat.addEventListener('mouseenter', () => {
            gsap.to(stat, {
              y: -5,
              scale: 1.05,
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
              duration: 0.3,
              ease: 'power2.out'
            });
          });
          
          stat.addEventListener('mouseleave', () => {
            gsap.to(stat, {
              y: 0,
              scale: 1,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              duration: 0.3,
              ease: 'power2.out'
            });
          });
        });
      }
    }, '-=0.3');

    // Coffee image container animation
    heroTl.from('.coffee-image-container', {
      scale: 0.8,
      opacity: 0,
      duration: 1,
      ease: 'power2.out'
    }, '-=1');

    // Continuous coffee image float animation
    gsap.to('.coffee-image', {
      y: -15,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut'
    });

    // Popular menu animations (existing code)
    const titleTl = gsap.timeline({
      scrollTrigger: {
        trigger: '[data-gsap="title-container"]',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      }
    });

    titleTl
      .from('.popular-title', {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: 'back.out(1.7)'
      })
      .to('.popular-title span span', { // underline animation
        scaleX: 1,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.3')
      .to('.popular-description', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
      }, '-=0.4');

    // Product card hover animations
    gsap.utils.toArray('.product-card').forEach((card: any) => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          y: -10,
          duration: 0.3,
          ease: 'power2.out',
          boxShadow: '0 20px 30px -10px rgba(249, 115, 22, 0.2)'
        });
        this.pauseCarousel();
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)'
        });
        this.resumeCarousel();
      });
    });
  }
}