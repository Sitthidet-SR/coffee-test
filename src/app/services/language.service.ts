// src/app/services/language.service.ts
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLangSubject = new BehaviorSubject<string>('en');
  currentLang$ = this.currentLangSubject.asObservable();
  
  constructor(private translate: TranslateService) {
    this.initLanguage();
  }
  
  initLanguage(): void {
    const savedLang = localStorage.getItem('selectedLanguage');
    const defaultLang = savedLang || 'en';
    this.translate.setDefaultLang(defaultLang);
    this.translate.use(defaultLang);
    this.currentLangSubject.next(defaultLang);
  }
  
  changeLanguage(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('selectedLanguage', lang);
    this.currentLangSubject.next(lang);
  }
  
  getCurrentLang(): string {
    return this.currentLangSubject.value;
  }
  
  isEnglish(): boolean {
    return this.currentLangSubject.value === 'en';
  }

  toggleLanguage(): void {
    const currentLang = this.getCurrentLang();
    const newLang = currentLang === 'en' ? 'th' : 'en';
    this.changeLanguage(newLang);
  }
}