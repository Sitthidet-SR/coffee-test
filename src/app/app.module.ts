import { NgOptimizedImage } from '@angular/common';
import { NgModule } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@NgModule({
  imports: [
    // ... other imports
    NgOptimizedImage
  ],
  providers: [
    CookieService,
    // ... other providers
  ]
})
export class AppModule { } 