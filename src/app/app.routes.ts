import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';
import { CheckoutComponent } from './checkout/checkout.component';
import { OrdersComponent } from './orders/orders.component';
import { ProfileComponent } from './profile/profile.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorComponent } from './error/error.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';

const apiConnectivityGuard = () => {
  const router = inject(Router);
  
  // Check if API is accessible
  return fetch('http://13.239.242.215:5000/api/health')
    .then(() => true)
    .catch(() => {
      // Redirect to an error page if API is not accessible
      router.navigate(['/error'], { 
        queryParams: { 
          message: 'Unable to connect to server. Please try again later.' 
        }
      });
      return false;
    });
};

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    {
        path: 'admin',
        loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
        canActivate: [AuthGuard, AdminGuard]
    },
    {
        path: 'checkout',
        component: CheckoutComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'orders',
        component: OrdersComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'error',
        component: ErrorComponent
    },
    {
        path: 'products',
        canActivate: [apiConnectivityGuard],
        loadComponent: () => import('./product/product.component').then(m => m.ProductComponent)
    },
    {
        path: 'reset-password',
        component: ResetPasswordComponent
    },
    {
        path: 'api/users/verify-email',
        component: VerifyEmailComponent
    },
    {
        path: 'verify-email',
        component: VerifyEmailComponent
    },
    // Wildcard route for 404 page
    { path: '**', component: NotFoundComponent }
];
