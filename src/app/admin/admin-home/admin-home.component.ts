import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.css']
})
export class AdminHomeComponent implements OnInit {
  stats = {
    categories: 0,
    products: 0,
    partners: 0,
    orders: 0,
    specialOrders: 0
  };
  
  loading = true;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;

    // Load all stats in parallel
    Promise.all([
      this.apiService.getAllCategories().toPromise(),
      this.apiService.getAllItems().toPromise(),
      this.apiService.getAllPartners().toPromise(),
      this.apiService.getAllOrders().toPromise(),
      this.apiService.getAllSpecialOrders().toPromise()
    ]).then(([categories, products, partners, orders, specialOrders]) => {
      this.stats.categories = categories?.length || 0;
      this.stats.products = products?.length || 0;
      this.stats.partners = partners?.length || 0;
      this.stats.orders = orders?.length || 0;
      this.stats.specialOrders = specialOrders?.length || 0;
      this.loading = false;
    }).catch(err => {
      console.error('Error loading stats:', err);
      this.loading = false;
    });
  }
}
