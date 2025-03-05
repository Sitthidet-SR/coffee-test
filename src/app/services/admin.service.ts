import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserStats } from '../interfaces/user.interface';
import { tap, catchError } from 'rxjs/operators';
import { Order } from '../interfaces/order.interface';
import { ReportData } from '../interfaces/report.interface';

// Define interfaces locally
interface Activity {
  type: 'USER_REGISTER' | 'NEW_ORDER' | 'PRODUCT_UPDATE' | 'USER_VERIFY';
  message: string;
  timestamp: Date;
  data?: any;
}

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: number;
}

interface SalesReport {
  today: number;
  thisWeek: number;
  thisMonth: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
}

interface TopProduct {
  name: string;
  totalQuantity: number;
  totalAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = 'http://13.239.242.215:5000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/admin/users`, {
      headers: this.getHeaders()
    });
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.API_URL}/admin/stats`, {
      headers: this.getHeaders()
    });
  }

  updateUserRole(userId: string, role: string): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/admin/users/${userId}/role`, { role }, {
      headers: this.getHeaders()
    });
  }

  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/admin/users/${userId}`, {
      headers: this.getHeaders()
    });
  }

  verifyUser(userId: string): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/admin/users/${userId}/verify`, {}, {
      headers: this.getHeaders()
    });
  }

  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/admin/users/${userId}`, userData, {
      headers: this.getHeaders()
    });
  }

  changeUserPassword(userId: string, newPassword: string): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/admin/users/${userId}/password`, 
      { newPassword }, 
      { headers: this.getHeaders() }
    );
  }

  uploadUserProfileImage(userId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profileImage', file);

    const token = localStorage.getItem('token');
    console.log('Using token:', token);

    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${token}`
    );

    const url = `${this.API_URL}/admin/users/${userId}/upload-profile`;
    console.log('Making request to:', url);

    return this.http.post<any>(url, formData, { headers }).pipe(
      tap(response => console.log('Upload response:', response)),
      catchError(error => {
        console.error('Upload error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          url: error.url
        });
        throw error;
      })
    );
  }

  getRecentActivities(page = 1, limit = 50): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.API_URL}/admin/activities`, {
      headers: this.getHeaders(),
      params: {
        page: page.toString(),
        limit: limit.toString()
      }
    });
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/admin/dashboard-stats`, {
      headers: this.getHeaders()
    });
  }

  getReports(): Observable<ReportData> {
    return this.http.get<ReportData>(`${this.API_URL}/admin/reports`, {
      headers: this.getHeaders()
    });
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/admin/orders`, {
      headers: this.getHeaders()
    });
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    return this.http.put<Order>(
      `${this.API_URL}/admin/orders/${orderId}/status`,
      { status },
      { headers: this.getHeaders() }
    );
  }

  deleteOrder(orderId: string): Observable<any> {
    return this.http.delete(
      `${this.API_URL}/admin/orders/${orderId}`,
      { headers: this.getHeaders() }
    );
  }

  updatePaymentStatus(orderId: string, status: string): Observable<Order> {
    return this.http.put<Order>(
      `${this.API_URL}/admin/orders/${orderId}/payment-status`,
      { status },
      { headers: this.getHeaders() }
    );
  }
} 