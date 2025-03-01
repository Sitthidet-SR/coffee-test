import { Component, AfterViewInit, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import gsap from 'gsap';
import { faTimes, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css'],
  standalone: true,
  imports: [FontAwesomeModule, CommonModule]
})
export class PrivacyPolicyComponent implements AfterViewInit {
  @ViewChild('privacyModal') privacyModal!: ElementRef;
  @Input() isOpen: boolean = false;
  @Output() closeModalEvent = new EventEmitter<void>();
  
  faTimes = faTimes;
  faClose = faClose;
  
  constructor() {}

  ngAfterViewInit() {
    if (this.isOpen) {
      this.animateFormElements();
    }
  }
  
  ngOnChanges(): void {
    if (this.isOpen) {
      setTimeout(() => {
        this.animateFormElements();
      }, 100);
    }
  }

  animateFormElements(): void {
    gsap.fromTo('.modal-container',
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
    );
  }

  closeModal(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    gsap.to('.modal-container', {
      opacity: 0, 
      scale: 0.8, 
      duration: 0.3, 
      onComplete: () => {
        this.isOpen = false;
        this.closeModalEvent.emit();
      }
    });
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
  
  acceptPolicy() {
    // บันทึกการยอมรับนโยบายใน localStorage
    localStorage.setItem('privacyPolicyAccepted', 'true');
    
    // แอนิเมชันสำหรับการยอมรับ
    gsap.to('.modal-container', {
      opacity: 0, 
      scale: 0.8, 
      duration: 0.3, 
      onComplete: () => {
        // ส่งอีเวนท์เพื่อแจ้งว่าได้มีการยอมรับนโยบายแล้ว
        const event = new CustomEvent('policyAccepted');
        window.dispatchEvent(event);
        this.isOpen = false;
        this.closeModalEvent.emit();
      }
    });
  }
}