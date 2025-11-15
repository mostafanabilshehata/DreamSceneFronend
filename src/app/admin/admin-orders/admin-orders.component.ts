import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AlertService } from '../../services/alert.service';
import { Order } from '../../models/api.models';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css']
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading: boolean = false;
  selectedOrder: Order | null = null;
  showDetailsModal: boolean = false;
  showRejectModal: boolean = false;
  rejectionReason: string = '';
  orderToReject: Order | null = null;

  constructor(
    private apiService: ApiService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.apiService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Most recent first
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading = false;
      }
    });
  }

  viewOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedOrder = null;
  }

  updateOrderStatus(orderId: number, newStatus: string): void {
    // Show custom confirmation dialog (we'll handle this with a modal instead of confirm)
    this.apiService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.alertService.success('Status Updated', `Order status has been changed to ${newStatus} successfully`);
        this.loadOrders();
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        this.alertService.error('Update Failed', 'Failed to update order status. Please try again.');
      }
    });
  }

  openRejectModal(order: Order): void {
    this.orderToReject = order;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.orderToReject = null;
    this.rejectionReason = '';
  }

  confirmReject(): void {
    if (!this.orderToReject) return;
    
    if (!this.rejectionReason.trim()) {
      this.alertService.warning('Rejection Reason Required', 'Please provide a reason for rejecting this order');
      return;
    }

    this.apiService.updateOrderStatus(
      this.orderToReject.id, 
      'REJECTED', 
      this.rejectionReason
    ).subscribe({
      next: () => {
        this.alertService.success('Order Rejected', 'The order has been rejected successfully');
        this.closeRejectModal();
        this.loadOrders();
      },
      error: (err) => {
        console.error('Error rejecting order:', err);
        this.alertService.error('Rejection Failed', 'Failed to reject the order. Please try again.');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'APPROVED': return 'badge-approved';
      case 'COMPLETED': return 'badge-completed';
      case 'REJECTED': return 'badge-rejected';
      default: return '';
    }
  }

  getTotalAmount(order: Order): number {
    return order.totalAmount || order.items.reduce((total, item) => {
      if (item.type === 'RENT' && item.rentDays) {
        return total + (item.price * item.quantity * item.rentDays);
      }
      return total + (item.price * item.quantity);
    }, 0);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
