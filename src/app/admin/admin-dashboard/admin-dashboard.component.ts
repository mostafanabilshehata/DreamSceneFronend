import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  adminName: string = 'Admin';
  sidebarOpen: boolean = false;
  
  stats = {
    totalCategories: 0,
    totalItems: 0,
    totalPartners: 0,
    totalOrders: 0
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Load admin name
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      this.adminName = userData.username || 'Admin';
    }
    
    // Load statistics
    this.loadStats();
  }
  
  loadStats(): void {
    forkJoin({
      categories: this.apiService.getAllCategories(),
      items: this.apiService.getAllItems(),
      partners: this.apiService.getAllPartners(),
      orders: this.apiService.getAllOrders()
    }).subscribe({
      next: (results) => {
        this.stats.totalCategories = results.categories.length;
        this.stats.totalItems = results.items.length;
        this.stats.totalPartners = results.partners.length;
        this.stats.totalOrders = results.orders.length;
      },
      error: (err) => {
        console.error('Error loading stats:', err);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth <= 991) {
      this.sidebarOpen = false;
    }
  }
}
