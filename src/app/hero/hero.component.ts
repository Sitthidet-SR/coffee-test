import { Component, OnInit, AfterViewInit } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faEye, faEyeSlash, faClose, faSpinner,
  faStar, faHeart, faMugHot, faShoppingCart,
  faCoffee, faTruck, faGift, faArrowRight 
} from '@fortawesome/free-solid-svg-icons';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [NavbarComponent, FontAwesomeModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, AfterViewInit {
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
  
  constructor() {}
  
  ngOnInit() {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, TextPlugin);
  }
  
  ngAfterViewInit() {
    // Slight delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.initAnimations();
    }, 100);
  }
  
  initAnimations() {
    // Create smoother animations timeline
    const mainTl = gsap.timeline();
    
    // Hero section smooth fade in
    mainTl.from('[data-gsap="fade-in"]', {
      opacity: 0,
      y: 30,
      stagger: 0.3,
      duration: 0.8,
      ease: 'power2.out'
    });
    
    // Animate coffee title with better typography animation
    const splitText = (selector: string): NodeListOf<Element> => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        const text = element.textContent || '';
        const chars = text.split('');
        element.innerHTML = '';
        chars.forEach((char: string) => {
          const span = document.createElement('span');
          span.textContent = char;
          span.style.display = 'inline-block';
          element.appendChild(span);
        });
      });
      return elements;
    };
    
    const titles = splitText('.coffee-title');
    titles.forEach(title => {
      const chars = title.querySelectorAll('span');
      gsap.fromTo(chars, 
        {
          opacity: 0,
          y: 20,
          rotateY: 90
        },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          stagger: 0.05,
          duration: 0.8,
          ease: "back.out(1.7)",
          delay: 0.4
        }
      );
      
      // Add subtle hover animation to title
      title.addEventListener('mouseenter', () => {
        gsap.to(chars, {
          y: -5,
          color: '#f59e0b',
          stagger: 0.02,
          duration: 0.4
        });
      });
      
      title.addEventListener('mouseleave', () => {
        gsap.to(chars, {
          y: 0,
          color: title.classList.contains('text-amber-500') ? '#f59e0b' : 'inherit',
          stagger: 0.02,
          duration: 0.4
        });
      });
    });
    
    // Stats counter animation
    const stats = document.querySelectorAll('.stat-item div p:first-child');
    stats.forEach(stat => {
      const value = stat.textContent || '';
      const isPercentage = value.includes('/');
      const isNumber = /\d+K\+/.test(value);
      
      let finalValue = value;
      let startValue = '0';
      
      if (isPercentage) {
        startValue = '0/5';
      } else if (isNumber) {
        startValue = '0+';
      }
      
      gsap.fromTo(stat, 
        { textContent: startValue },
        {
          textContent: finalValue,
          duration: 2,
          ease: 'power2.out',
          delay: 1.2,
          onUpdate: function() {
            if (isNumber) {
              const num = Math.round(this['progress']() * parseInt(value));
              stat.textContent = num + 'K+';
            } else if (isPercentage) {
              const num = (this['progress']() * 4.9).toFixed(1);
              stat.textContent = num + '/5';
            }
          }
        }
      );
    });
    
    // Service cards animation
    gsap.fromTo('.service-card', 
      {
        y: 100,
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        stagger: 0.2,
        duration: 0.8,
        ease: 'back.out(1.5)',
        scrollTrigger: {
          trigger: '.services-section',
          start: 'top 80%',
        }
      }
    );
    
    // Coffee image continuous floating animation
    gsap.to('.coffee-image', {
      y: -15,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut'
    });
    
    // Parallax effect on scroll
    gsap.to('.hero-background', {
      backgroundPosition: '0 100%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }
}