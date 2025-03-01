import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import axios from 'axios';
import { gsap } from 'gsap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faShoppingCart, faHeart } from '@fortawesome/free-solid-svg-icons';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FontAwesomeModule],
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent implements OnInit {
  products: Product[] = [];
  loading: boolean = true;
  error: string | null = null;
  faShoppingCart = faShoppingCart;
  faHeart = faHeart;
  apiUrl = 'http://localhost:5000/api/products';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProducts();
  }

  fetchProducts(): void {
    this.loading = true;
    
    axios.get(this.apiUrl)
      .then(response => {
        this.products = response.data;
        this.loading = false;
        
        // GSAP animation after products are loaded
        setTimeout(() => {
          this.animateProducts();
        }, 100);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        this.error = 'Failed to load products. Please try again later.';
        this.loading = false;
      });
  }
  getImageUrl(imagePath: string): string {
    if (!imagePath) return 'assets/images/placeholder.png';
    
    // ตรวจสอบว่าพาธเริ่มต้นด้วย http หรือไม่
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // เพิ่ม base URL
    return 'http://localhost:5000/' + imagePath;
  }
  // Method to add product to cart
  addToCart(product: Product, event: MouseEvent): void {
    event.stopPropagation();
    
    // Animation for the button click
    gsap.to(event.currentTarget, {
      scale: 0.9,
      duration: 0.1,
      onComplete: () => {
        gsap.to(event.currentTarget, {
          scale: 1,
          duration: 0.1
        });
      }
    });

    // Here you would implement your cart logic
    console.log('Adding to cart:', product);
    
    // Animation for success feedback
    const button = event.currentTarget as HTMLElement;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Added';
    
    setTimeout(() => {
      button.innerHTML = originalText;
    }, 1000);
  }

  // Method to format price as Thai Baht
  formatPrice(price: number): string {
    return '฿' + price.toFixed(2);
  }

  // GSAP animation for products
  animateProducts(): void {
    gsap.from('.product-card', {
      y: 50,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out'
    });
  }
}