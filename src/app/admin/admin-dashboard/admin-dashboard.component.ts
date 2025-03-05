import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faHome, 
  faCoffee, 
  faShoppingCart, 
  faUsers, 
  faChartBar,
  faSignOutAlt,
  faArrowLeft,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterModule, FontAwesomeModule, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  faHome = faHome;
  faCoffee = faCoffee;
  faShoppingCart = faShoppingCart;
  faUsers = faUsers;
  faChartBar = faChartBar;
  faSignOutAlt = faSignOutAlt;
  faArrowLeft = faArrowLeft;
  faHistory = faHistory;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.isAdmin$.subscribe((isAdmin: boolean) => {
      if (!isAdmin) {
        this.router.navigate(['/']);
      }
    });
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
} 