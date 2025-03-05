import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../services/language.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import { gsap } from 'gsap';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <button (click)="switchLanguage()" 
      class="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors">
      <fa-icon [icon]="faLanguage" class="language-icon text-amber-600"></fa-icon>
      <span class="text-gray-700">
        {{ getCurrentLanguageText() }}
      </span>
    </button>
  `
})
export class LanguageSwitcherComponent implements OnInit {
  faLanguage = faLanguage;
  currentLang: string = 'th';

  constructor(private languageService: LanguageService) {}

  ngOnInit() {
    this.currentLang = this.languageService.getCurrentLang();
  }

  switchLanguage() {
    this.languageService.toggleLanguage();
    this.currentLang = this.languageService.getCurrentLang();

    // Animation
    gsap.fromTo('.language-icon',
      { rotate: 0 },
      { rotate: 360, duration: 0.7, ease: 'back.out(1.5)' }
    );
  }

  getCurrentLanguageText(): string {
    return this.currentLang === 'th' ? 'English' : 'ไทย';
  }
}