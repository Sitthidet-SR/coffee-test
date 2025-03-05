import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, TimeoutError, map } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return throwError(() => new Error('เกิดข้อผิดพลาด: ' + error.error.message));
    } else {
      // Server-side error
      if (error.status === 0) {
        return throwError(() => new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'));
      }
      if (error.status === 400 && error.error?.message?.includes('email')) {
        return throwError(() => new Error('อีเมลนี้ถูกใช้งานแล้ว'));
      }
      return throwError(() => new Error(error.error?.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์'));
    }
  }

  // Auth endpoints
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/login`, credentials)
      .pipe(catchError(this.handleError));
  }

  register(formData: FormData): Observable<any> {
    console.log('API URL:', `${this.apiUrl}/users/register`);
    console.log('FormData being sent:', Object.fromEntries(formData.entries()));
    
    // ไม่ต้องกำหนด Content-Type เพราะ FormData จะจัดการให้เอง
    const requestOptions = {
      withCredentials: true
    };

    // เพิ่มการตรวจสอบการเชื่อมต่อ
    return new Observable(observer => {
      // ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
      if (!navigator.onLine) {
        observer.error(new Error('กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'));
        return;
      }

      // ตรวจสอบข้อมูลที่จำเป็น
      const formDataEntries = Object.fromEntries(formData.entries());
      if (!formDataEntries['name'] || !formDataEntries['email'] || !formDataEntries['password']) {
        observer.error(new Error('กรุณากรอกข้อมูลให้ครบถ้วน'));
        return;
      }

      this.http.post(`${this.apiUrl}/users/register`, formData, requestOptions)
        .pipe(
          timeout(60000), // 60 วินาที
          catchError((error: unknown) => {
            console.error('Registration error:', error);
            
            if (error instanceof TimeoutError) {
              return throwError(() => new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง'));
            }
            
            if (error instanceof HttpErrorResponse) {
              if (error.status === 0) {
                return throwError(() => new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'));
              }
              
              if (error.status === 400) {
                const message = error.error?.message;
                if (message?.includes('email')) {
                  return throwError(() => new Error('อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น'));
                }
                return throwError(() => new Error(message || 'ข้อมูลไม่ถูกต้อง'));
              }
              
              if (error.status === 413) {
                return throwError(() => new Error('ขนาดรูปภาพใหญ่เกินไป กรุณาลดขนาดรูปภาพและลองใหม่อีกครั้ง'));
              }

              if (error.status === 500) {
                return throwError(() => new Error('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้งในภายหลัง'));
              }

              return throwError(() => new Error(error.error?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน'));
            }
            
            return throwError(() => new Error('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง'));
          })
        )
        .subscribe({
          next: (response) => observer.next(response),
          error: (error) => observer.error(error),
          complete: () => observer.complete()
        });
    });
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`, { headers: this.getHeaders() });
  }

  updateProfile(userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/update`, userData, {
      headers: this.getHeaders()
    });
  }

  uploadProfileImage(formData: FormData): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
    return this.http.post(`${this.apiUrl}/users/upload-profile`, formData, { headers });
  }

  removeProfileImage(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/remove-profile`, {
      headers: this.getHeaders()
    });
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/change-password`, data, {
      headers: this.getHeaders()
    });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/reset-password`, { token, newPassword });
  }

  forgotPassword(email: string, resetUrl: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/forgot-password`, { email, resetUrl });
  }

  // Products endpoints
  getProducts(params?: any): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`, { params });
  }

  getTopProducts(): Observable<Product[]> {
    return this.getProducts({
      sort: 'ratings:desc',
      limit: '10'
    });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  // Cart endpoints
  getCart(): Observable<any> {
    return this.http.get(`${this.apiUrl}/cart`, {
      headers: this.getHeaders()
    });
  }

  addToCart(productId: string, quantity: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cart`, { productId, quantity }, {
      headers: this.getHeaders()
    });
  }

  updateCartItem(itemId: string, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/cart/${itemId}`, { quantity }, {
      headers: this.getHeaders()
    });
  }

  removeFromCart(itemId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cart/${itemId}`, {
      headers: this.getHeaders()
    });
  }

  clearCart(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cart`, {
      headers: this.getHeaders()
    });
  }

  post(endpoint: string, data: any) {
    return this.http.post<any>(`${this.apiUrl}${endpoint}`, data);
  }
} 