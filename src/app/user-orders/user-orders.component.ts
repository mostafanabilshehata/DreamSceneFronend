import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AlertService } from '../services/alert.service';
import { Order } from '../models/api.models';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.css'
})
export class UserOrdersComponent implements OnInit {
  searchEmail: string = '';
  orders: Order[] = [];
  loading: boolean = false;
  searched: boolean = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Check if email or search term is provided in query params
    this.route.queryParams.subscribe(params => {
      const emailParam = params['email'] || params['search'];
      if (emailParam && emailParam.trim()) {
        this.searchEmail = emailParam.trim();
        // Use setTimeout to ensure component is fully initialized
        setTimeout(() => {
          this.searchOrders();
        }, 100);
      }
    });
  }

  searchOrders(): void {
    if (!this.searchEmail || !this.searchEmail.trim()) {
      this.alertService.warning('Input Required', 'Please enter your email or phone number');
      return;
    }
    
    this.searchEmail = this.searchEmail.trim();

    this.loading = true;
    this.searched = true;

    this.apiService.searchOrders(this.searchEmail).subscribe({
      next: (orders) => {
        this.orders = orders.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Most recent first
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
        this.orders = [];
        this.loading = false;
        this.alertService.error('Error Fetching Orders', 'Could not retrieve your orders. Please check your email/phone and try again.');
      }
    });
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'PENDING': return 'bg-warning text-dark';
      case 'APPROVED': return 'bg-info text-white';
      case 'COMPLETED': return 'bg-success';
      case 'REJECTED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'PENDING': return 'fa-clock';
      case 'APPROVED': return 'fa-check-circle';
      case 'COMPLETED': return 'fa-check-double';
      case 'REJECTED': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  calculateOrderTotal(order: Order): number {
    return order.items.reduce((total, item) => {
      if (item.type === 'RENT' && item.rentDays) {
        return total + (item.price * item.quantity * item.rentDays);
      }
      return total + (item.price * item.quantity);
    }, 0);
  }
}
