import { Component, AfterViewInit, ElementRef, ViewChild, Input, Output, EventEmitter, Renderer2, Inject } from '@angular/core';
import gsap from 'gsap';
import { faTimes, faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';

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
  private modalRef: any;
  
  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngAfterViewInit() {
    this.moveModalToBody();
    
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
  
  ngOnDestroy(): void {
    if (this.modalRef && this.document.body.contains(this.modalRef)) {
      this.document.body.removeChild(this.modalRef);
    }
  }

  moveModalToBody(): void {
    setTimeout(() => {
      const modalElement = this.document.querySelector('app-privacy-policy > .modal-backdrop');
      if (modalElement && !this.modalRef) {
        this.modalRef = modalElement.cloneNode(true);
        
        this.document.body.appendChild(this.modalRef);
        
        modalElement.parentNode?.removeChild(modalElement);
        
        this.setupEventListeners();
      }
    }, 0);
  }
  
  setupEventListeners(): void {
    this.modalRef.addEventListener('click', (e: Event) => {
      if (e.target === this.modalRef) {
        this.closeModal();
      }
    });
    
    const closeButtons = this.modalRef.querySelectorAll('button');
    closeButtons.forEach((button: HTMLButtonElement) => {
      if (button.textContent?.includes('ปิด') || button.innerHTML.includes('faClose')) {
        button.addEventListener('click', () => this.closeModal());
      }
    });
    
    const acceptButton = this.modalRef.querySelector('button.bg-amber-600');
    if (acceptButton) {
      acceptButton.addEventListener('click', () => this.acceptPolicy());
    }
  }

  animateFormElements(): void {
    if (!this.modalRef) return;
    
    const modalContainer = this.modalRef.querySelector('.modal-container');
    if (modalContainer) {
      this.modalRef.style.display = 'flex';
      
      gsap.fromTo(modalContainer,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }

  closeModal(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    
    if (!this.modalRef) return;
    
    const modalContainer = this.modalRef.querySelector('.modal-container');
    if (modalContainer) {
      gsap.to(modalContainer, {
        opacity: 0, 
        scale: 0.8, 
        duration: 0.3, 
        onComplete: () => {
          this.modalRef.style.display = 'none';
          this.isOpen = false;
          this.closeModalEvent.emit();
        }
      });
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
  
  acceptPolicy() {
    // บันทึกการยอมรับนโยบายใน localStorage
    localStorage.setItem('privacyPolicyAccepted', 'true');
    
    if (!this.modalRef) return;
    
    const modalContainer = this.modalRef.querySelector('.modal-container');
    if (modalContainer) {
      // แอนิเมชันสำหรับการยอมรับ
      gsap.to(modalContainer, {
        opacity: 0, 
        scale: 0.8, 
        duration: 0.3, 
        onComplete: () => {
          this.modalRef.style.display = 'none';
          
          // ส่งอีเวนท์เพื่อแจ้งว่าได้มีการยอมรับนโยบายแล้ว
          const event = new CustomEvent('policyAccepted');
          window.dispatchEvent(event);
          
          this.isOpen = false;
          this.closeModalEvent.emit();
        }
      });
    }
  }
}