import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, UploadResponse } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = 'http://13.239.242.215:5000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // อัพโหลดรูปภาพ
  uploadImages(formData: FormData): Observable<UploadResponse> {
    return this.http.post<UploadResponse>(`${this.API_URL}/products/upload-images`, formData, {
      headers: this.getHeaders()
    });
  }

  // เพิ่มสินค้า
  addProduct(productData: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.API_URL}/products`, productData, {
      headers: this.getHeaders()
    });
  }

  // ดึงสินค้าทั้งหมด
  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/products`);
  }

  // ดึงสินค้าเดี่ยว
  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/products/${id}`);
  }

  // อัพเดทสินค้า
  updateProduct(id: string, productData: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/products/${id}`, productData, {
      headers: this.getHeaders()
    });
  }

  // ลบสินค้า
  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/products/${id}`, {
      headers: this.getHeaders()
    });
  }
} 