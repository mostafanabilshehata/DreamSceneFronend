import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Category, Subcategory } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadCategories();
  }

  loadCategories(): void {
    this.apiService.getAllCategories().subscribe({
      next: (categories) => {
        this.categoriesSubject.next(categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  getCategoryById(id: number): Observable<Category> {
    return this.apiService.getCategoryById(id);
  }

  getCategoryWithSubcategories(id: number): Observable<Category> {
    return this.apiService.getCategoryWithSubcategories(id);
  }

  getSubcategoriesByCategory(categoryId: number): Observable<Subcategory[]> {
    return this.apiService.getSubcategoriesByCategory(categoryId);
  }

  refreshCategories(): void {
    this.loadCategories();
  }
}
