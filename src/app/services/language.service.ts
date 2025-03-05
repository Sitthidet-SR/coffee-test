// src/app/services/language.service.ts
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguage = new BehaviorSubject<string>('th');

  constructor(private translate: TranslateService) {
    // Set default language
    this.translate.setDefaultLang('th');
    
    // Try to get language from localStorage
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      this.translate.use(savedLang);
      this.currentLanguage.next(savedLang);
    } else {
      this.translate.use('th');
    }
  }

  getCurrentLang(): string {
    return this.currentLanguage.getValue();
  }

  toggleLanguage(): void {
    const currentLang = this.getCurrentLang();
    const newLang = currentLang === 'th' ? 'en' : 'th';
    this.translate.use(newLang);
    this.currentLanguage.next(newLang);
    localStorage.setItem('language', newLang);
  }
}