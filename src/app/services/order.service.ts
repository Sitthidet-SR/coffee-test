import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../interfaces/order.interface';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly API_URL = 'http://13.239.242.215:5000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/orders`, {
      headers: this.getHeaders()
    });
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/orders/${id}`, {
      headers: this.getHeaders()
    });
  }

  updatePaymentStatus(orderId: string, status?: string): Observable<Order> {
    const url = status 
      ? `${this.API_URL}/orders/${orderId}/pay` 
      : `${this.API_URL}/orders/${orderId}/pay`;
    const body = status ? { status } : {};
    return this.http.put<Order>(url, body, {
      headers: this.getHeaders()
    });
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.API_URL}/orders/${orderId}/deliver`, { status }, {
      headers: this.getHeaders()
    });
  }

  deleteOrder(orderId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/orders/${orderId}`, {
      headers: this.getHeaders()
    });
  }

  createOrder(orderData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/orders`, orderData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Order service error:', error);
        throw error;
      })
    );
  }

  getMyOrders(): Observable<any> {
    return this.http.get(`${this.API_URL}/orders/my-orders`, {
      headers: this.getHeaders()
    });
  }
} 