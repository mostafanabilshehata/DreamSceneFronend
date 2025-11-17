import { Component, Input, OnInit } from '@angular/core';
import { NavComponent } from '../nav/nav.component';
import {Routes,RouterLink, RouterOutlet, ActivatedRoute } from '@angular/router';
import { NgClass, NgFor, CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { BasketService } from '../services/basket.service';
import { AlertService } from '../services/alert.service';
import { Item } from '../models/api.models';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [NavComponent,RouterLink, RouterOutlet,HttpClientModule,FormsModule,NgFor,CommonModule],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {
  @Input() id!:any;
  itemId: any;
  itemDetails: Item | null = null;
  loading: boolean = true;
  error: string | null = null;
  responsiveOptions: any[] =[];
  imageDetails: any[] = [];
  
  // For add to cart functionality
  selectedQuantity: number = 1;
  selectedRentDays: number = 1;
  addedToCart: boolean = false;
  
  constructor(
    private _ActivatedRoute: ActivatedRoute,
    private apiService: ApiService,
    private basketService: BasketService,
    private alertService: AlertService
  ) { }
    
  ngOnInit(): void {
    this._ActivatedRoute.paramMap.subscribe((params) => {
      this.itemId = params.get('id');
      if (this.itemId) {
        this.loadItemDetails(+this.itemId);
      } else if (this.id) {
        this.loadItemDetails(+this.id);
      }
    });

    this.responsiveOptions = [
    {
        breakpoint: '1024px',
        numVisible: 5
    },
    {
        breakpoint: '768px',
        numVisible: 3
    },
    {
        breakpoint: '560px',
        numVisible: 1
    }
];

  }
  
  loadItemDetails(id: number): void {
    this.loading = true;
    this.error = null;
    
    this.apiService.getItemById(id).subscribe({
      next: (item: Item) => {
        this.itemDetails = item;
        if (item.images && item.images.length > 0) {
          // Remove duplicates by filtering unique image URLs
          const uniqueImages = item.images.filter((img: any, index: number, self: any[]) => 
            index === self.findIndex((t: any) => t.imageUrl === img.imageUrl)
          );
          this.imageDetails = uniqueImages.map((img: any) => ({
            itemImageSrc: img.imageUrl,
            thumbnailImageSrc: img.imageUrl,
            alt: item.name
          }));
        } else if (item.imageCover) {
          this.imageDetails = [{
            itemImageSrc: item.imageCover,
            thumbnailImageSrc: item.imageCover,
            alt: item.name
          }];
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading item details:', err);
        this.error = 'Failed to load item details';
        this.loading = false;
      }
    });
  }

  addToBuy(): void {
    if (!this.itemDetails) return;
    
    if (!this.itemDetails.stockQuantity || this.itemDetails.stockQuantity === 0) {
      this.alertService.warning('Out of Stock', 'This item is currently out of stock!');
      return;
    }

    if (this.selectedQuantity > this.itemDetails.stockQuantity) {
      this.alertService.warning('Stock Limit', `Only ${this.itemDetails.stockQuantity} items available in stock!`);
      return;
    }

    this.basketService.addItem(this.itemDetails, 'SALE', this.selectedQuantity);
    this.showAddedToCartFeedback();
  }

  addToRent(): void {
    if (!this.itemDetails) return;
    
    if (!this.itemDetails.stockQuantity || this.itemDetails.stockQuantity === 0) {
      this.alertService.warning('Out of Stock', 'This item is currently out of stock!');
      return;
    }

    if (this.selectedQuantity > this.itemDetails.stockQuantity) {
      this.alertService.warning('Stock Limit', `Only ${this.itemDetails.stockQuantity} items available in stock!`);
      return;
    }

    if (this.selectedRentDays < 1) {
      this.alertService.warning('Invalid Rent Days', 'Please enter a valid number of rent days (minimum 1 day)!');
      return;
    }

    this.basketService.addItem(this.itemDetails, 'RENT', this.selectedQuantity, this.selectedRentDays);
    this.showAddedToCartFeedback();
  }

  addToCart(): void {
    if (!this.itemDetails) return;

    // Determine which type based on availability
    if (this.itemDetails.availability === 'SALE') {
      this.addToBuy();
    } else if (this.itemDetails.availability === 'RENT') {
      this.addToRent();
    } else {
      // For 'BOTH', add as SALE by default
      this.addToBuy();
    }
  }

  private showAddedToCartFeedback(): void {
    this.addedToCart = true;
    setTimeout(() => {
      this.addedToCart = false;
    }, 2000);
  }

  canBuy(): boolean {
    return this.itemDetails?.availability === 'SALE' || this.itemDetails?.availability === 'BOTH';
  }

  canRent(): boolean {
    return this.itemDetails?.availability === 'RENT' || this.itemDetails?.availability === 'BOTH';
  }

  isInStock(): boolean {
    return !!(this.itemDetails?.stockQuantity && this.itemDetails.stockQuantity > 0);
  }

}
