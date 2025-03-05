import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-md p-6 text-center">
        <h1 class="text-2xl font-bold text-red-600 mb-4">เกิดข้อผิดพลาด</h1>
        <p class="text-gray-700">{{ errorMessage }}</p>
      </div>
    </div>
  `
})
export class ErrorComponent implements OnInit {
  errorMessage: string = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.errorMessage = params['message'];
      }
    });
  }
} 