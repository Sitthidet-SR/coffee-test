import { Component, OnInit } from '@angular/core';
import { gsap } from 'gsap';
import { faEnvelope, faCopyright } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrivacyPolicyComponent } from '../privacy-policy/privacy-policy.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule, 
    FontAwesomeModule, 
    RouterModule, 
    PrivacyPolicyComponent,
    TranslateModule
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  faEnvelope = faEnvelope;
  faCopyright = faCopyright;
  faFacebook = faFacebook;
  faTwitter = faTwitter;
  faInstagram = faInstagram;
  faLinkedin = faLinkedin;

  currentYear: number;
  isPrivacyPolicyOpen = false;

  constructor() {
    this.currentYear = new Date().getFullYear();
  }

  ngOnInit(): void {
    gsap.from('footer', { opacity: 0, y: 50, duration: 1, delay: 0.5 });
  }

  showPrivacyPolicy(event: Event): void {
    event.preventDefault();
    this.isPrivacyPolicyOpen = true;
  }

  onPrivacyPolicyClosed(): void {
    this.isPrivacyPolicyOpen = false;
  }
}