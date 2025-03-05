import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';

// เพิ่ม type definitions
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

@Component({
  selector: 'app-cookie-consent',
  templateUrl: './cookie-consent.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [CookieService]
})
export class CookieConsentComponent implements OnInit {
  isAccepted: boolean = false;
  showDetails: boolean = false;
  
  // คุกกี้ที่จำเป็นจะเปิดใช้งานเสมอ
  necessaryCookies: boolean = true;
  analyticsCookies: boolean = false;
  marketingCookies: boolean = false;

  private readonly GA_ID = 'G-SX2JCEXN80';
  private readonly COOKIE_SETTINGS_KEY = 'cookie-settings';
  private readonly COOKIE_EXPIRY_DAYS = 365;

  defaultImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  constructor(private cookieService: CookieService) {}

  ngOnInit() {
    const cookieSettings = this.getCookieSettings();
    
    if (cookieSettings) {
      this.isAccepted = true;
      this.analyticsCookies = cookieSettings.analytics;
      this.marketingCookies = cookieSettings.marketing;
      this.applyCookieSettings(cookieSettings);
    }
  }

  acceptAll() {
    const settings: CookieSettings = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    this.saveCookieSettings(settings);
    this.isAccepted = true;
  }

  acceptSelected() {
    const settings: CookieSettings = {
      necessary: true,
      analytics: this.analyticsCookies,
      marketing: this.marketingCookies
    };
    this.saveCookieSettings(settings);
    this.isAccepted = true;
  }

  declineAll() {
    const settings: CookieSettings = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    this.saveCookieSettings(settings);
    this.isAccepted = true;
  }

  private saveCookieSettings(settings: CookieSettings) {
    this.cookieService.set(
      this.COOKIE_SETTINGS_KEY,
      JSON.stringify(settings),
      this.COOKIE_EXPIRY_DAYS
    );
    this.applyCookieSettings(settings);
  }

  private getCookieSettings(): CookieSettings | null {
    const settings = this.cookieService.get(this.COOKIE_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : null;
  }

  private applyCookieSettings(settings: CookieSettings) {
    if (settings.analytics) {
      this.enableGoogleAnalytics();
    } else {
      this.disableGoogleAnalytics();
    }
    
    if (settings.marketing) {
      this.enableMarketingCookies();
    } else {
      this.disableMarketingCookies();
    }
  }

  private enableGoogleAnalytics() {
    const gaScript = document.createElement('script');
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_ID}`;
    gaScript.async = true;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function(...args) {
      window.dataLayer!.push(arguments);
    };
    
    window.gtag('js', new Date());
    window.gtag('config', this.GA_ID);
  }

  private disableGoogleAnalytics() {
    const scripts = document.getElementsByTagName('script');
    for (let script of Array.from(scripts)) {
      if (script.src.includes('googletagmanager.com/gtag')) {
        script.remove();
      }
    }
    delete window.dataLayer;
    delete window.gtag;
  }

  private enableMarketingCookies() {
    document.cookie = "marketing_enabled=true; max-age=31536000; path=/";
  }

  private disableMarketingCookies() {
    document.cookie = "marketing_enabled=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
  }

  getImageUrl(): string {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
} 