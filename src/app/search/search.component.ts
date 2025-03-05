import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faSpinner, faShoppingCart, faStar } from '@fortawesome/free-solid-svg-icons';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { HostListener } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <div class="search-container">
      <div class="search-box">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (input)="onSearchInput()"
          placeholder="ค้นหาเมนูกาแฟ..."
          class="search-input"
        />
        <button class="search-button">
          <fa-icon [icon]="faSearch"></fa-icon>
        </button>
      </div>
      
      <!-- ผลการค้นหา -->
      <div class="search-results" *ngIf="showResults">
        <div class="loading" *ngIf="isLoading">
          <fa-icon [icon]="faSpinner" [spin]="true"></fa-icon>
        </div>
        
        <div class="no-results" *ngIf="!isLoading && results.length === 0 && searchTerm">
          ไม่พบผลการค้นหา
        </div>

        <div class="results-list" *ngIf="!isLoading && results.length > 0">
          <div class="result-item" *ngFor="let item of results">
            <div class="result-image-container" (click)="selectItem(item)">
              <img [src]="getImageUrl(item.images)" [alt]="item.name" class="result-image">
            </div>
            <div class="result-main-info" (click)="selectItem(item)">
              <h4>{{item.name}}</h4>
              <p class="description">{{item.description | slice:0:80}}{{item.description.length > 80 ? '...' : ''}}</p>
            </div>
            <div class="result-side-info">
              <div class="rating">
                <fa-icon [icon]="faStar" class="star-icon"></fa-icon>
                <span>{{item.ratings.toFixed(1)}} ({{item.numReviews}})</span>
              </div>
              <div class="price">฿{{item.price}}</div>
            </div>
            <button class="add-to-cart-btn" (click)="addToCart(item, $event)">
              <fa-icon [icon]="faShoppingCart"></fa-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      position: relative;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: white;
      border-radius: 25px;
      padding: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .search-input {
      flex: 1;
      border: none;
      padding: 10px 15px;
      font-size: 16px;
      outline: none;
      border-radius: 25px;
    }

    .search-button {
      background: #4A2C2A;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 20px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .search-button:hover {
      background: #6B3F3A;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border-radius: 12px;
      margin-top: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      z-index: 1000;
      max-height: 400px;
      overflow-y: auto;
      padding: 10px;
    }

    .loading {
      padding: 20px;
      text-align: center;
      color: #666;
    }

    .no-results {
      padding: 20px;
      text-align: center;
      color: #666;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .result-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px;
      background: white;
      border-radius: 10px;
      transition: all 0.3s ease;
      border: 1px solid #eee;
    }

    .result-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      border-color: #F59E0B;
    }

    .result-image-container {
      flex-shrink: 0;
      cursor: pointer;
    }

    .result-image {
      width: 70px;
      height: 70px;
      object-fit: cover;
      border-radius: 8px;
      transition: transform 0.3s ease;
    }

    .result-main-info {
      flex: 1;
      cursor: pointer;
      min-width: 0;
      padding-right: 15px;
    }

    .result-main-info h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #4A2C2A;
      margin-bottom: 6px;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .description {
      font-size: 0.9rem;
      color: #666;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .result-side-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      min-width: 120px;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.9rem;
      color: #666;
      background: #FEF3C7;
      padding: 4px 8px;
      border-radius: 20px;
    }

    .star-icon {
      color: #F59E0B;
    }

    .price {
      font-weight: 600;
      color: #F59E0B;
      font-size: 1.1rem;
    }

    .add-to-cart-btn {
      background: #4A2C2A;
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .add-to-cart-btn:hover {
      background: #6B3F3A;
      transform: scale(1.1);
    }

    .add-to-cart-btn:active {
      transform: scale(1);
    }

    .add-to-cart-btn.added {
      background: #15803d;
    }

    @media (max-width: 640px) {
      .result-main-info {
        padding-right: 8px;
      }

      .result-side-info {
        min-width: 90px;
      }

      .rating {
        font-size: 0.8rem;
        padding: 3px 6px;
      }

      .description {
        -webkit-line-clamp: 1;
      }
    }
  `]
})
export class SearchComponent implements OnInit {
  searchTerm: string = '';
  results: any[] = [];
  isLoading: boolean = false;
  showResults: boolean = false;
  faSearch = faSearch;
  faSpinner = faSpinner;
  faShoppingCart = faShoppingCart;
  faStar = faStar;

  private searchSubject = new Subject<string>();
  private readonly API_URL = 'http://13.239.242.215:5000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.performSearch(term);
    });
  }

  onSearchInput() {
    this.showResults = true;
    this.searchSubject.next(this.searchTerm);
  }

  getImageUrl(images: string[]): string {
    if (!images || images.length === 0) {
      return 'assets/images/placeholder.png';
    }
    
    const image = images[0];
    if (image.startsWith('http')) {
      return image;
    }
    
    if (image.startsWith('assets/')) {
      return image;
    }
    
    return `http://13.239.242.215:5000/${image}`;
  }

  performSearch(term: string) {
    if (!term.trim()) {
      this.results = [];
      this.showResults = false;
      return;
    }

    this.isLoading = true;
    this.showResults = true;
    
    this.http.get<any[]>(`${this.API_URL}/products`, {
      params: {
        search: term,
        limit: '10'
      }
    }).subscribe({
      next: (data) => {
        this.results = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.isLoading = false;
        this.results = [];
      }
    });
  }

  selectItem(item: any) {
    this.router.navigate(['/product', item._id]);
    this.showResults = false;
    this.searchTerm = '';
  }

  addToCart(product: any, event: Event) {
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    
    button.classList.add('added');
    
    this.cartService.addToCart(product).subscribe({
      next: () => {
        setTimeout(() => {
          button.classList.remove('added');
        }, 2000);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        button.classList.remove('added');
      }
    });
  }

  // ปิดผลการค้นหาเมื่อคลิกนอกกล่อง
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!(event.target as HTMLElement).closest('.search-container')) {
      this.showResults = false;
    }
  }
} 