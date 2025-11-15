import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ImageUploadService } from '../../services/image-upload.service';
import { AlertService } from '../../services/alert.service';
import { Item, Category, Subcategory } from '../../models/api.models';

@Component({
  selector: 'app-admin-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.css']
})
export class AdminProductsComponent implements OnInit {
  items: Item[] = [];
  categories: Category[] = [];
  loading: boolean = false;
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  uploadingImage: boolean = false;
  showImagePreview: boolean = false;
  fullScreenImageUrl: string = '';
  // Cache for subcategories by category id
  subcategoriesMap: { [categoryId: number]: Subcategory[] } = {};
  loadingSubcategories: boolean = false;
  
  // Image upload states
  newItemImagePreview: string = '';
  newItemImageFile: File | null = null;
  editItemImagePreview: string = '';
  editItemImageFile: File | null = null;
  
  newItem = {
    name: '',
    description: '',
    salePrice: 0,
    rentPrice: 0,
    availability: 'SALE' as 'SALE' | 'RENT' | 'BOTH',
    stockQuantity: 0,
    categoryId: 0,
    subcategoryId: 0,
    imageCover: '',
    rating: 0
  };

  editItem: any = {};

  constructor(
    private apiService: ApiService,
    private imageUploadService: ImageUploadService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadItems();
    this.loadCategories();
  }

