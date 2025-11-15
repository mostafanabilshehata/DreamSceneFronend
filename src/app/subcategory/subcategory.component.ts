import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Item, Subcategory } from '../models/api.models';

@Component({
  selector: 'app-subcategory',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './subcategory.component.html',
  styleUrls: ['./subcategory.component.css']
})
export class SubcategoryComponent implements OnInit {
  subcategoryId: number | null = null;
  subcategory: Subcategory | null = null;
  items: Item[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'] || params['category'];
      if (id && !isNaN(+id)) {
        this.subcategoryId = +id;
        this.loadSubcategoryItems();
      } else {
        this.error = 'Invalid subcategory ID';
        this.loading = false;
      }
    });
  }

  loadSubcategoryItems(): void {
    if (!this.subcategoryId) return;
    
    this.loading = true;
    this.error = null;
    
    console.log('Loading items for subcategory:', this.subcategoryId);
    
    this.apiService.getItemsBySubcategory(this.subcategoryId).subscribe({
      next: (items: Item[]) => {
        console.log('Items loaded:', items);
        this.items = items;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading items:', err);
        this.error = `Failed to load items: ${err.message || 'Unknown error'}`;
        this.loading = false;
      }
    });
  }
}

