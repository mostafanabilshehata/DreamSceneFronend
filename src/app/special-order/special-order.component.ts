import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { ImageUploadService } from '../services/image-upload.service';
import { AlertService } from '../services/alert.service';
import { SpecialOrderRequest } from '../models/api.models';

@Component({
  selector: 'app-special-order',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './special-order.component.html',
  styleUrls: ['./special-order.component.css']
})
export class SpecialOrderComponent {
  orderRequest: SpecialOrderRequest = {
    userName: '',
    userEmail: '',
    description: '',
    imageUrls: ''
  };

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  uploadingImages: boolean = false;
  submitting: boolean = false;

  constructor(
    private apiService: ApiService,
    private imageUploadService: ImageUploadService,
    private alertService: AlertService
  ) {
    // Load user info from localStorage if logged in
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    if (username) this.orderRequest.userName = username;
    if (email) this.orderRequest.userEmail = email;
  }

  async onImagesSelect(event: any): Promise<void> {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        this.alertService.error('Invalid File', `${file.name} is not an image file`);
        continue;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.error('File Too Large', `${file.name} exceeds 5MB limit`);
        continue;
      }

      // Add to selected files
      this.selectedFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  async submitOrder(): Promise<void> {
    // Validation
    if (!this.orderRequest.userName.trim()) {
      this.alertService.error('Validation Error', 'Please enter your name');
      return;
    }

    if (!this.orderRequest.userEmail.trim()) {
      this.alertService.error('Validation Error', 'Please enter your email');
      return;
    }

    if (!this.orderRequest.description.trim()) {
      this.alertService.error('Validation Error', 'Please describe your special order');
      return;
    }

    this.submitting = true;

    // Upload images if any
    if (this.selectedFiles.length > 0) {
      this.uploadingImages = true;
      const uploadedUrls: string[] = [];

      try {
        for (const file of this.selectedFiles) {
          const response = await this.imageUploadService.uploadImage(file).toPromise();
          if (response && response.imageUrl) {
            uploadedUrls.push(response.imageUrl);
          }
        }
        this.orderRequest.imageUrls = uploadedUrls.join(',');
      } catch (error) {
        console.error('Error uploading images:', error);
        this.alertService.error('Upload Failed', 'Failed to upload images. Please try again.');
        this.uploadingImages = false;
        this.submitting = false;
        return;
      }
      this.uploadingImages = false;
    }

    // Submit order
    this.apiService.createSpecialOrder(this.orderRequest).subscribe({
      next: (order) => {
        console.log('Special order created:', order);
        this.alertService.success('Order Submitted', 'Your special order has been submitted successfully! We will contact you soon.');
        this.resetForm();
        this.submitting = false;
      },
      error: (err) => {
        console.error('Error creating special order:', err);
        this.alertService.error('Submission Failed', 'Failed to submit your order. Please try again.');
        this.submitting = false;
      }
    });
  }

  resetForm(): void {
    this.orderRequest = {
      userName: localStorage.getItem('username') || '',
      userEmail: localStorage.getItem('email') || '',
      description: '',
      imageUrls: ''
    };
    this.selectedFiles = [];
    this.imagePreviews = [];
  }
}
