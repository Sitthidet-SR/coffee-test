import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCreditCard, faMoneyBill, faQrcode } from '@fortawesome/free-solid-svg-icons';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { OrderService } from '../services/order.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TranslateModule, 
    FontAwesomeModule,
    NavbarComponent,
    FooterComponent
  ],
  template: `
    <app-navbar></app-navbar>
    <div class="min-h-screen bg-[#fff8ee] pt-20">
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-3xl font-bold mb-8 text-gray-800">{{ 'CHECKOUT.TITLE' | translate }}</h1>

          <!-- Order Summary -->
          <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 class="text-xl font-semibold mb-4 text-gray-800">{{ 'CHECKOUT.ORDER_SUMMARY' | translate }}</h2>
            <div class="space-y-4">
              <div *ngFor="let item of cartItems" 
                class="flex items-center justify-between border-b border-gray-100 pb-4 hover:bg-gray-50 transition-colors duration-200 p-2 rounded">
                <div class="flex items-center space-x-4">
                  <img [src]="item.image" [alt]="item.name" 
                    class="w-16 h-16 object-cover rounded-lg shadow-sm">
                  <div>
                    <h3 class="font-medium text-gray-800">{{item.name}}</h3>
                    <p class="text-gray-500">{{ 'CHECKOUT.QUANTITY' | translate }}: {{item.quantity}}</p>
                  </div>
                </div>
                <span class="font-medium text-amber-600">฿{{item.price * item.quantity}}</span>
              </div>
            </div>
            <div class="mt-6 pt-4 border-t border-gray-100">
              <div class="flex justify-between items-center text-lg font-semibold">
                <span class="text-gray-800">{{ 'CHECKOUT.TOTAL' | translate }}</span>
                <span class="text-amber-600">฿{{total}}</span>
              </div>
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 class="text-xl font-semibold mb-4 text-gray-800">{{ 'CHECKOUT.PAYMENT_METHOD' | translate }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                (click)="selectPaymentMethod('credit')"
                [class.bg-amber-50]="selectedPaymentMethod === 'credit'"
                [class.border-amber-500]="selectedPaymentMethod === 'credit'"
                class="p-4 border rounded-lg hover:border-amber-500 transition-all duration-200 flex flex-col items-center hover:shadow-md">
                <fa-icon [icon]="faCreditCard" class="text-2xl mb-2 text-amber-600"></fa-icon>
                <span class="text-gray-700">{{ 'CHECKOUT.CREDIT_CARD' | translate }}</span>
              </button>
              
              <button 
                (click)="selectPaymentMethod('promptpay')"
                [class.bg-amber-50]="selectedPaymentMethod === 'promptpay'"
                [class.border-amber-500]="selectedPaymentMethod === 'promptpay'"
                class="p-4 border rounded-lg hover:border-amber-500 transition-all duration-200 flex flex-col items-center hover:shadow-md">
                <fa-icon [icon]="faQrcode" class="text-2xl mb-2 text-amber-600"></fa-icon>
                <span class="text-gray-700">PromptPay</span>
              </button>

              <button 
                (click)="selectPaymentMethod('cash')"
                [class.bg-amber-50]="selectedPaymentMethod === 'cash'"
                [class.border-amber-500]="selectedPaymentMethod === 'cash'"
                class="p-4 border rounded-lg hover:border-amber-500 transition-all duration-200 flex flex-col items-center hover:shadow-md">
                <fa-icon [icon]="faMoneyBill" class="text-2xl mb-2 text-amber-600"></fa-icon>
                <span class="text-gray-700">{{ 'CHECKOUT.CASH' | translate }}</span>
              </button>
            </div>
          </div>

          <!-- Proceed Button -->
          <button 
            (click)="proceedToPayment()"
            [disabled]="!selectedPaymentMethod"
            class="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
            {{ 'CHECKOUT.PROCEED_TO_PAYMENT' | translate }}
          </button>
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
export class CheckoutComponent implements OnInit {
  cartItems: any[] = [];
  total: number = 0;
  selectedPaymentMethod: string = '';
  
  // Font Awesome icons
  faCreditCard = faCreditCard;
  faMoneyBill = faMoneyBill;
  faQrcode = faQrcode;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotal();
    });
  }

  calculateTotal() {
    this.total = this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  selectPaymentMethod(method: string) {
    this.selectedPaymentMethod = method;
  }

  async proceedToPayment() {
    if (!this.selectedPaymentMethod) return;

    try {
      const orderData = {
        paymentMethod: this.selectedPaymentMethod,
        shippingAddress: {
          address: "123 Test St",
          city: "Bangkok",
          postalCode: "10100",
          country: "Thailand"
        }
      };

      const response = await this.orderService.createOrder(orderData).toPromise();

      // เพิ่มการแจ้งเตือนสำเร็จ
      const successNotification = () => {
        Swal.fire({
          icon: 'success',
          title: this.translate.instant('ORDER.SUCCESS'),
          text: this.translate.instant('ORDER.CREATED_SUCCESS'),
          confirmButtonText: this.translate.instant('COMMON.VIEW_ORDERS'),
          confirmButtonColor: '#f59e0b',
          showCancelButton: true,
          cancelButtonText: this.translate.instant('COMMON.CONTINUE_SHOPPING'),
          cancelButtonColor: '#4B5563'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/orders']);
          } else {
            this.router.navigate(['/']);
          }
        });
      };

      if (this.selectedPaymentMethod === 'credit') {
        if (!response.clientSecret) {
          throw new Error('Payment processing not available');
        }
        await this.handleCreditCardPayment(response.clientSecret);
        successNotification();
      } 
      else if (this.selectedPaymentMethod === 'promptpay') {
        Swal.fire({
          title: this.translate.instant('ORDER.PROMPTPAY.TITLE'),
          html: `
            <div class="flex flex-col items-center">
              <img src="${response.qrCode}" alt="PromptPay QR Code" class="mx-auto mb-4 w-64 h-64">
              <p class="text-lg mb-2">${this.translate.instant('ORDER.PROMPTPAY.SCAN_MESSAGE')}</p>
              <p class="text-2xl font-bold text-amber-600">฿${this.total.toFixed(2)}</p>
              <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600">${this.translate.instant('ORDER.PROMPTPAY.INSTRUCTION')}</p>
              </div>
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: this.translate.instant('ORDER.PROMPTPAY.PAID_BUTTON'),
          confirmButtonColor: '#f59e0b',
          showCancelButton: true,
          cancelButtonText: this.translate.instant('COMMON.CANCEL'),
          cancelButtonColor: '#4B5563'
        }).then((result) => {
          if (result.isConfirmed) {
            // อัพเดทสถานะการชำระเงิน
            this.orderService.updatePaymentStatus(response.order._id).subscribe({
              next: () => successNotification(),
              error: (error) => {
                console.error('Payment status update error:', error);
                Swal.fire({
                  icon: 'error',
                  title: this.translate.instant('ORDER.ERROR.PAYMENT_UPDATE'),
                  text: this.translate.instant('ORDER.ERROR.TRY_AGAIN'),
                  confirmButtonText: this.translate.instant('COMMON.OK'),
                  confirmButtonColor: '#f59e0b'
                });
              }
            });
          }
        });
      }
      else {
        // เงินสด
        Swal.fire({
          icon: 'success',
          title: this.translate.instant('ORDER.SUCCESS'),
          text: this.translate.instant('ORDER.CASH_MESSAGE'),
          confirmButtonText: this.translate.instant('COMMON.VIEW_ORDERS'),
          confirmButtonColor: '#f59e0b',
          showCancelButton: true,
          cancelButtonText: this.translate.instant('COMMON.CONTINUE_SHOPPING'),
          cancelButtonColor: '#4B5563'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/orders']);
          } else {
            this.router.navigate(['/']);
          }
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      let errorMessage = this.translate.instant('ORDER.ERROR.CREATE');
      if (error && typeof error === 'object' && 'error' in error) {
        const apiError = error as { error?: { message?: string } };
        if (apiError.error?.message) {
          errorMessage = apiError.error.message;
        }
      }

      Swal.fire({
        icon: 'error',
        title: this.translate.instant('ORDER.ERROR.CREATE'),
        text: errorMessage,
        confirmButtonText: this.translate.instant('COMMON.OK'),
        confirmButtonColor: '#f59e0b'
      });
    }
  }

  private async handleCreditCardPayment(clientSecret: string) {
    // ใช้ Stripe Elements สำหรับการชำระเงินด้วยบัตร
    // จะเพิ่มโค้ดส่วนนี้เมื่อต้องการรองรับการชำระด้วยบัตรจริง
  }
} 