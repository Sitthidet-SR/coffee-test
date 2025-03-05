import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { ApiService } from './api.service';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    address?: string;
    subdistrict?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
  profileImage?: string;
  role: string;
  isVerified: boolean;
}

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isAdminSubject = new BehaviorSubject<boolean>(false);

  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  user$ = this.userSubject.asObservable();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  isAdmin$ = this.user$.pipe(
    map(user => user?.role === 'admin')
  );

  constructor(private apiService: ApiService) {
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token) {
      this.isLoggedInSubject.next(true);
      this.isAuthenticatedSubject.next(true);
      if (userData) {
        const user = JSON.parse(userData);
        this.userSubject.next(user);
      }
      this.getProfile().subscribe();
    }
  }

  getProfile(): Observable<User> {
    return this.apiService.getProfile().pipe(
      tap(user => {
        if (typeof user.address === 'string') {
          try {
            user.address = JSON.parse(user.address);
          } catch (e) {
            user.address = {};
          }
        }
        this.userSubject.next(user);
        this.isLoggedInSubject.next(true);
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.apiService.login(credentials).pipe(
      tap(response => {
        if (response?.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('userData', JSON.stringify(response.user));
          this.isLoggedInSubject.next(true);
          this.isAuthenticatedSubject.next(true);
          this.userSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.isLoggedInSubject.next(false);
    this.isAdminSubject.next(false);
    this.userSubject.next(null);
  }

  isAdmin(): boolean {
    const user = this.userSubject.getValue();
    return user?.role === 'admin';
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    const payload: any = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone || ''
    };

    if (userData.address) {
      const cleanAddress = Object.entries(userData.address).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      if (Object.keys(cleanAddress).length > 0) {
        payload.address = JSON.stringify(cleanAddress);
      }
    }

    return this.apiService.updateProfile(payload).pipe(
      tap(updatedUser => {
        if (typeof updatedUser.address === 'string') {
          try {
            updatedUser.address = JSON.parse(updatedUser.address);
          } catch (e) {
            updatedUser.address = {};
          }
        }
        this.userSubject.next(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
      })
    );
  }

  uploadProfileImage(formData: FormData): Observable<any> {
    return this.apiService.uploadProfileImage(formData).pipe(
      tap(response => {
        const currentUser = this.userSubject.value;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            profileImage: response.profileImage
          };
          this.userSubject.next(updatedUser);
          localStorage.setItem('userData', JSON.stringify(updatedUser));
        }
      })
    );
  }

  removeProfileImage(): Observable<User> {
    return this.apiService.removeProfileImage().pipe(
      tap(user => {
        if (typeof user.address === 'string') {
          try {
            user.address = JSON.parse(user.address);
          } catch (e) {
            user.address = {};
          }
        }
        this.userSubject.next(user);
        localStorage.setItem('userData', JSON.stringify(user));
      })
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.apiService.changePassword(data);
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.apiService.resetPassword(token, newPassword);
  }

  forgotPassword(email: string): Observable<any> {
    const clientUrl = window.location.origin;
    return this.apiService.forgotPassword(email, `${clientUrl}/reset-password`);
  }

  updateAuthStatus(status: boolean): void {
    this.isAuthenticatedSubject.next(status);
    this.isLoggedInSubject.next(status);
  }

  updateUserData(user: User): void {
    this.userSubject.next(user);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  getUserData(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  requestPasswordReset(email: string): Observable<any> {
    const clientUrl = window.location.origin;
    return this.forgotPassword(email);
  }
} 