  loadItems(): void {
    this.loading = true;
    this.apiService.getAllItems().subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading items:', err);
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.apiService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  openAddItemModal(): void {
    this.newItem = {
      name: '',
      description: '',
      salePrice: 0,
      rentPrice: 0,
      availability: 'SALE' as 'SALE' | 'RENT' | 'BOTH',
      stockQuantity: 0,
      categoryId: 0,
      subcategoryId: 0,
      imageCover: '',
      rating: 0
    };
    this.newItemImagePreview = '';
    this.newItemImageFile = null;
    this.showAddModal = true;
  }

  openEditItemModal(item: Item): void {
    this.editItem = { 
      ...item,
      categoryId: Number(item.categoryId),
      subcategoryId: Number(item.subcategoryId)
    };
    
    this.editItemImagePreview = item.imageCover || '';
    this.editItemImageFile = null;
    
    // Load subcategories first, then show modal
    if (this.editItem.categoryId && this.editItem.categoryId > 0) {
      this.loadSubcategoriesForCategory(this.editItem.categoryId, () => {
        this.showEditModal = true;
      });
    } else {
      this.showEditModal = true;
    }
  }

  onCategoryChange(categoryId: number, isEdit: boolean = false): void {
    // Reset subcategory when category changes
    if (isEdit) {
      this.editItem.subcategoryId = 0;
      if (categoryId) this.loadSubcategoriesForCategory(categoryId);
    } else {
      this.newItem.subcategoryId = 0;
      if (categoryId) this.loadSubcategoriesForCategory(categoryId);
    }
  }

  loadSubcategoriesForCategory(categoryId: number, callback?: () => void): void {
    if (!categoryId) {
      if (callback) callback();
      return;
    }
    // If already cached, execute callback and return
    if (this.subcategoriesMap[categoryId]) {
      if (callback) callback();
      return;
    }

    this.loadingSubcategories = true;
    this.apiService.getSubcategoriesByCategory(categoryId).subscribe({
      next: (subs) => {
        this.subcategoriesMap[categoryId] = subs;
        this.loadingSubcategories = false;
        if (callback) callback();
      },
      error: (err) => {
        console.error('Error loading subcategories for category', categoryId, err);
        this.subcategoriesMap[categoryId] = [];
        this.loadingSubcategories = false;
        if (callback) callback();
      }
    });
  }

  async onNewItemImageSelect(event: any): Promise<void> {
    try {
      const result = await this.imageUploadService.handleImageSelect(event);
      this.newItemImageFile = result.file;
      this.newItemImagePreview = result.preview;
    } catch (error) {
      this.alertService.error('Image Error', String(error));
    }
  }

  async onEditItemImageSelect(event: any): Promise<void> {
    try {
      const result = await this.imageUploadService.handleImageSelect(event);
      this.editItemImageFile = result.file;
      this.editItemImagePreview = result.preview;
    } catch (error) {
      this.alertService.error('Image Error', String(error));
    }
  }

  openFullScreenImage(imageUrl: string): void {
    this.fullScreenImageUrl = imageUrl;
    this.showImagePreview = true;
  }

  closeFullScreenImage(): void {
    this.showImagePreview = false;
    this.fullScreenImageUrl = '';
  }

  async saveItem(): Promise<void> {
    // Upload image if selected
    if (this.newItemImageFile) {
      this.uploadingImage = true;
      try {
        const response = await this.imageUploadService.uploadImage(this.newItemImageFile).toPromise();
        this.newItem.imageCover = response!.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        this.alertService.error('Upload Failed', 'Failed to upload image. Please try again.');
        this.uploadingImage = false;
        return;
      }
      this.uploadingImage = false;
    }
    
    this.apiService.createItem(this.newItem).subscribe({
      next: (item) => {
        console.log('Item created successfully:', item);
        this.alertService.success('Item Created', 'Item has been created successfully!');
        this.showAddModal = false;
        this.loadItems();
        // Reset form
        this.newItem = { 
          name: '', 
          description: '', 
          salePrice: 0, 
          rentPrice: 0, 
          availability: 'SALE' as 'SALE' | 'RENT' | 'BOTH', 
          stockQuantity: 0, 
          categoryId: 0, 
          subcategoryId: 0, 
          imageCover: '', 
          rating: 0 
        };
        this.newItemImagePreview = '';
        this.newItemImageFile = null;
      },
      error: (error) => {
        console.error('Error creating item:', error);
        this.alertService.error('Creation Failed', 'Failed to create item: ' + (error.error?.message || error.message || 'Unknown error'));
      }
    });
  }

  async updateItem(): Promise<void> {
    // Upload image if selected
    if (this.editItemImageFile) {
      this.uploadingImage = true;
      try {
        const response = await this.imageUploadService.uploadImage(this.editItemImageFile).toPromise();
        this.editItem.imageCover = response!.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        this.alertService.error('Upload Failed', 'Failed to upload image. Please try again.');
        this.uploadingImage = false;
        return;
      }
      this.uploadingImage = false;
    }
    
    this.apiService.updateItem(this.editItem.id!, this.editItem).subscribe({
      next: (item) => {
        console.log('Item updated successfully:', item);
        this.alertService.success('Item Updated', 'Item has been updated successfully!');
        this.showEditModal = false;
        this.loadItems();
        // Reset edit state
        this.editItemImagePreview = '';
        this.editItemImageFile = null;
      },
      error: (error) => {
        console.error('Error updating item:', error);
        this.alertService.error('Update Failed', 'Failed to update item: ' + (error.error?.message || error.message || 'Unknown error'));
      }
    });
  }

  deleteItem(id: number): void {
    // Removed confirm() - action will be confirmed by success alert
    this.apiService.deleteItem(id).subscribe({
      next: () => {
        console.log('Item deleted successfully');
        this.alertService.success('Item Deleted', 'Item has been deleted successfully!');
        this.loadItems();
      },
      error: (error) => {
        console.error('Error deleting item:', error);
        this.alertService.error('Deletion Failed', 'Failed to delete item: ' + (error.error?.message || error.message || 'Unknown error'));
      }
    });
  }

  getSubcategories(categoryId: number): Subcategory[] {
    if (!categoryId) return [];
    // Prefer cached map
    if (this.subcategoriesMap[categoryId]) return this.subcategoriesMap[categoryId];

    // Fallback to category.subcategories if present
    const category = this.categories.find(c => c.id === categoryId);
    if (category?.subcategories && category.subcategories.length) {
      // cache it for future
      this.subcategoriesMap[categoryId] = category.subcategories;
      return category.subcategories;
    }

    // Trigger a load and return empty for now (UI will update when loaded)
    this.loadSubcategoriesForCategory(categoryId);
    return [];
  }

  getAvailabilityBadgeClass(availability: string): string {
    switch (availability) {
      case 'SALE': return 'badge-sale';
      case 'RENT': return 'badge-rent';
      case 'BOTH': return 'badge-both';
      default: return '';
    }
  }

  getStockStatusClass(stock: number): string {
    if (stock === 0) return 'out-of-stock';
    if (stock < 10) return 'low-stock';
    return 'in-stock';
  }

  // Compare function for select dropdowns to match by id
  compareById(item1: any, item2: any): boolean {
    return item1 && item2 && Number(item1) === Number(item2);
  }
}
