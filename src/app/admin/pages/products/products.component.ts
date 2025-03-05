import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ProductService } from '../../../services/product.service';
import { Product, UploadResponse } from '../../../interfaces/product.interface';
import Swal from 'sweetalert2';
import { map, catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">จัดการสินค้า</h2>
        <button (click)="openAddProductModal()" 
                class="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 flex items-center gap-2">
          <fa-icon [icon]="faPlus"></fa-icon> เพิ่มสินค้า
        </button>
      </div>

      <!-- ตารางสินค้า -->
      <div class="bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รูป</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อสินค้า</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ราคา</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">หมวดหมู่</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr *ngFor="let product of products" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <img [src]="product.images[0]" class="h-16 w-16 object-cover rounded">
              </td>
              <td class="px-6 py-4">{{product.name}}</td>
              <td class="px-6 py-4">฿{{product.price}}</td>
              <td class="px-6 py-4">{{product.category}}</td>
              <td class="px-6 py-4">
                <span [class]="product.isActive ? 'text-green-600' : 'text-red-600'">
                  {{product.isActive ? 'พร้อมขาย' : 'ปิดการขาย'}}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex gap-3">
                  <button (click)="editProduct(product)" class="text-amber-600 hover:text-amber-900">
                    <fa-icon [icon]="faEdit"></fa-icon>
                  </button>
                  <button (click)="deleteProduct(product._id)" class="text-red-600 hover:text-red-900">
                    <fa-icon [icon]="faTrash"></fa-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (data: Product[]) => {
        this.products = data;
      },
      error: (error: Error) => {
        console.error('Error loading products:', error);
        Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลสินค้าได้', 'error');
      }
    });
  }

  async openAddProductModal(): Promise<void> {
    try {
      const result = await Swal.fire({
        title: 'เพิ่มสินค้าใหม่',
        html: `
          <input id="name" class="swal2-input" placeholder="ชื่อสินค้า" required>
          <textarea id="description" class="swal2-textarea" placeholder="รายละเอียดสินค้า" required></textarea>
          <input id="price" type="number" class="swal2-input" placeholder="ราคา" required>
          <input id="stock" type="number" class="swal2-input" placeholder="จำนวนในสต็อก" required>
          <select id="category" class="swal2-select" required>
            <option value="">เลือกหมวดหมู่</option>
            <option value="coffee">กาแฟ</option>
            <option value="tea">ชา</option>
            <option value="dessert">ขนม</option>
            <option value="other">อื่นๆ</option>
          </select>
          <input id="productImages" type="file" class="swal2-file" multiple accept="image/*" required>
        `,
        showCancelButton: true,
        confirmButtonText: 'เพิ่มสินค้า',
        cancelButtonText: 'ยกเลิก',
        preConfirm: async () => {
          const name = (document.getElementById('name') as HTMLInputElement).value;
          const description = (document.getElementById('description') as HTMLTextAreaElement).value;
          const price = Number((document.getElementById('price') as HTMLInputElement).value);
          const stock = Number((document.getElementById('stock') as HTMLInputElement).value);
          const category = (document.getElementById('category') as HTMLSelectElement).value;
          const images = document.getElementById('productImages') as HTMLInputElement;

          // Validation
          if (!name || !description || !price || !stock || !category || !images.files?.length) {
            Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
            return false;
          }

          if (!['coffee', 'tea', 'dessert', 'other'].includes(category)) {
            Swal.showValidationMessage('หมวดหมู่ไม่ถูกต้อง');
            return false;
          }

          const formData = new FormData();
          for (let i = 0; i < images.files.length; i++) {
            formData.append('productImages', images.files[i]);
          }

          try {
            const uploadResponse = await firstValueFrom(this.productService.uploadImages(formData));
            const productData: Partial<Product> = {
              name,
              description,
              price,
              stock,
              category: category as Product['category'],
              images: uploadResponse.images,
              isActive: true
            };
            
            return await firstValueFrom(this.productService.addProduct(productData));
          } catch (error) {
            Swal.showValidationMessage(`Request failed: ${error}`);
            return false;
          }
        }
      });

      if (result.isConfirmed && result.value) {
        this.loadProducts();
        Swal.fire('สำเร็จ', 'เพิ่มสินค้าเรียบร้อยแล้ว', 'success');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      Swal.fire('Error', 'ไม่สามารถเพิ่มสินค้าได้', 'error');
    }
  }

  async editProduct(product: Product): Promise<void> {
    try {
      const result = await Swal.fire({
        title: 'แก้ไขสินค้า',
        html: `
          <input id="name" class="swal2-input" value="${product.name}" placeholder="ชื่อสินค้า" required>
          <textarea id="description" class="swal2-textarea" placeholder="รายละเอียดสินค้า">${product.description}</textarea>
          <input id="price" type="number" class="swal2-input" value="${product.price}" placeholder="ราคา" required>
          <input id="stock" type="number" class="swal2-input" value="${product.stock}" placeholder="จำนวนในสต็อก" required>
          <select id="category" class="swal2-select" required>
            <option value="coffee" ${product.category === 'coffee' ? 'selected' : ''}>กาแฟ</option>
            <option value="tea" ${product.category === 'tea' ? 'selected' : ''}>ชา</option>
            <option value="dessert" ${product.category === 'dessert' ? 'selected' : ''}>ขนม</option>
            <option value="other" ${product.category === 'other' ? 'selected' : ''}>อื่นๆ</option>
          </select>
          <input id="productImages" type="file" class="swal2-file" multiple accept="image/*">
        `,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
        preConfirm: async () => {
          const name = (document.getElementById('name') as HTMLInputElement).value;
          const description = (document.getElementById('description') as HTMLTextAreaElement).value;
          const price = Number((document.getElementById('price') as HTMLInputElement).value);
          const stock = Number((document.getElementById('stock') as HTMLInputElement).value);
          const category = (document.getElementById('category') as HTMLSelectElement).value;
          const images = document.getElementById('productImages') as HTMLInputElement;

          if (!name || !description || !price || !stock || !category) {
            Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
            return false;
          }

          let imageUrls = product.images;

          if (images.files && images.files.length > 0) {
            const formData = new FormData();
            for (let i = 0; i < images.files.length; i++) {
              formData.append('productImages', images.files[i]);
            }
            const uploadResponse = await firstValueFrom(this.productService.uploadImages(formData));
            imageUrls = uploadResponse.images;
          }

          const updatedData: Partial<Product> = {
            name,
            description,
            price,
            stock,
            category: category as Product['category'],
            images: imageUrls
          };

          return await firstValueFrom(this.productService.updateProduct(product._id, updatedData));
        }
      });

      if (result.isConfirmed && result.value) {
        this.loadProducts();
        Swal.fire('สำเร็จ', 'อัพเดทสินค้าเรียบร้อยแล้ว', 'success');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      Swal.fire('Error', 'ไม่สามารถอัพเดทสินค้าได้', 'error');
    }
  }

  deleteProduct(productId: string) {
    Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.deleteProduct(productId).subscribe({
          next: () => {
            this.products = this.products.filter(p => p._id !== productId);
            Swal.fire('สำเร็จ', 'ลบสินค้าเรียบร้อยแล้ว', 'success');
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            Swal.fire('Error', 'ไม่สามารถลบสินค้าได้', 'error');
          }
        });
      }
    });
  }
} 