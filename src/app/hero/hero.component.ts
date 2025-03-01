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
import axios from 'axios';

interface PopularProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  popularRank: number;
  popularCount: number;
  addedToPopularAt: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [NavbarComponent, FontAwesomeModule, CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('carouselContainer') carouselContainer!: ElementRef;
  
  // Define FontAwesome icons
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
  
  // Carousel related properties
  popularMenu: PopularProduct[] = [];
  loading: boolean = true;
  currentSlide: number = 0;
  slideWidth: number = 320;
  visibleSlides: number = 3;
  slideInterval: any;
  navigationDots: number[] = [];
  carouselPaused: boolean = false;
  
  constructor() {}
  
  ngOnInit() {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, TextPlugin);
    this.fetchPopularProducts();
    
    // Adjust visible slides based on screen size
    this.updateSlideConfig();
    window.addEventListener('resize', this.updateSlideConfig.bind(this));
  }
  
  ngAfterViewInit() {
    // Slight delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.initAnimations();
      this.startCarousel();
    }, 500);
  }
  
  ngOnDestroy() {
    // Clean up
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
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
    
    // Limit slide width to a sensible maximum
    this.slideWidth = Math.min(this.slideWidth, 400);
  }
  
  async fetchPopularProducts() {
    try {
      this.loading = true;
      const response = await axios.get<PopularProduct[]>('http://localhost:5000/api/popular-products?limit=8');
      this.popularMenu = response.data;
      
      // If we have fewer than 3 items, duplicate them to ensure smooth carousel
      if (this.popularMenu.length < 3) {
        const originalLength = this.popularMenu.length;
        for (let i = 0; i < 3 - originalLength; i++) {
          this.popularMenu.push({...this.popularMenu[i % originalLength]});
        }
      }
      
      // Update navigation dots
      const totalDots = Math.ceil(this.popularMenu.length / this.visibleSlides);
      this.navigationDots = Array(totalDots).fill(0).map((_, i) => i);
      
      this.loading = false;
    } catch (error) {
      console.error('Error fetching popular products:', error);
      this.loading = false;
      
      // Create fallback products if API fails
      this.createFallbackProducts();
    }
  }
  
  createFallbackProducts() {
    this.popularMenu = [
      {
        _id: '1',
        name: 'Signature Latte',
        description: 'Our signature espresso with silky steamed milk and a touch of caramel.',
        price: 120,
        image: 'assets/img/coffee1.png',
        popularRank: 1,
        popularCount: 1500,
        addedToPopularAt: new Date().toISOString()
      },
      {
        _id: '2',
        name: 'Mocha Delight',
        description: 'Rich espresso with chocolate and steamed milk, topped with whipped cream.',
        price: 130,
        image: 'assets/img/coffee2.png',
        popularRank: 2,
        popularCount: 1200,
        addedToPopularAt: new Date().toISOString()
      },
      {
        _id: '3',
        name: 'Seasonal Special',
        description: 'Try our limited edition seasonal blend with unique flavors and spices.',
        price: 140,
        image: 'assets/img/coffee3.png',
        popularRank: 3,
        popularCount: 900,
        addedToPopularAt: new Date().toISOString()
      }
    ];
    
    // Update navigation dots
    const totalDots = Math.ceil(this.popularMenu.length / this.visibleSlides);
    this.navigationDots = Array(totalDots).fill(0).map((_, i) => i);
  }
  
  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/img/coffee-placeholder.png';
    
    // Check if the path is already a full URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Check if the path is a relative path to assets
    if (imagePath.startsWith('assets/')) {
      return imagePath;
    }
    
    // Otherwise, assume it's from the API uploads folder
    return `http://localhost:5000/${imagePath}`;
  }
  
  startCarousel() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    
    this.slideInterval = setInterval(() => {
      if (!this.carouselPaused) {
        this.nextSlide();
      }
    }, 5000);
  }
  
  pauseCarousel() {
    this.carouselPaused = true;
  }
  
  resumeCarousel() {
    this.carouselPaused = false;
  }
  
  nextSlide() {
    const maxSlide = Math.ceil(this.popularMenu.length / this.visibleSlides) - 1;
    this.currentSlide = this.currentSlide >= maxSlide ? 0 : this.currentSlide + 1;
  }
  
  prevSlide() {
    const maxSlide = Math.ceil(this.popularMenu.length / this.visibleSlides) - 1;
    this.currentSlide = this.currentSlide <= 0 ? maxSlide : this.currentSlide - 1;
  }
  
  goToSlide(index: number) {
    this.currentSlide = index;
  }
  
  initAnimations() {
    const mainTl = gsap.timeline();
    mainTl.from('[data-gsap="fade-in"]', {
      opacity: 0,
      y: 30,
      stagger: 0.3,
      duration: 0.8,
      ease: 'power2.out'
    });
    
    gsap.to('.coffee-image', {
      y: -15,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut'
    });
    
    // Add hover effects for product cards
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