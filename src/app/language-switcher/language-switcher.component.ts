import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import { LanguageService } from '../services/language.service';
import { TranslateModule } from '@ngx-translate/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TranslateModule],
  template: `
    <button (click)="toggleLanguage()"
      class="nav-icon language-icon text-gray-700 hover:text-amber-500 transition-colors duration-300"
      aria-label="Toggle Language">
      <fa-icon [icon]="faLanguage"></fa-icon>
      <span class="ml-1 text-sm">{{ isEnglish ? 'EN' : 'TH' }}</span>
    </button>
  `,
  styles: []
})
export class LanguageSwitcherComponent implements OnInit {
  faLanguage = faLanguage;
  isEnglish = true;

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    this.isEnglish = this.languageService.isEnglish();
    this.languageService.currentLang$.subscribe(lang => {
      this.isEnglish = lang === 'en';
    });
  }

  toggleLanguage(): void {
    const newLang = this.isEnglish ? 'th' : 'en';
    this.languageService.changeLanguage(newLang);
    this.isEnglish = newLang === 'en';

    gsap.fromTo('.language-icon',
      { rotate: 0 },
      { rotate: 360, duration: 0.7, ease: 'back.out(1.5)' }
    );
  }
}