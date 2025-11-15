import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ImageUploadService } from '../../services/image-upload.service';
import { AlertService } from '../../services/alert.service';
import { Category, Subcategory } from '../../models/api.models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrls: ['./admin-categories.component.css']
})
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  loading: boolean = false;
  uploadingImage: boolean = false;
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showAddSubcategoryModal: boolean = false;
  showEditSubcategoryModal: boolean = false;
  showImagePreview: boolean = false;
  fullScreenImageUrl: string = '';
  selectedCategory: Category | null = null;
  selectedSubcategory: Subcategory | null = null;
  
  // Image preview URLs
  newCategoryImagePreview: string = '';
  editCategoryImagePreview: string = '';
  newSubcategoryImagePreview: string = '';
  editSubcategoryImagePreview: string = '';
  
  // Selected files
  newCategoryImageFile: File | null = null;
  editCategoryImageFile: File | null = null;
  newSubcategoryImageFile: File | null = null;
  editSubcategoryImageFile: File | null = null;
  
  newCategory = {
    name: '',
    description: '',
    imageUrl: ''
  };
  
  editCategory = {
    id: 0,
    name: '',
    description: '',
    imageUrl: ''
  };
  
  newSubcategory = {
    name: '',
    imageUrl: '',
    categoryId: 0
  };
  
  editSubcategory = {
    id: 0,
    name: '',
    imageUrl: '',
    categoryId: 0
  };

  constructor(
    private apiService: ApiService,
    private imageUploadService: ImageUploadService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.apiService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.alertService.error('Load Failed', 'Failed to load categories. Please refresh the page.');
        this.loading = false;
      }
    });
  }

  openFullScreenImage(imageUrl: string): void {
    this.fullScreenImageUrl = imageUrl;
    this.showImagePreview = true;
  }

  closeFullScreenImage(): void {
    this.showImagePreview = false;
    this.fullScreenImageUrl = '';
  }

  openAddCategoryModal(): void {
    this.newCategory = { name: '', description: '', imageUrl: '' };
    this.newCategoryImagePreview = '';
    this.newCategoryImageFile = null;
    this.showAddModal = true;
  }
  
  openEditCategoryModal(category: Category): void {
    this.editCategory = {
      id: category.id,
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || ''
    };
    this.editCategoryImagePreview = category.imageUrl || '';
    this.editCategoryImageFile = null;
    this.showEditModal = true;
  }
  
  // Image selection handlers
  async onNewCategoryImageSelect(event: any): Promise<void> {
    try {
      const result = await this.imageUploadService.handleImageSelect(event);
      this.newCategoryImageFile = result.file;
      this.newCategoryImagePreview = result.preview;
    } catch (error) {
      this.alertService.error('Image Error', String(error));
    }
  }
  
  async onEditCategoryImageSelect(event: any): Promise<void> {
    try {
      const result = await this.imageUploadService.handleImageSelect(event);
      this.editCategoryImageFile = result.file;
      this.editCategoryImagePreview = result.preview;
    } catch (error) {
      this.alertService.error('Image Error', String(error));
    }
  }
  
  async onNewSubcategoryImageSelect(event: any): Promise<void> {
    try {
      const result = await this.imageUploadService.handleImageSelect(event);
      this.newSubcategoryImageFile = result.file;
      this.newSubcategoryImagePreview = result.preview;
    } catch (error) {
      this.alertService.error('Image Error', String(error));
    }
  }
  
  async onEditSubcategoryImageSelect(event: any): Promise<void> {
    try {
      const result = await this.imageUploadService.handleImageSelect(event);
      this.editSubcategoryImageFile = result.file;
      this.editSubcategoryImagePreview = result.preview;
    } catch (error) {
      this.alertService.error('Image Error', String(error));
    }
  }

  async saveCategory(): Promise<void> {
    // Upload image if selected
    if (this.newCategoryImageFile) {
      this.uploadingImage = true;
      try {
        const response = await this.imageUploadService.uploadImage(this.newCategoryImageFile).toPromise();
        this.newCategory.imageUrl = response!.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        this.alertService.error('Upload Failed', 'Failed to upload image. Please try again.');
        this.uploadingImage = false;
        return;
      }
      this.uploadingImage = false;
    }
    
    // Create category
    this.apiService.createCategory(this.newCategory).subscribe({
      next: (createdCategory) => {
        console.log('Category created:', createdCategory);
        this.alertService.success('Category Created', 'Category has been created successfully!');
        this.loadCategories();
        this.showAddModal = false;
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this.alertService.error('Creation Failed', 'Failed to create category: ' + (error.error?.message || error.message));
      }
    });
  }
  
  async updateCategory(): Promise<void> {
    // Upload image if selected
    if (this.editCategoryImageFile) {
      this.uploadingImage = true;
      try {
        const response = await this.imageUploadService.uploadImage(this.editCategoryImageFile).toPromise();
        this.editCategory.imageUrl = response!.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        this.alertService.error('Upload Failed', 'Failed to upload image. Please try again.');
        this.uploadingImage = false;
        return;
      }
      this.uploadingImage = false;
    }
    
    // Update category
    this.apiService.updateCategory(this.editCategory.id, this.editCategory).subscribe({
      next: (updatedCategory) => {
        console.log('Category updated:', updatedCategory);
        this.alertService.success('Category Updated', 'Category has been updated successfully!');
        this.loadCategories();
        this.showEditModal = false;
      },
      error: (error) => {
        console.error('Error updating category:', error);
        this.alertService.error('Update Failed', 'Failed to update category: ' + (error.error?.message || error.message));
      }
    });
  }

  deleteCategory(id: number): void {
    // Removed confirm() - action will be confirmed by success alert
    this.apiService.deleteCategory(id).subscribe({
      next: () => {
        console.log('Category deleted:', id);
        this.alertService.success('Category Deleted', 'Category and all its subcategories have been deleted successfully!');
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.alertService.error('Deletion Failed', 'Failed to delete category: ' + (error.error?.message || error.message));
      }
    });
  }

  openAddSubcategoryModal(category: Category): void {
    this.selectedCategory = category;
    this.newSubcategory = { name: '', imageUrl: '', categoryId: category.id };
    this.newSubcategoryImagePreview = '';
    this.newSubcategoryImageFile = null;
    this.showAddSubcategoryModal = true;
  }
  
  openEditSubcategoryModal(category: Category, subcategory: Subcategory): void {
    this.selectedCategory = category;
    this.editSubcategory = {
      id: subcategory.id,
      name: subcategory.name,
      imageUrl: subcategory.imageUrl || '',
      categoryId: category.id
    };
    this.editSubcategoryImagePreview = subcategory.imageUrl || '';
    this.editSubcategoryImageFile = null;
    this.showEditSubcategoryModal = true;
  }

  async saveSubcategory(): Promise<void> {
    // Upload image if selected
    if (this.newSubcategoryImageFile) {
      this.uploadingImage = true;
      try {
        const response = await this.imageUploadService.uploadImage(this.newSubcategoryImageFile).toPromise();
        this.newSubcategory.imageUrl = response!.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        this.alertService.error('Upload Failed', 'Failed to upload image. Please try again.');
        this.uploadingImage = false;
        return;
      }
      this.uploadingImage = false;
    }
    
    // Create subcategory
    this.apiService.createSubcategory(this.newSubcategory).subscribe({
      next: (createdSubcategory) => {
        console.log('Subcategory created:', createdSubcategory);
        this.alertService.success('Subcategory Created', 'Subcategory has been created successfully!');
        this.loadCategories();
        this.showAddSubcategoryModal = false;
      },
      error: (error) => {
        console.error('Error creating subcategory:', error);
        this.alertService.error('Creation Failed', 'Failed to create subcategory: ' + (error.error?.message || error.message));
      }
    });
  }
  
  async updateSubcategory(): Promise<void> {
    // Upload image if selected
    if (this.editSubcategoryImageFile) {
      this.uploadingImage = true;
      try {
        const response = await this.imageUploadService.uploadImage(this.editSubcategoryImageFile).toPromise();
        this.editSubcategory.imageUrl = response!.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        this.alertService.error('Upload Failed', 'Failed to upload image. Please try again.');
        this.uploadingImage = false;
        return;
      }
      this.uploadingImage = false;
    }
    
    // Update subcategory
    this.apiService.updateSubcategory(this.editSubcategory.id, this.editSubcategory).subscribe({
      next: (updatedSubcategory) => {
        console.log('Subcategory updated:', updatedSubcategory);
        this.alertService.success('Subcategory Updated', 'Subcategory has been updated successfully!');
        this.loadCategories();
        this.showEditSubcategoryModal = false;
      },
      error: (error) => {
        console.error('Error updating subcategory:', error);
        this.alertService.error('Update Failed', 'Failed to update subcategory: ' + (error.error?.message || error.message));
      }
    });
  }

  deleteSubcategory(subcategoryId: number): void {
    // Removed confirm() - action will be confirmed by success alert
    this.apiService.deleteSubcategory(subcategoryId).subscribe({
      next: () => {
        console.log('Subcategory deleted:', subcategoryId);
        this.alertService.success('Subcategory Deleted', 'Subcategory has been deleted successfully!');
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error deleting subcategory:', error);
        this.alertService.error('Deletion Failed', 'Failed to delete subcategory: ' + (error.error?.message || error.message));
      }
    });
  }
}
