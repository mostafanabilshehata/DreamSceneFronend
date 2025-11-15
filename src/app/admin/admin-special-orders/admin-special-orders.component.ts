import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AlertService } from '../../services/alert.service';
import { SpecialOrder } from '../../models/api.models';

@Component({
  selector: 'app-admin-special-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-special-orders.component.html',
  styleUrls: ['./admin-special-orders.component.css']
})
export class AdminSpecialOrdersComponent implements OnInit {
  specialOrders: SpecialOrder[] = [];
  loading: boolean = false;
  selectedOrder: SpecialOrder | null = null;
  showDetailModal: boolean = false;
  showImagePreview: boolean = false;
  fullScreenImageUrl: string = '';
  adminNotes: string = '';

  constructor(
    private apiService: ApiService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadSpecialOrders();
  }

  loadSpecialOrders(): void {
    this.loading = true;
    this.apiService.getAllSpecialOrders().subscribe({
      next: (orders) => {
        this.specialOrders = orders;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading special orders:', err);
        this.alertService.error('Loading Failed', 'Failed to load special orders');
        this.loading = false;
      }
    });
  }

  getImages(imageUrls: string | undefined): string[] {
    if (!imageUrls) return [];
    return imageUrls.split(',').filter(url => url.trim());
  }

  openDetailModal(order: SpecialOrder): void {
    this.selectedOrder = order;
    this.adminNotes = order.adminNotes || '';
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedOrder = null;
    this.adminNotes = '';
  }

  openFullScreenImage(imageUrl: string): void {
    this.fullScreenImageUrl = imageUrl;
    this.showImagePreview = true;
  }

  closeFullScreenImage(): void {
    this.showImagePreview = false;
    this.fullScreenImageUrl = '';
  }

  updateStatus(status: string): void {
    if (!this.selectedOrder) return;

    this.apiService.updateSpecialOrderStatus(
      this.selectedOrder.id,
      status,
      this.adminNotes
    ).subscribe({
      next: (updatedOrder) => {
        console.log('Status updated:', updatedOrder);
        this.alertService.success('Status Updated', `Order status changed to ${status}`);
        this.loadSpecialOrders();
        this.closeDetailModal();
      },
      error: (err) => {
        console.error('Error updating status:', err);
        this.alertService.error('Update Failed', 'Failed to update order status');
      }
    });
  }

  deleteOrder(id: number): void {
    this.apiService.deleteSpecialOrder(id).subscribe({
      next: () => {
        console.log('Special order deleted:', id);
        this.alertService.success('Order Deleted', 'Special order has been deleted');
        this.loadSpecialOrders();
        this.closeDetailModal();
      },
      error: (err) => {
        console.error('Error deleting order:', err);
        this.alertService.error('Delete Failed', 'Failed to delete special order');
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'COMPLETED': return 'status-completed';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
