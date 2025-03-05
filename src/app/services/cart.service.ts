import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, throwError, distinctUntilChanged, map } from 'rxjs';
import { AuthService } from './auth.service';
import Swal from 'sweetalert2';
import { tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  ratings: number;
  numReviews: number;
  [key: string]: any; // เพิ่มความยืดหยุ่นให้รองรับ properties อื่นๆ
}

// เพิ่ม Cart interface
interface Cart {
  items: CartItem[];
  userId?: string;
  _id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://13.239.242.215:5000/api';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();
  private isLoggedIn = false;

  // เพิ่ม EventEmitter สำหรับเปิด login modal
  openLoginModal = new EventEmitter<void>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    // แก้ไขการ subscribe เพื่อป้องกันการเรียกซ้ำ
    this.authService.isLoggedIn$.pipe(
      // เพิ่ม distinctUntilChanged เพื่อทำงานเฉพาะเมื่อค่าเปลี่ยน
      distinctUntilChanged()
    ).subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      if (loggedIn) {
        this.loadCart();
      } else {
        this.cartItemsSubject.next([]);
      }
    });
  }

  private loadCart(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // เพิ่ม console.log เพื่อติดตามการเรียก API
    console.debug('Fetching cart data...');

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<Cart>(`${this.apiUrl}/cart`, { headers }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return this.createNewCart();
        }
        return throwError(() => error);
      })
    ).subscribe({
      next: (response) => {
        if (response && Array.isArray(response.items)) {
          // แสดง log เฉพาะใน development mode
          if (!environment.production) {
            if (response.items.length === 0) {
              console.debug('ตะกร้าสินค้าว่างเปล่า');
            } else {
              console.debug(`พบสินค้าในตะกร้า ${response.items.length} รายการ`);
            }
          }
          
          const cartItems: CartItem[] = response.items.map((item: any) => {
            const product = item.product;
            
            let imageUrl = 'assets/images/default-product.jpg';
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
              imageUrl = product.images[0];
            }

            return {
              productId: product._id,
              quantity: item.quantity,
              name: product.name,
              price: product.price,
              image: imageUrl,
              description: product.description,
              category: product.category,
              ratings: product.ratings,
              numReviews: product.numReviews
            };
          });
          
          if (cartItems.length > 0) {
            console.log('รายการสินค้าในตะกร้า:', cartItems);
          }
          
          this.cartItemsSubject.next(cartItems);
        } else {
          console.log('ไม่พบข้อมูลตะกร้าสินค้าหรือข้อมูลไม่ถูกต้อง');
          this.cartItemsSubject.next([]);
        }
      },
      error: (error) => {
        console.error('Cart API Error:', error);
        if (error.status === 401) {
          this.handleAuthError();
        } else {
          Swal.fire({
            title: this.translate.instant('CART.ERROR.LOAD'),
            icon: 'error',
            confirmButtonText: this.translate.instant('COMMON.OK')
          });
        }
        this.cartItemsSubject.next([]);
      }
    });
  }

  private handleAuthError() {
    this.isLoggedIn = false;
    this.cartItemsSubject.next([]);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    Swal.fire({
      title: this.translate.instant('CART.ERROR.LOGIN_REQUIRED'),
      text: this.translate.instant('CART.ERROR.LOGIN_REQUIRED_TEXT'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('USER_MENU.LOGIN'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#f59e0b'
    }).then((result) => {
      if (result.isConfirmed) {
        this.openLoginModal.emit();
      }
    });
  }

  addToCart(product: any): Observable<any> {
    return new Observable(observer => {
      if (!this.isLoggedIn) {
        Swal.fire({
          title: this.translate.instant('CART.ERROR.LOGIN_REQUIRED'),
          text: this.translate.instant('CART.ERROR.LOGIN_REQUIRED_TEXT'),
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: this.translate.instant('USER_MENU.LOGIN'),
          cancelButtonText: this.translate.instant('COMMON.CANCEL'),
          confirmButtonColor: '#f59e0b'
        }).then((result) => {
          if (result.isConfirmed) {
            this.openLoginModal.emit();
            observer.error('login_required');
          } else {
            observer.error('cancelled');
          }
        });
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        this.handleAuthError();
        observer.error('auth_error');
        return;
      }

      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      const cartItem = {
        productId: product._id,
        quantity: 1
      };

      this.http.post(`${this.apiUrl}/cart`, cartItem, { headers }).subscribe({
        next: (response) => {
          this.loadCart();
          Swal.fire({
            title: this.translate.instant('CART.ADDED_SUCCESS'),
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          observer.next(response);
          observer.complete();
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.handleAuthError();
            observer.error('auth_error');
          } else {
            console.error('Error adding to cart:', error);
            Swal.fire({
              title: this.translate.instant('CART.ERROR.ADD'),
              icon: 'error',
              confirmButtonText: this.translate.instant('COMMON.OK')
            });
            observer.error(error);
          }
        }
      });
    });
  }

  getCartCount(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.length)
    );
  }

  updateQuantity(productId: string, quantity: number): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.handleAuthError();
      return new Observable(observer => observer.error('auth_error'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiUrl}/cart/${productId}`, { quantity }, { headers }).pipe(
      tap(() => {
        this.loadCart();
        Swal.fire({
          title: this.translate.instant('CART.UPDATE_SUCCESS'),
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      })
    );
  }

  removeFromCart(productId: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.handleAuthError();
      return new Observable(observer => observer.error('auth_error'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.apiUrl}/cart/${productId}`, { headers }).pipe(
      tap(() => {
        this.loadCart();
        Swal.fire({
          title: this.translate.instant('CART.REMOVE_SUCCESS'),
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      })
    );
  }

  private createNewCart() {
    return this.http.post<Cart>(`${this.apiUrl}/cart`, {});
  }
} 