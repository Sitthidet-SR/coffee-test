import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminGuard } from '../guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products.component')
          .then(m => m.ProductsComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/orders.component')
          .then(m => m.OrdersComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component')
          .then(m => m.UsersComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.component')
          .then(m => m.ReportsComponent)
      },
      {
        path: 'activities',
        loadComponent: () => import('./pages/activities/activities.component')
          .then(m => m.ActivitiesComponent)
      }
    ]
  }
]; 