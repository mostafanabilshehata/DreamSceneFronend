import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ImageUploadService } from '../../services/image-upload.service';
import { AlertService } from '../../services/alert.service';
import { Partner } from '../../models/api.models';

@Component({
  selector: 'app-admin-partners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-partners.component.html',
  styleUrls: ['./admin-partners.component.css']
})
export class AdminPartnersComponent implements OnInit {
  partners: Partner[] = [];
  loading: boolean = false;
  uploadingImage: boolean = false;
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showImagePreview: boolean = false;
  fullScreenImageUrl: string = '';
  
  // Image preview and upload
  newPartnerImagePreview: string = '';
  newPartnerImageFile: File | null = null;
  editPartnerImagePreview: string = '';
  editPartnerImageFile: File | null = null;
  
  newPartner = {
    title: '',
    category: '',
    description: '',
    icon: '',
    imageUrl: '',
    gradient: '#667eea, #764ba2',
    since: '',
    rating: '0'
  };
  
  editPartner: Partner = {
    id: 0,
    title: '',
    category: '',
    description: '',
    icon: '',
    imageUrl: '',
    gradient: '#667eea, #764ba2',
    since: '',
    rating: '0'
  };

  constructor(
    private apiService: ApiService,
    private imageUploadService: ImageUploadService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    this.loading = true;
    this.apiService.getAllPartners().subscribe({
      next: (partners) => {
        this.partners = partners;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading partners:', err);
        this.loading = false;
      }
    });
  }

  openAddPartnerModal(): void {
    this.newPartner = {
      title: '',
      category: '',
      description: '',
      icon: '',
      imageUrl: '',
      gradient: '#667eea, #764ba2',
      since: '',
      rating: '0'
    };
    this.newPartnerImagePreview = '';
    this.newPartnerImageFile = null;
    this.showAddModal = true;
  }
  
  openEditPartnerModal(partner: Partner): void {
    this.editPartner = { ...partner };
    this.editPartnerImagePreview = partner.imageUrl || '';
    this.editPartnerImageFile = null;
    this.showEditModal = true;
  }
  
  closeAddModal(): void {
    this.showAddModal = false;
    this.newPartnerImagePreview = '';
    this.newPartnerImageFile = null;
  }
  
  closeEditModal(): void {
    this.showEditModal = false;
    this.editPartnerImagePreview = '';
    this.editPartnerImageFile = null;
  }
  
  openFullScreenImage(imageUrl: string): void {
    this.fullScreenImageUrl = imageUrl;
    this.showImagePreview = true;
  }
  
  closeFullScreenImage(): void {
    this.showImagePreview = false;
    this.fullScreenImageUrl = '';
  }
  
  async onNewPartnerImageSelect(event: any): Promise<void> {
    try {
      const result = await this.imageUploadService.handleImageSelect(event);
      this.newPartnerImageFile = result.file;
      this.newPartnerImagePreview = result.preview;
    } catch (error) {
      this.alertService.error('Image Error', String(error));
    }
  }
  
  async onEditPartnerImageSelect(event: any): Promise<void> {
    try {
      const result = await this.imageUploadService.handleImageSelect(event);
      this.editPartnerImageFile = result.file;
      this.editPartnerImagePreview = result.preview;
    } catch (error) {
      this.alertService.error('Image Error', String(error));
    }
  }

  async savePartner(): Promise<void> {
    // Upload image if selected
    if (this.newPartnerImageFile) {
      this.uploadingImage = true;
      try {
        const response = await this.imageUploadService.uploadImage(this.newPartnerImageFile).toPromise();
        this.newPartner.imageUrl = response!.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        this.alertService.error('Upload Failed', 'Failed to upload image. Please try again.');
        this.uploadingImage = false;
        return;
      }
      this.uploadingImage = false;
    }
    
    this.apiService.createPartner(this.newPartner).subscribe({
      next: (partner) => {
        console.log('Partner created:', partner);
        this.alertService.success('Partner Created', 'Partner has been created successfully!');
        this.loadPartners();
        this.closeAddModal();
      },
      error: (err) => {
        console.error('Error creating partner:', err);
        this.alertService.error('Creation Failed', 'Failed to create partner. Please try again.');
      }
    });
  }
  
  async updatePartner(): Promise<void> {
    // Upload image if selected
    if (this.editPartnerImageFile) {
      this.uploadingImage = true;
      try {
        const response = await this.imageUploadService.uploadImage(this.editPartnerImageFile).toPromise();
        this.editPartner.imageUrl = response!.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        this.alertService.error('Upload Failed', 'Failed to upload image. Please try again.');
        this.uploadingImage = false;
        return;
      }
      this.uploadingImage = false;
    }
    
    this.apiService.updatePartner(this.editPartner.id, this.editPartner).subscribe({
      next: (partner) => {
        console.log('Partner updated:', partner);
        this.alertService.success('Partner Updated', 'Partner has been updated successfully!');
        this.loadPartners();
        this.closeEditModal();
      },
      error: (err) => {
        console.error('Error updating partner:', err);
        this.alertService.error('Update Failed', 'Failed to update partner. Please try again.');
      }
    });
  }
  
  deletePartner(id: number): void {
    this.apiService.deletePartner(id).subscribe({
      next: () => {
        console.log('Partner deleted:', id);
        this.alertService.success('Partner Deleted', 'Partner has been deleted successfully!');
        this.loadPartners();
      },
      error: (err) => {
        console.error('Error deleting partner:', err);
        this.alertService.error('Deletion Failed', 'Failed to delete partner. Please try again.');
      }
    });
  }

  confirmDelete(id: number): void {
    if (confirm('Are you sure you want to delete this partner?')) {
      // TODO: Call API to delete partner
      console.log('Deleting partner:', id);
      this.loadPartners();
    }
  }

  getGradientStyle(gradient: string): any {
    return {
      background: `linear-gradient(135deg, ${gradient})`
    };
  }
}
