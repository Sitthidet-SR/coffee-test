import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CookieConsentComponent } from './cookie-consent/cookie-consent.component';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    CookieConsentComponent,
    TranslateModule
  ]
})
export class AppComponent {
  title = 'project-oop';

  constructor(private translate: TranslateService) {
    translate.setDefaultLang('th');
    translate.use('th');
  }
}
