import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OrderService } from '../services/order.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faCheck, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NavbarComponent,
    FooterComponent,
    RouterModule,
    FontAwesomeModule
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="min-h-screen bg-[#fff8ee] pt-20">
      <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold mb-8 text-gray-800">{{ 'ORDERS.TITLE' | translate }}</h1>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>

        <!-- Error State -->
        <div *ngIf="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {{ error }}
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && !error && (!orders || orders.length === 0)" 
          class="text-center py-8">
          <p class="text-gray-600">{{ 'ORDERS.NO_ORDERS' | translate }}</p>
          <a routerLink="/" 
            class="inline-block mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
            {{ 'ORDERS.START_SHOPPING' | translate }}
          </a>
        </div>

        <!-- Orders List -->
        <div *ngIf="!loading && !error && orders && orders.length > 0" 
          class="space-y-6">
          <div *ngFor="let order of orders" 
            class="bg-white rounded-lg shadow-lg overflow-hidden">
            <!-- Order Header -->
            <div class="p-6 border-b border-gray-100">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm text-gray-500">{{ 'ORDERS.ORDER_ID' | translate }}: #{{order._id}}</p>
                  <p class="text-sm text-gray-500">
                    {{ 'ORDERS.ORDERED_ON' | translate }}: {{order.createdAt | date:'medium'}}
                  </p>
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-lg font-semibold text-amber-600">
                    ฿{{order.totalAmount}}
                  </span>
                  <div class="flex items-center mt-2">
                    <!-- Payment Status -->
                    <span [ngClass]="{
                      'bg-green-100 text-green-800': order.paymentStatus === 'paid',
                      'bg-yellow-100 text-yellow-800': order.paymentStatus === 'pending',
                      'bg-red-100 text-red-800': order.paymentStatus === 'failed'
                    }" class="px-3 py-1 rounded-full text-sm">
                      <fa-icon [icon]="getStatusIcon(order.paymentStatus)" class="mr-1"></fa-icon>
                      {{ 'ORDERS.PAYMENT_STATUS.' + order.paymentStatus.toUpperCase() | translate }}
                    </span>
                    <!-- Order Status -->
                    <span [ngClass]="{
                      'bg-green-100 text-green-800': order.orderStatus === 'completed',
                      'bg-blue-100 text-blue-800': order.orderStatus === 'processing',
                      'bg-yellow-100 text-yellow-800': order.orderStatus === 'pending',
                      'bg-red-100 text-red-800': order.orderStatus === 'cancelled'
                    }" class="px-3 py-1 rounded-full text-sm ml-2">
                      <fa-icon [icon]="getStatusIcon(order.orderStatus)" class="mr-1"></fa-icon>
                      {{ 'ORDERS.ORDER_STATUS.' + order.orderStatus.toUpperCase() | translate }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Items -->
            <div class="p-6">
              <div *ngFor="let item of order.items" class="flex items-center py-4 border-b last:border-0">
                <img [src]="item.product.images[0]" [alt]="item.product.name" 
                  class="w-16 h-16 object-cover rounded-lg">
                <div class="ml-4 flex-grow">
                  <h3 class="font-medium">{{item.product.name}}</h3>
                  <p class="text-sm text-gray-500">
                    {{ 'ORDERS.QUANTITY' | translate }}: {{item.quantity}} x ฿{{item.price}}
                  </p>
                </div>
                <span class="font-medium text-amber-600">
                  ฿{{item.quantity * item.price}}
                </span>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="px-6 py-4 bg-gray-50">
              <p class="text-sm text-gray-600">
                {{ 'ORDERS.PAYMENT_METHOD' | translate }}: 
                {{ 'ORDERS.PAYMENT_METHODS.' + order.paymentMethod.toUpperCase() | translate }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #fff8ee;
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  loading = true;
  error: string | null = null;

  // Icons
  faClock = faClock;
  faCheck = faCheck;
  faTimes = faTimes;
  faSpinner = faSpinner;

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.error = null;

    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.error = 'Failed to load orders';
        this.loading = false;
      }
    });
  }

  getStatusIcon(status: string) {
    switch (status) {
      case 'paid':
      case 'completed':
        return this.faCheck;
      case 'pending':
      case 'processing':
        return this.faSpinner;
      case 'failed':
      case 'cancelled':
        return this.faTimes;
      default:
        return this.faClock;
    }
  }
} 