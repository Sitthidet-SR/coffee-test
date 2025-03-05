import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faCoffee } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule, CommonModule, TranslateModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[#fff8ee] overflow-hidden">
      <div class="text-center px-4 relative">
        <!-- Coffee cups background -->
        <div class="absolute inset-0 -z-10 opacity-10">
          <div *ngFor="let position of coffeePositions" 
               class="coffee-icon absolute"
               [style.left]="position.left + '%'"
               [style.top]="position.top + '%'">
            <fa-icon [icon]="faCoffee" class="text-4xl text-amber-800"></fa-icon>
          </div>
        </div>

        <!-- 404 Text -->
        <div class="relative mb-8">
          <h1 class="text-[8rem] md:text-[12rem] font-bold text-amber-600 error-text leading-none">
            <span class="inline-block">4</span>
            <span class="inline-block">
              <fa-icon [icon]="faCoffee" class="text-[6rem] md:text-[8rem] mx-2 md:mx-4 coffee-spin"></fa-icon>
            </span>
            <span class="inline-block">4</span>
          </h1>
        </div>

        <!-- Message -->
        <p class="text-xl md:text-2xl text-gray-700 mb-12 message-text px-4">
          {{ '404.message' | translate }}
        </p>

        <!-- Button -->
        <div class="relative z-10">
          <a routerLink="/" 
             class="inline-flex items-center px-6 md:px-8 py-3 md:py-4 bg-amber-500 text-white text-lg rounded-full hover:bg-amber-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl back-button opacity-100">
            <fa-icon [icon]="faHome" class="mr-2"></fa-icon>
            {{ '404.backToHome' | translate }}
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .coffee-spin {
      animation: spin 4s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .coffee-icon {
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    .error-text {
      text-shadow: 4px 4px 0px rgba(0,0,0,0.1);
    }

    .back-button {
      transition: all 0.3s ease;
    }

    .back-button:hover {
      transform: translateY(-2px);
    }

    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class NotFoundComponent implements OnInit {
  faHome = faHome;
  faCoffee = faCoffee;
  
  coffeePositions = Array(5).fill(0).map(() => ({
    left: Math.random() * 100,
    top: Math.random() * 100
  }));

  constructor() {}

  ngOnInit() {
    // Animate elements on page load
    gsap.from('.error-text span', {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: 'bounce.out',
      stagger: 0.2
    });

    gsap.from('.message-text', {
      y: 20,
      opacity: 0,
      duration: 1,
      delay: 0.5
    });

    // แก้ไขอนิเมชั่นของปุ่ม
    const button = document.querySelector('.back-button');
    if (button) {
      // ตั้งค่าเริ่มต้นให้ปุ่มแสดงผล
      gsap.set(button, { opacity: 1, scale: 1 });
      
      // ทำอนิเมชั่นแบบ subtle
      gsap.from(button, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 1,
        ease: 'power2.out'
      });
    }

    // Animate coffee icons continuously
    this.animateCoffeeIcons();
  }

  private animateCoffeeIcons() {
    const icons = document.querySelectorAll('.coffee-icon');
    icons.forEach((icon, index) => {
      gsap.to(icon, {
        x: 'random(-50, 50)',
        y: 'random(-50, 50)',
        rotation: 'random(-45, 45)',
        duration: 'random(2, 4)',
        repeat: -1,
        yoyo: true,
        ease: 'none',
        delay: index * 0.2
      });
    });
  }
} 