import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { Category, Subcategory } from '../models/api.models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  categoryId: number | null = null;
  category: Category | null = null;
  subcategories: Subcategory[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.categoryId = +id;
        this.loadCategorySubcategories();
      } else {
        this.loadAllCategories();
      }
    });
  }

  loadCategorySubcategories(): void {
    if (!this.categoryId) return;
    
    this.loading = true;
    this.error = null;
    
    this.apiService.getCategoryById(this.categoryId).subscribe({
      next: (category) => {
        this.category = category;
      },
      error: (err) => {
        console.error('Error loading category:', err);
        this.error = 'Failed to load category';
      }
    });

    this.apiService.getSubcategoriesByCategory(this.categoryId).subscribe({
      next: (subcategories) => {
        this.subcategories = subcategories;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading subcategories:', err);
        this.error = 'Failed to load subcategories';
        this.loading = false;
      }
    });
  }

  loadAllCategories(): void {
    // If no specific category, show all categories
    this.loading = false;
  }
}
